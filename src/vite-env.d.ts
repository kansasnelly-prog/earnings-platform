/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly [key: string]: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global type extensions for toFixed() safety net
declare global {
  interface Number {
    toFixedOriginal(digits?: number): string;
  }
  interface Object {
    toFixed?(this: any, digits?: number): string;
  }
}

export {};
