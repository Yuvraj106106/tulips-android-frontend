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
}

export const companions: Partial<Record<CompanionId, CompanionConfig>> = {
  krishna: {
    id: 'krishna',
    name: 'Krishna',
    modelAsset: require('../../assets/krishna_hq.glb'),
    themeColor: '#FFBF00',
    backgroundColor: '#0a0a1a',
  },
  // rama, buddha, osho: add here in Phase 6 once their GLB assets exist.
};

export const DEFAULT_COMPANION: CompanionId = 'krishna';
