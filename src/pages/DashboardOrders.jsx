import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "../lib/supabaseClient";
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { toast } from "sonner";

const statusColors = {
  pending_approval: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

export default function DashboardOrders() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrder, setNewOrder] = useState({
    job_id: "",
    supplier_email: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get authenticated user
    const {
      data: { user: currentUser },
      error,
    } = await supabase.auth.getUser();
    if (error || !currentUser) return;

    setUser(currentUser);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_email", currentUser.email)
      .limit(1);
    if (profileData?.length > 0) setProfile(profileData[0]);

    // Load orders
    const { data: allOrders } = await supabase
      .from("orders")
      .select("*")
      .order("created_date", { ascending: false });
    setOrders(
      (allOrders || []).filter(
        (o) =>
          o.requester_email === currentUser.email ||
          o.supplier_email === currentUser.email
      )
    );

    // Load jobs (where user is provider)
    const { data: allJobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("provider_email", currentUser.email);
    setJobs(
      (allJobs || []).filter(
        (j) => j.status === "in_progress" || j.status === "funded"
      )
    );

    // Load other providers for selection
    const { data: allProviders } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "provider");
    setProviders(
      (allProviders || []).filter((p) => p.user_email !== currentUser.email)
    );

    setLoading(false);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const incomingOrders = orders.filter((o) => o.supplier_email === user?.email);
  const outgoingOrders = orders.filter((o) => o.requester_email === user?.email);

  const handleApprove = async (order) => {
    setProcessing(order.id);
    await supabase.from("orders").update({ status: "approved" }).eq("id", order.id);
    toast.success("Order approved");
    setProcessing(null);
    loadData();
  };

  const handleReject = async (order) => {
    setProcessing(order.id);
    await supabase.from("orders").update({ status: "rejected" }).eq("id", order.id);
    toast.success("Order rejected");
    setProcessing(null);
    loadData();
  };

  const handleCreateOrder = async () => {
    if (!newOrder.job_id || !newOrder.supplier_email || !newOrder.amount || !newOrder.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setProcessing("create");

    // Get supplier profile
    const { data: supplierProfiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_email", newOrder.supplier_email)
      .limit(1);

    await supabase.from("orders").insert({
      job_id: newOrder.job_id,
      requester_id: profile.id,
      requester_email: user.email,
      supplier_id: supplierProfiles?.[0]?.id || null,
      supplier_email: newOrder.supplier_email,
      amount: parseFloat(newOrder.amount),
      description: newOrder.description,
      status: "pending_approval",
      created_date: new Date().toISOString(),
    });

    toast.success("Order created");
    setCreateDialogOpen(false);
    setNewOrder({ job_id: "", supplier_email: "", amount: "", description: "" });
    setProcessing(null);
    loadData();
  };

  const OrderCard = ({ order, showActions }) => {
    const isIncoming = order.supplier_email === user?.email;

    return (
      <div className="card-dark p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-xl ${
                isIncoming ? "bg-green-500/10" : "bg-blue-500/10"
              } flex items-center justify-center`}
            >
              {isIncoming ? (
                <ArrowDownLeft className="w-5 h-5 text-green-400" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <p className="text-white font-medium">{order.description}</p>
              <p className="text-gray-500 text-sm mt-1">
                {isIncoming ? `From: ${order.requester_email}` : `To: ${order.supplier_email}`}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                {format(new Date(order.created_date), "MMM d, yyyy · h:mm a")}
              </p>
              <Badge className={`${statusColors[order.status]} border mt-2 capitalize`}>
                {order.status?.replace("_", " ")}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-white">{formatAmount(order.amount)}</p>
            {showActions && order.status === "pending_approval" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleApprove(order)}
                  disabled={processing === order.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {processing === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(order)}
                  disabled={processing === order.id}
                  className="border-red-500 text-red-400 hover:bg-red-500/10"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#2A2D3E] rounded w-48" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-[#2A2D3E] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile || profile.user_type !== "provider") {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="card-dark p-12 text-center max-w-md">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Orders are for Providers</h3>
          <p className="text-gray-500">
            Internal orders are used by providers to sub-contract work.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Internal Orders</h1>
          <p className="text-gray-500">Manage sub-contracting orders with other providers</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="btn-primary" disabled={jobs.length === 0}>
          <Plus className="w-4 h-4 mr-2" />
          Create Order
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="incoming">
        <TabsList className="bg-[#0F1117] border border-[#2A2D3E] mb-6">
          <TabsTrigger value="incoming" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            Incoming ({incomingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            Outgoing ({outgoingOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming">
          {incomingOrders.length > 0 ? (
            <div className="space-y-4">
              {incomingOrders.map((order) => (
                <OrderCard key={order.id} order={order} showActions={true} />
              ))}
            </div>
          ) : (
            <div className="card-dark p-12 text-center">
              <ArrowDownLeft className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No incoming orders</h3>
              <p className="text-gray-500">Orders from other providers will appear here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="outgoing">
          {outgoingOrders.length > 0 ? (
            <div className="space-y-4">
              {outgoingOrders.map((order) => (
                <OrderCard key={order.id} order={order} showActions={false} />
              ))}
            </div>
          ) : (
            <div className="card-dark p-12 text-center">
              <ArrowUpRight className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No outgoing orders</h3>
              <p className="text-gray-500">Create an order to sub-contract work to another provider</p>
              {jobs.length > 0 && (
                <Button onClick={() => setCreateDialogOpen(true)} className="btn-primary mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Order
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Order Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">Create Internal Order</DialogTitle>
            <DialogDescription className="text-gray-500">
              Sub-contract work to another provider
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Job Selection */}
            <div>
              <Label className="text-gray-400 mb-2 block">Select Job</Label>
              <Select
                value={newOrder.job_id}
                onValueChange={(value) => setNewOrder({ ...newOrder, job_id: value })}
              >
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Choose a job" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.title} ({formatAmount(job.agreed_amount)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supplier Selection */}
            <div>
              <Label className="text-gray-400 mb-2 block">Select Supplier</Label>
              <Select
                value={newOrder.supplier_email}
                onValueChange={(value) => setNewOrder({ ...newOrder, supplier_email: value })}
              >
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Choose a provider" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.user_email}>
                      {p.full_name} ({p.location || "No location"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-gray-400 mb-2 block">Amount (UGX)</Label>
              <Input
                type="number"
                value={newOrder.amount}
                onChange={(e) => setNewOrder({ ...newOrder, amount: e.target.value })}
                placeholder="e.g., 100000"
                className="input-dark"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-gray-400 mb-2 block">Description</Label>
              <Textarea
                value={newOrder.description}
                onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
                placeholder="Describe the work needed..."
                className="input-dark min-h-[80px]"
              />
            </div>

            <Button onClick={handleCreateOrder} disabled={processing === "create"} className="btn-primary w-full">
              {processing === "create" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Order"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}