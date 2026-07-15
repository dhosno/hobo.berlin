import { CHARACTERS } from "./config";

const PORTRAITS: Record<string, string> = {
  prompt: new URL("../../assets/characters/prompt-placeholder.svg", import.meta.url)
    .href,
  marketing: new URL(
    "../../assets/characters/marketing-placeholder.svg",
    import.meta.url,
  ).href,
  qa: new URL("../../assets/characters/qa-placeholder.svg", import.meta.url).href,
};

export function characterPortraitUrl(characterId: string): string {
  return PORTRAITS[characterId] ?? PORTRAITS.prompt!;
}

export function characterShortLabel(characterId: string): string {
  const name = CHARACTERS.find((c) => c.id === characterId)?.name ?? "Hobo";
  return name;
}
