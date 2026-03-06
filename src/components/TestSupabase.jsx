import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function TestSupabase() {

  useEffect(() => {
    async function testConnection() {
      const { data, error } = await supabase.from("test").select("*");

      console.log("Data:", data);
      console.log("Error:", error);
    }

    testConnection();
  }, []);

  return <div>Testing Supabase Connection...</div>;
}