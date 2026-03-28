import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; // ✅ ADD

const supabase = createClient(
  Deno.env.get("SUPABASE_URL"),
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
);

serve(async (req) => {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers, status: 204 });

  try {
    const { amount, email, job_id } = await req.json();

    if (!amount || !email || !job_id) {
      return new Response(JSON.stringify({ message: "Missing fields" }), { status: 400, headers });
    }

    const FLW_SECRET_KEY = Deno.env.get("FLW_SECRET_KEY");
    if (!FLW_SECRET_KEY) {
      return new Response(JSON.stringify({ message: "Flutterwave key missing" }), { status: 500, headers });
    }

    const tx_ref = `tx-${Date.now()}`;

    // ✅🔥 SAVE PAYMENT FIRST (VERY IMPORTANT)
    const { error: paymentError } = await supabase.from("payments").insert({
      job_id,
      tx_ref,
      amount,
      status: "pending",
    });

    if (paymentError) {
      return new Response(
        JSON.stringify({ message: "Failed to save payment", error: paymentError.message }),
        { status: 500, headers }
      );
    }

    // ✅ CALL FLUTTERWAVE
    const flutterwaveRes = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({
        tx_ref,
        amount,
        currency: "UGX",
        redirect_url: `https://gighub-smoky.vercel.app/JobDetail?id=${job_id}`,
        payment_options: "card,mobilemoneyuganda",
        customer: { email },

        // ✅ YOU ALREADY ADDED THIS (GOOD)
        meta: {
          job_id: job_id,
        },

        customizations: {
          title: "GigHub Payment",
          description: "Service Payment",
        },
      }),
    });

    const data = await flutterwaveRes.json();

    if (!flutterwaveRes.ok) {
      return new Response(
        JSON.stringify({ message: "Flutterwave failed", details: data }),
        { status: 500, headers }
      );
    }

    const paymentLink = data?.data?.link;

    if (!paymentLink) {
      return new Response(
        JSON.stringify({ message: "No payment link returned by Flutterwave" }),
        { status: 500, headers }
      );
    }

    return new Response(JSON.stringify({ link: paymentLink }), {
      status: 200,
      headers,
    });

  } catch (err) {
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
      headers,
    });
  }
});