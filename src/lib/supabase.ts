import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This helper ensures the client is only created if keys are present, 
// preventing build-time crashes while still providing the client to components.
export const supabase = (typeof window !== 'undefined' || (supabaseUrl && supabaseAnonKey)) 
  ? createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co', 
      supabaseAnonKey || 'placeholder-key'
    )
  : null as any;
