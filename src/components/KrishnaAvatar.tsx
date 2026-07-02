import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

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
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFBF00 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const render = () => {
      if (mounted.current && rendererRef.current && sceneRef.current && cameraRef.current && glRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        glRef.current.endFrameEXP();
      }
    };

    render();
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
