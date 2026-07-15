/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_FREEZE_TIMER?: string;
  readonly VITE_DEV_SKIP_INTRO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
