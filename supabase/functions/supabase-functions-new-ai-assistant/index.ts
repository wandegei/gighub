import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.35.0";

// Supabase service role key (server-only)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1️⃣ Verify Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader)
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: corsHeaders,
      });

    const token = authHeader.replace("Bearer ", "");

    // 2️⃣ Verify JWT using Supabase service role key
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("JWT INVALID:", userError);
      return new Response(JSON.stringify({ error: "Invalid JWT" }), { status: 401, headers: corsHeaders });
    }

    console.log("✅ User verified:", user);

    // 3️⃣ Parse prompt
    const { prompt } = await req.json();
    const testPrompt = prompt || "Hello AI! Please respond briefly so we can test the connection.";

    // 4️⃣ Call OpenAI API
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) throw new Error("Missing OpenAI API key");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a helpful AI assistant for GigHub users (Uganda)." },
          { role: "user", content: testPrompt },
        ],
      }),
    });

    const data = await aiRes.json();
    console.log("🧠 OpenAI raw response:", data);

    // 5️⃣ Safely parse AI response
    let answer = "Sorry, I couldn’t get a response from the AI.";

    if (data?.choices && data.choices.length > 0) {
      const firstChoice = data.choices[0];
      answer = firstChoice.message?.content?.trim() || firstChoice.text?.trim() || answer;
    }

    console.log("✅ Parsed AI answer:", answer);

    // 6️⃣ Return AI answer
    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Edge Function Error:", err);
    return new Response(JSON.stringify({ error: "Server error", details: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});