/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NEXT_PUBLIC_SUPABASE_URL: string
  readonly VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  readonly VITE_CLARITY_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}