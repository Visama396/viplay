import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL as string,
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string,
);

const BUCKETS = {
  audio: "audio",
  artwork: "artwork",
  lyrics: "lyrics",
} as const;

export function getPublicUrl(bucket: keyof typeof BUCKETS, path: string) {
  const { data } = supabase.storage.from(BUCKETS[bucket]).getPublicUrl(path);
  return data.publicUrl;
}
