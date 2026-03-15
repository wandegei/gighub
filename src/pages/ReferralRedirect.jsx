import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

export default function ReferralRedirect() {

  const [searchParams] = useSearchParams();

  useEffect(() => {
    redirect();
  }, []);

  const redirect = async () => {

    const code = searchParams.get("code");

    if (!code) {
      window.location.href = "/";
      return;
    }

    // 1️⃣ find provider
    const { data: provider } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .single();

    if (!provider) {
      window.location.href = "/";
      return;
    }

    // 2️⃣ get one active service from that provider
    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("provider_id", provider.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!service) {
      window.location.href = "/";
      return;
    }

    // 3️⃣ redirect to service page
    window.location.href = `/ServiceDetail?id=${service.id}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      Redirecting to service...
    </div>
  );
}