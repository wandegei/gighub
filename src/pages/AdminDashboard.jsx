import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Ban, CheckCircle, Trash2, Search } from "lucide-react";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);

  const [search, setSearch] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return (window.location.href = "/");

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
    await loadData();
    setLoading(false);
  };

  const loadData = async () => {
    const { data: usersData } = await supabase.from("profiles").select("*");
    const { data: servicesData } = await supabase.from("services").select("*");

    setUsers(usersData || []);
    setServices(servicesData || []);
  };

  // ================= USERS =================

  const approveProvider = async (id) => {
    await supabase.from("profiles").update({ is_approved: true }).eq("id", id);
    loadData();
  };

  const banUser = async (id) => {
    await supabase.from("profiles").update({ is_banned: true }).eq("id", id);
    loadData();
  };

  const deleteUser = async (id) => {
    await supabase.from("profiles").delete().eq("id", id);
    loadData();
  };

  // ================= SERVICES =================

  const approveService = async (id) => {
    await supabase
      .from("services")
      .update({ status: "approved", is_active: true })
      .eq("id", id);
    loadData();
  };

  const deleteService = async (id) => {
    await supabase.from("services").delete().eq("id", id);
    loadData();
  };

  const filteredUsers = users.filter((u) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-10 text-white flex items-center gap-2">
        <Loader2 className="animate-spin" /> Loading admin panel...
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Moderation Panel</h1>
        <p className="text-gray-400">Manage users, services, and platform activity</p>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 text-gray-500" />
        <Input
          placeholder="Search users or services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p>Total Users</p><h2>{users.length}</h2></CardContent></Card>
        <Card><CardContent className="p-4"><p>Providers Pending</p><h2>{users.filter(u => !u.is_approved && u.user_type === 'provider').length}</h2></CardContent></Card>
        <Card><CardContent className="p-4"><p>Total Services</p><h2>{services.length}</h2></CardContent></Card>
        <Card><CardContent className="p-4"><p>Pending Services</p><h2>{services.filter(s => s.status === 'pending').length}</h2></CardContent></Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* USERS TAB */}
        <TabsContent value="users">
          <div className="space-y-2">
            {filteredUsers.map((u) => (
              <div key={u.id} className="flex justify-between items-center p-3 bg-[#1A1D2E] rounded-lg">
                <div>
                  <p className="text-white">{u.full_name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{u.user_type}</Badge>
                    {u.is_banned && <Badge variant="destructive">Banned</Badge>}
                    {!u.is_approved && u.user_type === 'provider' && (
                      <Badge variant="secondary">Pending Approval</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!u.is_approved && u.user_type === 'provider' && (
                    <Button size="sm" onClick={() => approveProvider(u.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}

                  <Button size="sm" variant="destructive" onClick={() => banUser(u.id)}>
                    <Ban className="w-4 h-4" />
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => deleteUser(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* SERVICES TAB */}
        <TabsContent value="services">
          <div className="space-y-2">
            {filteredServices.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-[#1A1D2E] rounded-lg">
                <div>
                  <p className="text-white">{s.title}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge>{s.status}</Badge>
                    {!s.is_active && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                </div>

                <div className="flex gap-2">
                  {s.status === "pending" && (
                    <Button size="sm" onClick={() => approveService(s.id)}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  )}

                  <Button size="sm" variant="destructive" onClick={() => deleteService(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
