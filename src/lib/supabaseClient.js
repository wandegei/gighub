import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cwvfozdugyzkzalbrhpo.supabase.co";
const supabaseAnonKey = "sb_publishable_PrpBRQe8TjJ74MDzdYOnNw_XzzTVstj";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);