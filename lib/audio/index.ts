import { kieProvider } from "./kie-provider";
import { falProvider } from "./fal-provider";
import { wavespeedProvider } from "./wavespeed-provider";
import type { AudioProvider, AudioProviderName } from "./types";

const providers: Record<AudioProviderName, AudioProvider> = {
  kie: kieProvider,
  fal: falProvider,
  wavespeed: wavespeedProvider,
};

function getProviderName() {
  const provider = process.env.AUDIO_PROVIDER?.toLowerCase();

  if (!provider) {
    throw new Error("AUDIO_PROVIDER is not configured");
  }

  if (provider !== "kie" && provider !== "fal" && provider !== "wavespeed") {
    throw new Error(`Unsupported AUDIO_PROVIDER: ${provider}`);
  }

  return provider as AudioProviderName;
}

export function getAudioProvider() {
  return providers[getProviderName()];
}

export function getAudioProviderByName(name: string) {
  if (name !== "kie" && name !== "fal" && name !== "wavespeed") {
    throw new Error(`Unsupported audio provider: ${name}`);
  }

  return providers[name as AudioProviderName];
}

export const audioProvider: AudioProvider = {
  get name() {
    return getAudioProvider().name;
  },
  async generateSong(params) {
    return getAudioProvider().generateSong(params);
  },
  async getTaskStatus(taskId) {
    return getAudioProvider().getTaskStatus(taskId);
  },
};
export type {
  AudioProvider,
  AudioProviderName,
  GenerateParams,
  TaskResult,
} from "./types";
