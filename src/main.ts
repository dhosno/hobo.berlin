import "./styles.css";

import { createGame } from "./game/create-game";
import { parseTiledMap } from "./game/map/tiled-contract";

const app = document.querySelector<HTMLElement>("#app");

if (app === null) {
  throw new Error("Missing #app root element");
}

app.outerHTML = `
  <main id="app">
    <div id="game" aria-label="Phase 0 Berlin grid"></div>
    <output id="player-position" aria-live="polite" data-column="2" data-row="2">Player: 2,2</output>
  </main>
`;

const gameParentElement = document.querySelector<HTMLElement>("#game");
const positionOutputElement = document.querySelector<HTMLOutputElement>("#player-position");

if (gameParentElement === null || positionOutputElement === null) {
  throw new Error("Unable to create the Phase 0 shell");
}

const gameParent = gameParentElement;
const positionOutput = positionOutputElement;

let game: ReturnType<typeof createGame> | undefined;

async function bootstrap(): Promise<void> {
  try {
    const mapUrl = new URL("./assets/maps/phase-0.json", import.meta.url);
    const response = await fetch(mapUrl);
    if (!response.ok) {
      throw new Error(`Map request failed with status ${response.status}`);
    }

    const map = parseTiledMap(await response.json());
    game = createGame(gameParent, map);
  } catch (error) {
    game?.destroy(true);
    game = undefined;
    gameParent.replaceChildren();
    positionOutput.remove();

    const alert = document.createElement("p");
    alert.setAttribute("role", "alert");
    alert.textContent = `Unable to start Phase 0: ${error instanceof Error ? error.message : String(error)}`;
    gameParent.append(alert);
  }
}

void bootstrap();
