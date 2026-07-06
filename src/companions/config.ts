// Generic companion configuration.
//
// This is the single place that defines each companion's 3D model asset,
// theme color, and background — so adding Rama / Buddha / Osho later
// (Phase 6) means adding an entry here, not writing a new avatar component.
export type CompanionId = 'krishna' | 'rama' | 'buddha' | 'osho';

export interface CompanionConfig {
  id: CompanionId;
  name: string;
  // require()'d GLB asset. Only companions with an actual model file
  // bundled in /assets should be listed in `companions` below.
  modelAsset: number;
  themeColor: string;
  backgroundColor: string;
  // Optional: base color / diffuse texture, loaded and applied manually.
  //
  // Why: Krishna's GLB has textures embedded inside the binary file itself.
  // GLTFLoader tries to extract those and turn them into a Blob so it can
  // decode them as an image — but React Native's Blob implementation
  // doesn't support creating a Blob from raw ArrayBuffer/ArrayBufferView
  // data, so that path always fails (logs "Couldn't load texture" and the
  // mesh renders flat white). Model geometry is unaffected since it's
  // parsed as raw binary, no Blob/image decoding involved.
  //
  // The reliable workaround: export/download the base color texture as a
  // separate static image file (this one came from Meshy's own preview
  // download), bundle it as a normal asset, and apply it to the model's
  // materials manually after the GLTF loads — using expo-three's
  // TextureLoader, which resolves a real file URI and uploads it straight
  // to the GPU (no Blob involved at any point).
  textureAsset?: number;
}

export const companions: Partial<Record<CompanionId, CompanionConfig>> = {
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    modelAsset: require('../../assets/krishna_hq.glb'),
    themeColor: '#FFBF00',
    backgroundColor: '#0a0a1a',
    textureAsset: require('../../assets/krishna_texture_diffuse.webp'),
  },
  // rama, buddha, osho: add here in Phase 6 once their GLB assets exist.
};

export const DEFAULT_COMPANION: CompanionId = 'krishna';
