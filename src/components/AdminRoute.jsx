import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (profile?.user_type === "admin") {
        setIsAdmin(true);
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      console.error(err);
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-white">Checking admin access...</div>;
  }

  return isAdmin ? children : null;
}