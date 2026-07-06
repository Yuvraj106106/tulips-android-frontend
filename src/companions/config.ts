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
  // See CompanionAvatar.tsx for why this exists (embedded-GLB texture
  // decoding is broken under React Native). Leave unset to render the
  // model with a flat themeColor tint instead (used for the current
  // placeholder model while the real Krishna model's texture pipeline
  // is worked out separately).
  textureAsset?: number;
}

export const companions: Partial<Record<CompanionId, CompanionConfig>> = {
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    // TEMP: using a placeholder model (also has embedded textures that
    // won't load under RN, same as the original krishna_hq.glb) so avatar
    // work and the rest of the roadmap aren't blocked on the texture-pipeline
    // debugging. Swap back to krishna_hq.glb + re-enable textureAsset once
    // that's sorted separately.
    modelAsset: require('../../assets/krishna_placeholder.glb'),
    themeColor: '#FFBF00',
    backgroundColor: '#0a0a1a',
  },
  // rama, buddha, osho: add here in Phase 6 once their GLB assets exist.
};

export const DEFAULT_COMPANION: CompanionId = 'krishna';
