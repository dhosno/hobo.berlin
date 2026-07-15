export type DialogueLine = {
  id: string;
  event: string;
  text: string;
  characterId?: string;
  weight?: number;
};

export function createDialogue(options?: {
  baseUrl?: string;
  defaultLocale?: string;
}): {
  load(locale: string): Promise<DialogueLine[]>;
  pick(
    eventId: string,
    options?: {
      locale?: string;
      characterId?: string;
      random?: () => number;
    },
  ): Promise<DialogueLine | null>;
};
