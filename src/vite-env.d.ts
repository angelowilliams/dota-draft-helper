/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENDOTA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
