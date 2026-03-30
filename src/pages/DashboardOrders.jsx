import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  FileText,
  Plus,
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
    supplier_id: "",
    amount: "",
    description: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) return;

    setUser(currentUser);

    /* ---------- PROFILE ---------- */

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    /* ---------- ORDERS ---------- */

    const { data: ordersData } = await supabase
      .from("orders")
      .select("*")
      .or(`requester_id.eq.${profileData.id},supplier_id.eq.${profileData.id}`)
      .order("created_date", { ascending: false });

    setOrders(ordersData || []);

    /* ---------- JOBS ---------- */

    const { data: jobsData } = await supabase
      .from("jobs")
      .select("*")
      .eq("provider_id", profileData.id);

    setJobs(
      (jobsData || []).filter(
        j => j.status === "in_progress" || j.status === "funded"
      )
    );

    /* ---------- PROVIDERS ---------- */

    const { data: providerData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "provider");

    setProviders(
      (providerData || []).filter(p => p.id !== profileData.id)
    );

    setLoading(false);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const incomingOrders = orders.filter(
    o => o.supplier_id === profile?.id
  );

  const outgoingOrders = orders.filter(
    o => o.requester_id === profile?.id
  );

  /* ---------- APPROVE ---------- */

  const handleApprove = async (order) => {

    setProcessing(order.id);

    await supabase
      .from("orders")
      .update({ status: "approved" })
      .eq("id", order.id);

    toast.success("Order approved");

    setProcessing(null);
    loadData();
  };

  /* ---------- REJECT ---------- */

  const handleReject = async (order) => {

    setProcessing(order.id);

    await supabase
      .from("orders")
      .update({ status: "rejected" })
      .eq("id", order.id);

    toast.success("Order rejected");

    setProcessing(null);
    loadData();
  };

  /* ---------- CREATE ORDER ---------- */

  const handleCreateOrder = async () => {

    if (!newOrder.job_id || !newOrder.supplier_id || !newOrder.amount || !newOrder.description) {
      toast.error("Please fill all fields");
      return;
    }

    setProcessing("create");

    await supabase.from("orders").insert({

      job_id: newOrder.job_id,
      requester_id: profile.id,
      supplier_id: newOrder.supplier_id,
      amount: parseFloat(newOrder.amount),
      description: newOrder.description,
      status: "pending_approval",
      created_date: new Date().toISOString()

    });

    toast.success("Order created");

    setCreateDialogOpen(false);

    setNewOrder({
      job_id: "",
      supplier_id: "",
      amount: "",
      description: "",
    });

    setProcessing(null);

    loadData();
  };

  /* ---------- ORDER CARD ---------- */

  const OrderCard = ({ order, showActions }) => {

    const isIncoming = order.supplier_id === profile?.id;

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

              <p className="text-gray-600 text-xs mt-1">
                {format(new Date(order.created_date), "MMM d, yyyy · h:mm a")}
              </p>

              <Badge className={`${statusColors[order.status]} border mt-2 capitalize`}>
                {order.status.replace("_", " ")}
              </Badge>

            </div>

          </div>

          <div className="text-right">

            <p className="text-lg font-semibold text-white">
              {formatAmount(order.amount)}
            </p>

            {showActions && order.status === "pending_approval" && (

              <div className="flex gap-2 mt-3">

                <Button
                  size="sm"
                  onClick={() => handleApprove(order)}
                  disabled={processing === order.id}
                  className="bg-green-600 hover:bg-green-700"
                >

                  {processing === order.id
                    ? <Loader2 className="w-4 h-4 animate-spin"/>
                    : <CheckCircle className="w-4 h-4"/>}

                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReject(order)}
                  disabled={processing === order.id}
                  className="border-red-500 text-red-400"
                >
                  <XCircle className="w-4 h-4"/>
                </Button>

              </div>

            )}

          </div>

        </div>

      </div>
    );
  };

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Loader2 className="animate-spin"/>
      </div>
    );
  }

  /* ---------- PROVIDER CHECK ---------- */

  if (!profile || profile.user_type !== "provider") {

    return (

      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">

        <div className="card-dark p-12 text-center max-w-md">

          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4"/>

          <h3 className="text-lg font-medium text-white mb-2">
            Orders are for Providers
          </h3>

          <p className="text-gray-500">
            Internal orders are used by providers to sub-contract work.
          </p>

        </div>

      </div>

    );
  }

  return (
    <div className="p-6 lg:p-8">

      {/* <div className="flex justify-between mb-8">

        <div>

          <h1 className="text-2xl font-bold text-white mb-2">
            Internal Orders
          </h1>

          <p className="text-gray-500">
            Manage sub-contracting orders with other providers
          </p>

        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          disabled={jobs.length === 0}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2"/>
          Create Order
        </Button>

      </div> */}

      <Tabs defaultValue="incoming">

        <TabsList>

          <TabsTrigger value="incoming">
            Incoming ({incomingOrders.length})
          </TabsTrigger>

          <TabsTrigger value="outgoing">
            Outgoing ({outgoingOrders.length})
          </TabsTrigger>

        </TabsList>

        <TabsContent value="incoming">

          {incomingOrders.map(order =>
            <OrderCard key={order.id} order={order} showActions={true}/>
          )}

        </TabsContent>

        <TabsContent value="outgoing">

          {outgoingOrders.map(order =>
            <OrderCard key={order.id} order={order} showActions={false}/>
          )}

        </TabsContent>

      </Tabs>

    </div>
  );
}