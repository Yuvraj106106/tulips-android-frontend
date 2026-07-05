import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, loadAsync } from 'expo-three';
import * as THREE from 'three';
import { companions, CompanionId, DEFAULT_COMPANION } from '../companions/config';

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
  const glRef = useRef<WebGLRenderingContext | null>(null);
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

  // Some three.js versions default freshly-loaded textures to the wrong
  // color space, which can make correctly-loaded PBR textures look washed
  // out or flat even after they've actually arrived. This normalizes color
  // space and forces the GPU to re-upload once the image data is in.
  const normalizeMaterials = (model: THREE.Object3D) => {
    model.traverse((child: any) => {
      if (!child.isMesh) return;
      if (child.geometry) {
        child.geometry.computeVertexNormals();
      }
      if (!child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat: any) => {
        if (mat.map) {
          if ('colorSpace' in mat.map) {
            mat.map.colorSpace = (THREE as any).SRGBColorSpace ?? mat.map.colorSpace;
          } else if ('encoding' in mat.map) {
            mat.map.encoding = (THREE as any).sRGBEncoding ?? mat.map.encoding;
          }
          mat.map.needsUpdate = true;
        }
        mat.needsUpdate = true;
      });
    });
  };

  const onContextCreate = async (gl: WebGLRenderingContext) => {
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
    camera.position.set(0, 0.2, 3.5);
    camera.lookAt(0, 0.15, 0);
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

    try {
      // Using expo-three's own loadAsync (instead of a raw fetch + arrayBuffer +
      // GLTFLoader.parse) matters here: it pulls in expo-three's texture-loading
      // polyfill so GLTFLoader's internal image decoding goes through Expo's
      // asset pipeline instead of browser-only APIs (Image(), createImageBitmap)
      // that don't exist in React Native. Without this, geometry loads fine but
      // textures can silently fail and the model renders flat white.
      const gltf: any = await loadAsync(config.modelAsset);
      if (!mounted.current) return;

      const model: THREE.Object3D = gltf.scene ?? gltf;

      normalizeMaterials(model);

      // Auto-center and scale to fit the view regardless of the
      // model's original export scale/origin.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      if (maxDim > 0) {
        const targetSize = 2.2;
        const scale = targetSize / maxDim;
        model.scale.setScalar(scale);
      }
      model.position.y += 0.4;

      scene.add(model);
      console.log(`✅ ${config.name} model loaded (companion: ${config.id})`);
      renderOnce();
    } catch (e) {
      console.error(`Model load error for ${config.id}, falling back to sphere:`, e);
      if (mounted.current) {
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
