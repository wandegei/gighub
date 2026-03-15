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

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("referral_code", code)
      .single();

    if (!data) {
      window.location.href = "/";
      return;
    }

    window.location.href = `/ProviderProfile?id=${data.id}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      Redirecting to provider...
    </div>
  );
}