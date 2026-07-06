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
  // Single-texture override (whole model shares one UV atlas / one image).
  // See CompanionAvatar.tsx for why this exists.
  textureAsset?: number;
  // Per-material texture override, keyed by the GLTF material name, for
  // models that use several materials/images (e.g. separate armour, face,
  // eyelash textures) rather than one shared atlas. Takes priority over
  // textureAsset when both a model's material name matches and this map
  // has an entry for it.
  materialTextureMap?: Record<string, number>;
}

export const companions: Partial<Record<CompanionId, CompanionConfig>> = {
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    // Real high-quality model. Now that GLTFLoaderRN correctly decodes
    // embedded GLB textures under React Native (see PR #5 + the
    // expo-file-system/legacy fix), this model's own embedded 1920x1920
    // diffuse texture loads automatically — no manual materialTextureMap
    // needed anymore, unlike the placeholder model this replaces.
    modelAsset: require('../../assets/krishna_hq.glb'),
    themeColor: '#FFBF00',
    backgroundColor: '#0a0a1a',
    // Fallback only: if embedded-texture decode ever fails for this
    // asset for some reason, uncomment this to force the same texture
    // in manually instead.
    // textureAsset: require('../../assets/krishna_texture_diffuse.webp'),
  },
  // rama, buddha, osho: add here in Phase 6 once their GLB assets exist.
};

export const DEFAULT_COMPANION: CompanionId = 'krishna';
