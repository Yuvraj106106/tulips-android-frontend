import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';

const KrishnaAvatar: React.FC = () => {
  const mounted = useRef(true);

  const onContextCreate = async (gl: any) => {
    const renderer = new Renderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    const camera = new THREE.PerspectiveCamera(30, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100);
    camera.position.set(0, 0, 3);
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);
    const geometry = new THREE.SphereGeometry(0.8, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFBF00 });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    renderer.render(scene, camera);
    gl.endFrameEXP();
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
