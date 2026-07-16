import { Asset } from 'expo-asset';
import { GLTFLoader } from '../vendor/GLTFLoaderRN';
import { companions, CompanionId, DEFAULT_COMPANION } from '../companions/config';
import { loadSettings } from './settings';

export interface PreloadedAvatar {
  gltf: any;
  buffer: ArrayBuffer;
}

const avatarCache = new Map<CompanionId, PreloadedAvatar>();
const activePreloads = new Map<CompanionId, Promise<PreloadedAvatar>>();

export async function preloadAvatar(companionId: CompanionId): Promise<PreloadedAvatar> {
  if (avatarCache.has(companionId)) {
    return avatarCache.get(companionId)!;
  }

  if (activePreloads.has(companionId)) {
    return activePreloads.get(companionId)!;
  }

  const promise = (async () => {
    try {
      const config = companions[companionId];
      if (!config) {
        throw new Error(`Companion config not found for ${companionId}`);
      }

      console.log(`[AvatarPreloader] Preloading GLB for ${companionId}...`);
      const asset = Asset.fromModule(config.modelAsset);
      await asset.downloadAsync();
      const uri = asset.localUri!;
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();

      const gltf = await new Promise<any>((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.parse(buffer, '', resolve, reject);
      });

      const preloaded = { gltf, buffer };
      avatarCache.set(companionId, preloaded);
      console.log(`[AvatarPreloader] Successfully preloaded GLB for ${companionId}`);
      return preloaded;
    } catch (error) {
      console.error(`[AvatarPreloader] Failed to preload GLB for ${companionId}:`, error);
      activePreloads.delete(companionId);
      throw error;
    }
  })();

  activePreloads.set(companionId, promise);
  return promise;
}

export function getPreloadedAvatar(companionId: CompanionId): PreloadedAvatar | undefined {
  return avatarCache.get(companionId);
}

// Warm up the selected companion model immediately when the bundle is loaded
export async function warmUpSelectedCompanion() {
  try {
    const settings = await loadSettings();
    const companionId = settings.selectedCompanion || DEFAULT_COMPANION;
    console.log(`[AvatarPreloader] Warming up selected companion: ${companionId}`);
    await preloadAvatar(companionId);
  } catch (error) {
    console.error(`[AvatarPreloader] Warm up failed:`, error);
  }
}
