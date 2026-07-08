import { Asset } from 'expo-asset';
import { companions, CompanionId } from '../companions/config';

let preloading = false;
const readyStatus: Record<string, boolean> = {};

/**
 * Preloads all companion intro videos into local storage.
 * Fire-and-forget, should be called early (e.g. in SplashScreen).
 */
export async function preloadCompanionVideos() {
  if (preloading) return;
  preloading = true;

  console.log('[VideoPreloader] Starting preloading for all companion videos...');

  const companionIds = Object.keys(companions) as CompanionId[];

  const promises = companionIds.map(async (id) => {
    try {
      const asset = Asset.fromModule(companions[id].introVideoAsset);
      await asset.downloadAsync();
      readyStatus[id] = true;
      console.log(`[VideoPreloader] Preloaded video for ${id}`);
    } catch (error) {
      console.error(`[VideoPreloader] Failed to preload video for ${id}:`, error);
    }
  });

  await Promise.all(promises);
  preloading = false;
  console.log('[VideoPreloader] Preloading complete.');
}

/**
 * Returns true if the video for the given companion is already cached.
 */
export function isVideoReady(companionId: CompanionId): boolean {
  return !!readyStatus[companionId];
}
