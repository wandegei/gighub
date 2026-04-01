import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .single();

      if (profile?.user_type !== "admin") {
        window.location.href = "/";
        return;
      }

      setIsAdmin(true);

      // ✅ load admin data ONLY if admin
      await loadData();

    } catch (err) {
      console.error(err);
      window.location.href = "/";
    }

    setLoading(false);
  };

  const loadData = async () => {
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*");

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*");

    setUsers(usersData || []);
    setJobs(jobsData || []);
  };

  if (loading) {
    return <div className="p-10 text-white">Checking admin access...</div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl text-white mb-6">Admin Dashboard</h1>

      <p className="text-gray-400 mb-6">
        Manage users, jobs, and platform activity
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-dark p-4">
          <p>Total Users</p>
          <h2 className="text-xl">{users.length}</h2>
        </div>

        <div className="card-dark p-4">
          <p>Total Jobs</p>
          <h2 className="text-xl">{jobs.length}</h2>
        </div>
      </div>

      {/* Users */}
      <div className="card-dark p-4 mb-6">
        <h2 className="text-white mb-3">Users</h2>
        {users.map(u => (
          <div key={u.id} className="border-b py-2">
            {u.full_name} - {u.user_type}
          </div>
        ))}
      </div>

      {/* Jobs */}
      <div className="card-dark p-4">
        <h2 className="text-white mb-3">Jobs</h2>
        {jobs.map(j => (
          <div key={j.id} className="border-b py-2">
            {j.title} - {j.status}
          </div>
        ))}
      </div>
    </div>
  );
}