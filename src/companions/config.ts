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
    // Swapped from the untextured placeholder_avatar.glb (dev/testing speed)
    // to the real high-quality model + its texture. The placeholder had no
    // texture, so CompanionAvatar.tsx's fallback path was kicking in
    // (mat.color = themeColor), which is exactly why the avatar rendered as
    // a solid flat #FFBF00 (amber/orange) blob instead of an actual
    // textured character - not a bug in the window/sizing fix, just this
    // wiring never having been flipped over yet. krishna_hq.glb +
    // krishna_texture_diffuse.webp were already sitting in /assets, and
    // CompanionAvatar.tsx already has NPOT-safety handling written
    // specifically referencing krishna_hq's 1920x1920 diffuse map, so this
    // pairing is the intended one - it just hadn't been wired up here yet.
    // NOT yet re-verified on-device - this is the very next thing to check.
    modelAsset: require('../../assets/krishna_hq.glb'),
    textureAsset: require('../../assets/krishna_texture_diffuse.webp'),
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
