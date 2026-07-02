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
      if (sceneRef.current) {
        sceneRef.current = null;
      }
      if (cameraRef.current) {
        cameraRef.current = null;
      }
      if (glRef.current) {
        glRef.current = null;
      }
    };
  }, []);

  const onContextCreate = async (gl: WebGLRenderingContext) => {
    if (!mounted.current) return;

    glRef.current = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
    camera.position.set(0, 0.2, 3.5);
    camera.lookAt(0, 0.15, 0);
    cameraRef.current = camera;

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff5e0, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xfff0cc, 1.0);
    key.position.set(1, 2, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaabbff, 0.3);
    fill.position.set(-2, 1, 1);
    scene.add(fill);

    // ---------- MATERIALS (index-based) ----------
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x6b7fa3, roughness: 0.6, metalness: 0.0 }), // skin
      new THREE.MeshStandardMaterial({ color: 0xc9922a, roughness: 0.7, metalness: 0.1 }), // dhoti
      new THREE.MeshStandardMaterial({ color: 0xd4688a, roughness: 0.5, metalness: 0.0 }), // dupatta
      new THREE.MeshStandardMaterial({ color: 0xf0c040, roughness: 0.2, metalness: 0.9 }), // gold
      new THREE.MeshStandardMaterial({ color: 0xd4688a, roughness: 0.6, metalness: 0.0 }), // turban
      new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.8, metalness: 0.0 }), // garland
    ];

    const renderOnce = () => {
      if (mounted.current && rendererRef.current && sceneRef.current && cameraRef.current && glRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        glRef.current.endFrameEXP();
      }
    };

    try {
      const asset = Asset.fromModule(require('../../assets/krishna_300k_new.glb'));
      await asset.downloadAsync();
      const uri = asset.localUri!;
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();

      const loader = new GLTFLoader();
      loader.parse(buffer, '', (gltf) => {
        if (!mounted.current) return;
        const model = gltf.scene;

        // Assign materials by index
        model.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry.computeVertexNormals();
            // Use material index to assign
            if (child.material && child.material.index !== undefined) {
              const idx = child.material.index;
              if (idx < materials.length) {
                child.material = materials[idx];
              } else {
                child.material = materials[0]; // fallback
              }
            } else {
              child.material = materials[0]; // fallback
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += 0.4;
        scene.add(model);
        console.log('✅ Model Loaded with Indexed Materials');
        renderOnce();
      }, (error) => {
        console.error('GLTF parse error:', error);
        renderOnce();
      });
    } catch (e) {
      console.error('Load error:', e);
      renderOnce();
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
