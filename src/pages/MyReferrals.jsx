import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function MyReferrals() {

  const [profile, setProfile] = useState(null);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {

    // get logged user
    const { data: { user } } = await supabase.auth.getUser();

    // get profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(profileData);

    // 🔹 THIS IS WHERE THE QUERY GOES
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("referred_by", profileData.referral_code);

    setReferrals(data || []);
  };

  return (
    <div className="p-8 text-white">

      <h1 className="text-2xl font-bold mb-6">
        My Referrals
      </h1>

      {referrals.length === 0 ? (
        <p>No referrals yet.</p>
      ) : (
        <div className="space-y-4">
          {referrals.map((user) => (
            <div
              key={user.id}
              className="p-4 bg-[#1A1D2E] rounded-lg"
            >
              <p>{user.full_name}</p>
              <p className="text-gray-400 text-sm">
                {user.user_email}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}