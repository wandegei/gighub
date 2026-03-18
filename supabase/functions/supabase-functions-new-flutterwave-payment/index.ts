
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {

  const { amount, email, job_id } = await req.json();

  const tx_ref = "tx-" + Date.now();

  const redirectUrl = `https://gighub-smoky.vercel.app/JobDetail?id=${job_id}`;

  const response = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("FLWSECK_TEST-94d2f60d5cfdfc7b3e4d4851d4af04f7-X")}`,
    },
    body: JSON.stringify({
      tx_ref: tx_ref,
      amount: amount,
      currency: "UGX",
      redirect_url: redirectUrl,
      payment_options: "card,mobilemoneyuganda",
      customer: {
        email: email,
      },
      customizations: {
        title: "GigHub Payment",
        description: "Service Payment",
      },
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
