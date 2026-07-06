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
    // TEMP: using a placeholder model while the real krishna_hq.glb's
    // texture pipeline is worked out separately (see git history). This
    // placeholder's textures were extracted from its own embedded PNGs
    // (already power-of-two, 512x512 — unlike krishna_hq's 1920x1920) and
    // are applied per-material below.
    modelAsset: require('../../assets/krishna_placeholder.glb'),
    themeColor: '#FFBF00',
    backgroundColor: '#0a0a1a',
    materialTextureMap: {
      Krishna_2_armour_1_No_Shadow: require('../../assets/krishna_dummy_tex_0.png'),
      Krishna_2Armour2_No_Shadow: require('../../assets/krishna_dummy_tex_0.png'),
      Ram_UI: require('../../assets/krishna_dummy_tex_2.png'),
      eyelash_legal: require('../../assets/krishna_dummy_tex_3.png'),
    },
  },
  // rama, buddha, osho: add here in Phase 6 once their GLB assets exist.
};

export const DEFAULT_COMPANION: CompanionId = 'krishna';
