import { Image } from 'react-native';
import * as THREE from 'three';

export default class RNTextureLoader extends THREE.TextureLoader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, onProgress, onError) {
    const texture = new THREE.Texture();

    Image.getSize(
      url,
      (width, height) => {
        texture.image = {
          data: { uri: url },
          width,
          height,
        };
        // Forces passing to `gl.texImage2D(...)` verbatim in expo-gl
        texture.isDataTexture = true;
        texture.needsUpdate = true;

        if (onLoad) onLoad(texture);
      },
      (error) => {
        console.error('RNTextureLoader: Failed to get size for', url, error);
        if (onError) onError(error);
      }
    );

    return texture;
  }
}
