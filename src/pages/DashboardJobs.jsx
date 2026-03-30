import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "../lib/supabaseClient";
import { Briefcase, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCard from "../components/jobs/JobCard";

export default function DashboardJobs() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  setLoading(true);

  // 1️⃣ Get user
  const {
    data: { user: currentUser },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !currentUser) {
    window.location.href = createPageUrl("CompleteProfile");
    return;
  }

  setUser(currentUser);

  // 2️⃣ Get profile FIRST
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", currentUser.id)
    .single(); // 👈 important

  if (profileError || !profiles) {
    console.error("Profile error:", profileError);
    setLoading(false);
    return;
  }

  setProfile(profiles);

  // 3️⃣ NOW load jobs AFTER profile exists   
  const { data: allJobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Jobs error:", jobsError);
    setLoading(false);
    return;
  }

  // 4️⃣ Filter using VALID profile.id
  const userJobs = (allJobs || []).filter(
    (j) =>
      j.client_id === profiles.id ||
      j.provider_id === profiles.id
  );

  console.log("PROFILE ID:", profiles.id);
  console.log("ALL JOBS:", allJobs);
  console.log("USER JOBS:", userJobs);

  setJobs(userJobs);
  setLoading(false);
};

  const filteredJobs = jobs.filter((job) => {
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      job.title?.toLowerCase().includes(query) ||
      job.description?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    let matchesRole = true;
    const userEmail = user?.email?.trim().toLowerCase();
    if (roleFilter === "client") {
  matchesRole = job.client_id === profile?.id;
} else if (roleFilter === "provider") {
  matchesRole = job.provider_id === profile?.id;
}

    return matchesSearch && matchesStatus && matchesRole;
  });

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    funded: jobs.filter((j) => j.status === "funded").length,
    in_progress: jobs.filter((j) => j.status === "in_progress").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            My Jobs
          </h1>
          <p className="text-gray-500">Manage your jobs and track progress</p>
        </div>
        {profile?.user_type === "client" && (
          <Link to={createPageUrl("Providers")}>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Create New Job
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="input-dark pl-12"
          />
        </div>

        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="input-dark w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
              <SelectItem value="all">All Status ({statusCounts.all})</SelectItem>
              <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
              <SelectItem value="funded">Funded ({statusCounts.funded})</SelectItem>
              <SelectItem value="in_progress">
                In Progress ({statusCounts.in_progress})
              </SelectItem>
              <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="input-dark w-[160px]">
              <SelectValue placeholder="My Role" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="client">As Client</SelectItem>
              <SelectItem value="provider">As Provider</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList className="bg-[#0F1117] border border-[#2A2D3E]">
          {["all", "pending", "funded", "in_progress", "completed"].map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white"
            >
              {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Jobs List  loadData */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card-dark p-5 animate-pulse">
              <div className="h-5 bg-[#2A2D3E] rounded w-48 mb-3" />
              <div className="h-4 bg-[#2A2D3E] rounded w-full mb-2" />
              <div className="h-4 bg-[#2A2D3E] rounded w-32" />
            </div>
          ))}
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <JobCard job={job} userProfile={profile} />
          ))}
        </div>
      ) : (
        <div className="card-dark p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter !== "all"
              ? `No ${statusFilter.replace("_", " ")} jobs`
              : profile?.user_type === "client"
              ? "Start by hiring a service provider"
              : "Wait for clients to hire you"}
          </p>
          {profile?.user_type === "client" && statusFilter === "all" && (
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
  );
}