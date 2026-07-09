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
  // require()'d video asset for the intro.
  introVideoAsset: number;
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

export const companions: Record<CompanionId, CompanionConfig> = {
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    // Temporary small placeholder model for faster dev/testing.
    // To restore original high-quality avatar, swap back to:
    // modelAsset: require('../../assets/krishna_hq.glb'),
    modelAsset: require('../../assets/placeholder_avatar.glb'),
    introVideoAsset: require('../../assets/placeholder_video.mp4'), // TODO: swap for real video when ready
    themeColor: '#FFBF00',
    backgroundColor: '#0a0a1a',
  },
  rama: {
    id: 'rama',
    name: 'Rama',
    // TODO: swap for real GLB when ready, no code change needed elsewhere
    modelAsset: require('../../assets/krishna_placeholder.glb'),
    introVideoAsset: require('../../assets/placeholder_video.mp4'), // TODO: swap for real video when ready
    themeColor: '#00BFFF',
    backgroundColor: '#0a0a1a',
  },
  buddha: {
    id: 'buddha',
    name: 'Buddha',
    // TODO: swap for real GLB when ready, no code change needed elsewhere
    modelAsset: require('../../assets/krishna_placeholder.glb'),
    introVideoAsset: require('../../assets/placeholder_video.mp4'), // TODO: swap for real video when ready
    themeColor: '#FF7F50',
    backgroundColor: '#0a0a1a',
  },
  osho: {
    id: 'osho',
    name: 'Osho',
    // TODO: swap for real GLB when ready, no code change needed elsewhere
    modelAsset: require('../../assets/krishna_placeholder.glb'),
    introVideoAsset: require('../../assets/placeholder_video.mp4'), // TODO: swap for real video when ready
    themeColor: '#9370DB',
    backgroundColor: '#0a0a1a',
  },
};

export const DEFAULT_COMPANION: CompanionId = 'krishna';
