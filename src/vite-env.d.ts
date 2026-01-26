/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRATZ_API_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
