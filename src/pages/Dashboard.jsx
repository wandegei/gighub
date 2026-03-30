import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "../lib/supabaseClient";
import {
  Wallet,
  Briefcase,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  ChevronRight,
  Users,
  Copy,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WalletCard from "../components/wallet/WalletCard";
import JobCard from "../components/jobs/JobCard";
import { toast } from "sonner";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);

  const [jobs, setJobs] = useState([]);       // recent jobs
  const [allJobs, setAllJobs] = useState([]); // all jobs (for stats)

  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const REFERRAL_BONUS = 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // ---------- GET AUTH USER ----------
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        window.location.href = createPageUrl("CompleteProfile");
        return;
      }

      setUser(currentUser);

      // ---------- LOAD PROFILE ----------
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (profileError) console.error("Profile load error:", profileError);
      if (!profileData) return;

      setProfile(profileData);

      // ---------- LOAD WALLET ----------
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (walletError) console.error("Wallet load error:", walletError);
      setWallet(walletData);

      // ---------- LOAD JOBS (FILTERED BY USER) ----------
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .or(`client_id.eq.${profileData.id},provider_id.eq.${profileData.id}`)
        .order("created_at", { ascending: false });

      if (jobsError) console.error("Jobs load error:", jobsError);

      const userJobs = jobsData || [];

      setAllJobs(userJobs);            // ✅ full list for stats
      setJobs(userJobs.slice(0, 5));   // ✅ only recent jobs

      // ---------- LOAD REFERRALS ----------
      if (profileData.user_type === "provider" && profileData.referral_code) {
        const { data: referralUsers, error: referralError } = await supabase
          .from("profiles")
          .select("*")
          .eq("referred_by", profileData.referral_code);

        if (referralError) console.error("Referral load error:", referralError);
        setReferrals(referralUsers || []);
      }

    } catch (error) {
      console.error("Dashboard load error:", error);
    }

    setLoading(false);
  };

  // ---------- STATS ----------
  const stats = [
    {
      label: "Total Jobs",
      value: allJobs.length,
      icon: Briefcase,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Completed",
      value: allJobs.filter((j) => j.status === "completed").length,
      icon: ArrowUpRight,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "In Progress",
      value: allJobs.filter((j) => j.status === "in_progress").length,
      icon: ArrowDownRight,
      color: "text-[#FF6633]",
      bgColor: "bg-[#FF6633]/10",
    },
  ];

  const referralEarnings = referrals.length * REFERRAL_BONUS;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.full_name || "User"}
        </h1>
        <p className="text-gray-500 mb-4">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="card-dark p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}

        {/* Referral Earnings */}
        {profile?.user_type === "provider" && (
          <div className="card-dark p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">Referral Earnings</p>
                <p className="text-2xl font-bold text-white">${referralEarnings}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {referrals.length} referral{referrals.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-400/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>

            <Button variant="outline" className="mt-3 w-full text-sm" onClick={() => setIsModalOpen(true)}>
              View Referral Details
            </Button>
          </div>
        )}
      </div>

      {/* Main */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div>
          <WalletCard wallet={wallet} loading={loading} />

          {profile?.user_type === "provider" && profile?.referral_code && (
            <div className="card-dark p-4 mt-4">
              <h3 className="text-white font-semibold mb-2">Your Referral Link</h3>

              <div className="flex gap-2">
                <input
                  readOnly
                  value={`${window.location.origin}/ReferralRedirect?code=${profile.referral_code}`}
                  className="flex-1 p-3 rounded-lg bg-[#0F1117] text-white border border-[#2A2D3E]"
                  onFocus={(e) => e.target.select()}
                />

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/ReferralRedirect?code=${profile.referral_code}`
                    );
                    toast.success("Referral link copied!");
                  }}
                  className="bg-[#FF6633] hover:bg-[#e05528] text-white px-4 flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Link to={createPageUrl("DashboardWallet")}>
              <Button className="w-full">
                <Wallet className="w-4 h-4 mr-2" />
                View Wallet
              </Button>
            </Link>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2">
          <div className="card-dark p-6">
            <div className="flex justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
              <Link to={createPageUrl("DashboardJobs")} className="text-[#FF6633] text-sm">
                View All
              </Link>
            </div>

            {loading ? (
              <div>Loading...</div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <JobCard key={job.id} job={job} userProfile={profile} />
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                No jobs yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-[#0F1117] p-6 rounded-lg w-full max-w-lg">
            <button onClick={() => setIsModalOpen(false)}>
              <X />
            </button>

            <h3 className="text-white mb-4">Referral Details</h3>

            {referrals.map((r) => (
              <div key={r.id}>{r.full_name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}