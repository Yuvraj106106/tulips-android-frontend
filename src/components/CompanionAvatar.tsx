import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { Renderer, loadTextureAsync } from 'expo-three';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { GLTFLoader } from '../vendor/GLTFLoaderRN';
import { companions, CompanionId, DEFAULT_COMPANION } from '../companions/config';
// @ts-ignore
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils';
import { preloadAvatar, getPreloadedAvatar } from '../services/avatarPreloader';

interface CompanionAvatarProps {
  companionId?: CompanionId;
}

// Generic 3D avatar renderer, driven entirely by companion config.
// KrishnaAvatar.tsx is now a thin wrapper around this component — see that
// file for backwards compatibility notes.
const CompanionAvatar: React.FC<CompanionAvatarProps> = ({ companionId = DEFAULT_COMPANION }) => {
  const config = companions[companionId] ?? companions[DEFAULT_COMPANION]!;

  const rendererRef = useRef<Renderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const glRef = useRef<ExpoWebGLRenderingContext | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
      if (rendererRef.current) {
        if (typeof rendererRef.current.dispose === 'function') {
          rendererRef.current.dispose();
        }
        rendererRef.current = null;
      }
      sceneRef.current = null;
      cameraRef.current = null;
      glRef.current = null;
    };
  }, []);

  const renderFallbackSphere = (scene: THREE.Scene) => {
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: config.themeColor });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  };

  const finalizeTexture = (texture: THREE.Texture) => {
    if ('colorSpace' in texture) {
      (texture as any).colorSpace = (THREE as any).SRGBColorSpace ?? (texture as any).colorSpace;
    } else if ('encoding' in texture) {
      (texture as any).encoding = (THREE as any).sRGBEncoding ?? (texture as any).encoding;
    }
    // Non-power-of-two safety net: some source textures (e.g. krishna_hq's
    // 1920x1920 diffuse map) aren't power-of-two, and WebGL1 (what expo-gl
    // provides) silently drops such textures under the default
    // RepeatWrapping/mipmap filtering. Clamp + non-mipmap filtering makes
    // any texture size valid, POT or not.
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
  };

  // Loads (with caching, since several materials can share one image) and
  // applies textures to a model's materials, in priority order:
  //   1. materialTextureMap[materialName] — per-material override
  //   2. textureAsset — one shared texture applied to every material
  //   3. flat themeColor tint — fallback when no texture is configured
  //      (GLTFLoader can't decode embedded GLB textures under React Native,
  //      so untextured materials would otherwise render blank white)
  const applyMaterials = async (model: THREE.Object3D) => {
    const textureCache = new Map<number, THREE.Texture>();
    const loadCached = async (assetModule: number): Promise<THREE.Texture> => {
      if (textureCache.has(assetModule)) return textureCache.get(assetModule)!;
      const tex = await loadTextureAsync({ asset: assetModule });
      finalizeTexture(tex);
      textureCache.set(assetModule, tex);
      return tex;
    };

    let sharedTexture: THREE.Texture | undefined;
    if (config.textureAsset) {
      try {
        sharedTexture = await loadCached(config.textureAsset);
      } catch (e) {
        console.error(`Shared texture load failed for ${config.id}:`, e);
      }
    }

    const meshes: any[] = [];
    model.traverse((child: any) => {
      if (child.isMesh) meshes.push(child);
    });

    for (const child of meshes) {
      if (child.geometry) child.geometry.computeVertexNormals();
      if (!child.material) continue;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of materials) {
        const perMaterialAsset = config.materialTextureMap?.[mat.name];
        if (perMaterialAsset) {
          try {
            mat.map = await loadCached(perMaterialAsset);
          } catch (e) {
            console.error(`Texture load failed for material "${mat.name}":`, e);
          }
        } else if (sharedTexture) {
          mat.map = sharedTexture;
        } else if (mat.map) {
          // Embedded texture decoded directly by GLTFLoaderRN (no config
          // override needed) — still needs the same NPOT safety pass as
          // manually-loaded textures, or non-power-of-two embedded maps
          // (e.g. krishna_hq's 1920x1920 diffuse) will silently fail to
          // render under WebGL1 despite loading successfully.
          finalizeTexture(mat.map);
        }

        if (!mat.map) {
          mat.color = new THREE.Color(config.themeColor);
        }

        // Force a matte look regardless of the model's exported PBR
        // metalness/roughness values. Without an environment map (which
        // expo-gl/WebGL1 doesn't give us here), a high-metalness material
        // renders as a near-black silhouette with only tiny white specular
        // highlights from our directional lights — looks broken even when
        // the color/texture is applied correctly underneath. Flattening
        // metalness to 0 makes the diffuse color/texture actually visible.
        if ('metalness' in mat) mat.metalness = 0;
        if ('roughness' in mat) mat.roughness = 0.8;

        mat.needsUpdate = true;
      }
    }

    return textureCache.size > 0;
  };

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    if (!mounted.current) return;

    glRef.current = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.backgroundColor);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      30,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      100
    );
    cameraRef.current = camera;

    // Lighting tuned for PBR materials (the model already has its own textures/colors baked in)
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff0cc, 1.2);
    key.position.set(1, 2, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaabbff, 0.4);
    fill.position.set(-2, 1, 1);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(0, 2, -2);
    scene.add(rim);

    // TEMP DIAGNOSTIC: a bright red cube placed directly in front of the
    // camera's default resting spot, added unconditionally regardless of
    // whether the avatar model loads. If this cube is NOT visible, the
    // problem is in the GL render pipeline itself (context/surface/present),
    // not in the avatar model's transform or materials.
    const debugCube = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    debugCube.position.set(0, 0, 0);
    scene.add(debugCube);
    console.log('[CompanionAvatar][DEBUG] added test red cube at origin');

    camera.position.set(0, 0, 2);
    camera.lookAt(0, 0, 0);

    const renderOnce = () => {
      if (
        mounted.current &&
        rendererRef.current &&
        sceneRef.current &&
        cameraRef.current &&
        glRef.current
      ) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        glRef.current.endFrameEXP();
      }
    };

    // Render immediately with just the debug cube, before any (possibly
    // slow or failing) model loading — proves whether the GL pipeline
    // presents frames at all, independent of avatar loading.
    renderOnce();
    console.log('[CompanionAvatar][DEBUG] renderOnce() called with test cube only');

    try {
      // Load/parse via the preloader cache if available to enable instant rendering
      let gltf: any;
      const preloaded = getPreloadedAvatar(companionId);
      if (preloaded) {
        gltf = preloaded.gltf;
        console.log(`[CompanionAvatar] Using preloaded GLB for ${companionId}`);
      } else {
        console.log(`[CompanionAvatar] Preloaded GLB not found, fetching/parsing now for ${companionId}...`);
        const pre = await preloadAvatar(companionId);
        gltf = pre.gltf;
      }
      if (!mounted.current) return;

      // Safe deep cloning of skinned meshes and skeletons to avoid interference
      const model: THREE.Object3D = cloneSkeleton(gltf.scene ?? gltf);

      let meshCount = 0;
      let skinnedMeshCount = 0;
      model.traverse((child: any) => {
        if (child.isMesh) meshCount++;
        if (child.isSkinnedMesh) {
          skinnedMeshCount++;
          // FIX (Bug 3 — avatar invisible despite correct centering/scale):
          // SkinnedMesh.frustumCulled defaults to true, and Three.js computes
          // that culling test from the geometry's BIND-POSE bounding sphere
          // (local, un-skinned vertex data) — it does NOT account for the
          // actual GPU-side skinning deformation applied via the bone
          // matrices. This model has scale:[100,100,100] baked into the
          // RobotArmature/Hand.L/Hand.R bone nodes (Blender/FBX export
          // artifact), so the real, GPU-skinned on-screen result ends up
          // far outside the bind-pose bounding sphere used for culling —
          // Three.js incorrectly decides the mesh is off-frustum and drops
          // it from rendering entirely, silently. This is exactly why the
          // debug red cube (a plain non-skinned Mesh, whose bounding sphere
          // IS accurate) rendered fine while the avatar's skinned meshes
          // never appeared, even though position/scale math was correct.
          // Disabling frustum culling for skinned meshes is the standard
          // fix for this class of bug.
          child.frustumCulled = false;
        }
      });
      console.log(
        `[CompanionAvatar][DEBUG] cloned model — meshes: ${meshCount}, skinnedMeshes: ${skinnedMeshCount}, children: ${model.children.length}`
      );

      const texturedSomething = await applyMaterials(model);

      // Auto-center and scale to fit the view regardless of the model's
      // original export scale/origin — this makes framing work for any
      // companion model, not just one specific export's proportions.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      console.log(
        `[CompanionAvatar][DEBUG] bbox size: (${size.x.toFixed(4)}, ${size.y.toFixed(4)}, ${size.z.toFixed(4)}) center: (${center.x.toFixed(4)}, ${center.y.toFixed(4)}, ${center.z.toFixed(4)}) isEmpty: ${box.isEmpty()}`
      );

      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 2.2;
      const scale = maxDim > 0 ? targetSize / maxDim : 1;
      model.scale.setScalar(scale);
      // IMPORTANT: an Object3D's own .position is NOT affected by its own
      // .scale (scale only affects child geometry, not the object's own
      // translation). So centering must be done in already-scaled space —
      // otherwise (as with this model, whose center was ~90 units from
      // origin) the object ends up translated by the full unscaled center
      // offset while its geometry shrinks, landing far outside the camera's
      // view. Multiplying by `scale` here keeps the model at the origin.
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      scene.add(model);

      // DIAGNOSTIC: recompute the bbox AFTER scale/position are applied and
      // the model is in the scene graph, to directly confirm (not infer)
      // whether the model actually sits within camera view post-fix. This
      // is the "final on-screen bbox" check called out in the handoff as
      // more conclusive than the pre-transform numbers alone.
      model.updateMatrixWorld(true);
      const postBox = new THREE.Box3().setFromObject(model);
      const postSize = postBox.getSize(new THREE.Vector3());
      const postCenter = postBox.getCenter(new THREE.Vector3());
      console.log(
        `[CompanionAvatar][DEBUG] POST-TRANSFORM bbox size: (${postSize.x.toFixed(4)}, ${postSize.y.toFixed(4)}, ${postSize.z.toFixed(4)}) center: (${postCenter.x.toFixed(4)}, ${postCenter.y.toFixed(4)}, ${postCenter.z.toFixed(4)}) isEmpty: ${postBox.isEmpty()}`
      );

      // Frame the upper portion (head/shoulders) rather than the dead
      // center of the whole body, and pick a camera distance derived from
      // the model's actual (post-scale) height so this works regardless of
      // a given model's proportions.
      const scaledHeight = size.y * scale;
      const lookY = scaledHeight * 0.22;
      const halfFovRad = (camera.fov * Math.PI) / 360;
      const framedHeight = scaledHeight * 0.6;
      const distance = framedHeight / 2 / Math.tan(halfFovRad) + 0.6;

      camera.position.set(0, lookY, distance);
      camera.lookAt(0, lookY, 0);

      console.log(
        `[CompanionAvatar][DEBUG] maxDim: ${maxDim.toFixed(4)}, scale: ${scale.toFixed(4)}, scaledHeight: ${scaledHeight.toFixed(4)}, camera.position: (0, ${lookY.toFixed(4)}, ${distance.toFixed(4)}), camera.near: ${camera.near}, camera.far: ${camera.far}`
      );

      console.log(
        `✅ ${config.name} model loaded (companion: ${config.id}, textured: ${texturedSomething})`
      );
      renderOnce();
    } catch (e) {
      console.error(`Model load error for ${config.id}, falling back to sphere:`, e);
      if (mounted.current) {
        camera.position.set(0, 0, 3.5);
        camera.lookAt(0, 0, 0);
        renderFallbackSphere(scene);
        renderOnce();
      }
    }
  };

  return (
    <View style={styles.container}>
      <GLView style={styles.glView} onContextCreate={onContextCreate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%' },
  glView: { flex: 1 },
});

export default CompanionAvatar;

