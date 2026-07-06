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
          // expo-gl's native isDataTexture path expects a native-asset-shaped
          // object here (matching what expo-three's own TextureLoader passes,
          // i.e. an object with a `localUri` field) — NOT a bare `{ uri }`.
          // With `uri` instead of `localUri`, the native side silently fails
          // to resolve the file and binds an empty/garbage texture, which is
          // why the model rendered as solid black with white specular dots
          // even though geometry, lighting, and the metalness/roughness
          // overrides were all correct.
          data: { localUri: url },
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
