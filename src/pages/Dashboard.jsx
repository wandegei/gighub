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
  const [jobs, setJobs] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const REFERRAL_BONUS = 5; // Fixed bonus per referral

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
      setProfile(profileData);

      // ---------- LOAD WALLET ----------
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (walletError) console.error("Wallet load error:", walletError);
      setWallet(walletData);

      // ---------- LOAD JOBS ----------
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (jobsError) console.error("Jobs load error:", jobsError);

      const userJobs = (jobsData || []).filter(
        (j) =>
          j.client_email === currentUser.email ||
          j.provider_email === currentUser.email
      );
      setJobs(userJobs);

      // ---------- LOAD REFERRALS ----------
      if (profileData?.user_type === "provider" && profileData.referral_code) {
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

  const stats = [
    {
      label: "Total Jobs",
      value: jobs.length,
      icon: Briefcase,
      color: "text-blue-400",
      bgColor: "bg-blue-400/10",
    },
    {
      label: "Completed",
      value: jobs.filter((j) => j.status === "completed").length,
      icon: ArrowUpRight,
      color: "text-green-400",
      bgColor: "bg-green-400/10",
    },
    {
      label: "In Progress",
      value: jobs.filter((j) => j.status === "in_progress").length,
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
              <div
                className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}

        {/* Referral Earnings Card */}
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
            <Button
              variant="outline"
              className="mt-3 w-full text-sm"
              onClick={() => setIsModalOpen(true)}
            >
              View Referral Details
            </Button>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet & Referral */}
        <div className="lg:col-span-1">
          <WalletCard wallet={wallet} loading={loading} />

          {/* Referral Link for Providers */}
          {profile?.user_type === "provider" && profile?.referral_code && (
            <div className="card-dark p-4 mt-4">
              <h3 className="text-white font-semibold mb-2">Your Referral Link</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/login?ref=${profile.referral_code}`}
                  className="flex-1 p-3 rounded-lg bg-[#0F1117] text-white border border-[#2A2D3E]"
                  onFocus={(e) => e.target.select()}
                />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/login?ref=${profile.referral_code}`
                    );
                    toast.success("Referral link copied!");
                  }}
                  className="bg-[#FF6633] hover:bg-[#e05528] text-white py-2 px-4 rounded-lg flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" /> Copy
                </Button>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Share this link so new users can sign up using your referral code.
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <Link to={createPageUrl("DashboardWallet")} className="flex-1">
              <Button
                variant="outline"
                className="w-full border-[#3B3F5C] bg-[#141726] text-white 
                hover:bg-[#1F2338] hover:border-[#5B61A3] 
                transition-colors duration-200"
              >
                <Wallet className="w-4 h-4 mr-2 text-gray-300" />
                View Wallet
              </Button>
            </Link>
          </div>
        </div>

        {/* Jobs */}
        <div className="lg:col-span-2">
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
              <Link
                to={createPageUrl("DashboardJobs")}
                className="flex items-center gap-1 text-[#FF6633] hover:text-[#E55A2B] text-sm"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E] animate-pulse"
                  >
                    <div className="h-5 bg-[#2A2D3E] rounded w-48 mb-3" />
                    <div className="h-4 bg-[#2A2D3E] rounded w-full mb-2" />
                    <div className="h-4 bg-[#2A2D3E] rounded w-32" />
                  </div>
                ))}
              </div>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} userEmail={user?.email} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No jobs yet</h3>
                <p className="text-gray-500 mb-4">
                  {profile?.user_type === "client"
                    ? "Start by hiring a service provider"
                    : "Wait for clients to hire you"}
                </p>

                {profile?.user_type === "client" && (
                  <Link to={createPageUrl("Providers")}>
                    <Button className="btn-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Find Providers
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------- Referral Modal ------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F1117] p-6 rounded-lg w-full max-w-lg relative">
            <button
              className="absolute top-3 right-3"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
            <h3 className="text-white text-lg font-semibold mb-4">Referral Details</h3>
            {referrals.length === 0 ? (
              <p className="text-gray-400 text-sm">No referrals yet.</p>
            ) : (
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {referrals.map((r) => (
                  <li
                    key={r.id}
                    className="p-3 bg-[#1A1D2E] border border-[#2A2D3E] rounded-lg text-white text-sm flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{r.full_name}</p>
                      <p className="text-gray-400 text-xs">{r.user_email}</p>
                    </div>
                    <div className="text-right text-gray-400 text-sm">
                      <p>Joined: {new Date(r.created_at).toLocaleDateString()}</p>
                      <p>Bonus: ${REFERRAL_BONUS}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}