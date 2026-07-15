/** Loose typings for the Web Audio runtime in `src/audio.js`. */
export function createAudio(options?: {
  manifestUrl?: string;
  fallback?: (eventId: string, error?: unknown) => boolean;
}): {
  unlock(): Promise<boolean>;
  play(eventId: string, options?: { volume?: number }): Promise<boolean>;
  playAmbience(trackId: string, options?: { volume?: number }): Promise<boolean>;
  playMusic(trackId: string, options?: { volume?: number }): Promise<boolean>;
  stopAmbience(): boolean;
  stopMusic(): boolean;
  setMuted(muted: boolean): boolean;
  isMuted(): boolean;
  setEventEnabled(eventId: string, enabled: boolean): void;
  setVariantStyle(style: string | null): void;
  destroy(): Promise<void>;
};
