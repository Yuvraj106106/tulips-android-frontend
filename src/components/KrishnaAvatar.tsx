import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Asset } from 'expo-asset';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const KrishnaAvatar: React.FC = () => {
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
    const material = new THREE.MeshStandardMaterial({ color: 0xFFBF00 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
  };

  const onContextCreate = async (gl: WebGLRenderingContext) => {
    if (!mounted.current) return;

    glRef.current = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
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
      const asset = Asset.fromModule(require('../../assets/krishna_hq.glb'));
      await asset.downloadAsync();
      const uri = asset.localUri!;
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();

      const loader = new GLTFLoader();
      loader.parse(
        buffer,
        '',
        (gltf) => {
          if (!mounted.current) return;
          const model = gltf.scene;

          // Keep the model's own materials/textures as-is — this is a
          // high-quality textured export, do NOT override with flat colors.
          model.traverse((child: any) => {
            if (child.isMesh && child.geometry) {
              child.geometry.computeVertexNormals();
            }
          });

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
          console.log('✅ Krishna HQ model loaded with original textures');
          renderOnce();
        },
        undefined,
        (error) => {
          console.error('GLTF parse error, falling back to sphere:', error);
          if (mounted.current) {
            renderFallbackSphere(scene);
            renderOnce();
          }
        }
      );
    } catch (e) {
      console.error('Model load error, falling back to sphere:', e);
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

export default KrishnaAvatar;
