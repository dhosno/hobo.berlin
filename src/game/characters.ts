import { CHARACTERS } from "./config";

const PORTRAITS: Record<string, string> = {
  prompt: new URL("../../assets/characters/prompt.png", import.meta.url).href,
  marketing: new URL("../../assets/characters/marketing.png", import.meta.url)
    .href,
  qa: new URL("../../assets/characters/qa.png", import.meta.url).href,
};

export function characterPortraitUrl(characterId: string): string {
  return PORTRAITS[characterId] ?? PORTRAITS.prompt!;
}

export function characterShortLabel(characterId: string): string {
  const name = CHARACTERS.find((c) => c.id === characterId)?.name ?? "Hobo";
  return name;
}
