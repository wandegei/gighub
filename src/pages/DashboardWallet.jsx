import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Loader2,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";
import WalletCard from "../components/wallet/WalletCard";

export default function DashboardWallet() {
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get current user
    const { data: { user: userData } } = await supabase.auth.getUser();
    if (!userData) return;
    setUser(userData);

    // Load wallet
    const { data: wallets } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_email", userData.email)
      .limit(1);

    if (wallets?.length > 0) {
      setWallet(wallets[0]);

      // Load transactions
      const { data: allTransactions } = await supabase
        .from("transactions")
        .select("*")
        .order("created_date", { ascending: false })
        .limit(50);
      
      const userTransactions = allTransactions?.filter(t =>
        t.from_email === userData.email || t.to_email === userData.email
      ) || [];
      setTransactions(userTransactions);

      // Load withdrawals
      const { data: userWithdrawals } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_email", userData.email);
      setWithdrawals(userWithdrawals || []);

    } else {
      // Create wallet if doesn't exist
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_email", userData.email)
        .limit(1);

      if (profiles?.length > 0) {
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({
            user_id: profiles[0].id,
            user_email: userData.email,
            balance: 0,
            available_balance: 0,
            locked_balance: 0
          })
          .select()
          .single();

        setWallet(newWallet);
      }
    }

    setLoading(false);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setProcessing(true);

    // Update wallet
    await supabase.from("wallets").update({
      balance: (wallet.balance || 0) + amount,
      available_balance: (wallet.available_balance || 0) + amount
    }).eq("id", wallet.id);

    // Create transaction
    await supabase.from("transactions").insert({
      to_wallet_id: wallet.id,
      to_email: user.email,
      amount,
      type: "deposit",
      description: "Wallet deposit via Mobile Money",
      status: "completed",
      created_date: new Date().toISOString()
    });

    // Create notification
    await supabase.from("notifications").insert({
      user_email: user.email,
      title: "Deposit Successful",
      message: `UGX ${amount.toLocaleString()} has been added to your wallet`,
      type: "payment",
      link: "DashboardWallet",
      created_date: new Date().toISOString()
    });

    toast.success("Deposit successful");
    setDepositDialogOpen(false);
    setDepositAmount("");
    setProcessing(false);
    loadData();
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > (wallet.available_balance || 0)) {
      toast.error("Insufficient available balance");
      return;
    }
    if (!phoneNumber) {
      toast.error("Please enter your mobile money number");
      return;
    }

    setProcessing(true);

    // Update wallet
    await supabase.from("wallets").update({
      balance: (wallet.balance || 0) - amount,
      available_balance: (wallet.available_balance || 0) - amount
    }).eq("id", wallet.id);

    // Create withdrawal record
    await supabase.from("withdrawals").insert({
      wallet_id: wallet.id,
      user_email: user.email,
      amount,
      phone_number: phoneNumber,
      status: "processing",
      created_date: new Date().toISOString()
    });

    // Create transaction
    await supabase.from("transactions").insert({
      from_wallet_id: wallet.id,
      from_email: user.email,
      amount,
      type: "withdrawal",
      description: `Withdrawal to ${phoneNumber}`,
      status: "completed",
      created_date: new Date().toISOString()
    });

    toast.success("Withdrawal request submitted");
    setWithdrawDialogOpen(false);
    setWithdrawAmount("");
    setPhoneNumber("");
    setProcessing(false);
    loadData();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const transactionTypeConfig = {
    deposit: { icon: ArrowDownLeft, color: "text-green-400", bg: "bg-green-400/10", label: "Deposit" },
    withdrawal: { icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-400/10", label: "Withdrawal" },
    escrow_lock: { icon: Wallet, color: "text-yellow-400", bg: "bg-yellow-400/10", label: "Escrow Lock" },
    release: { icon: ArrowDownLeft, color: "text-green-400", bg: "bg-green-400/10", label: "Payment Received" },
    internal_transfer: { icon: ArrowUpRight, color: "text-blue-400", bg: "bg-blue-400/10", label: "Transfer" }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#2A2D3E] rounded w-48" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-[#2A2D3E] rounded-xl" />
            <div className="lg:col-span-2 h-96 bg-[#2A2D3E] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">My Wallet</h1>
          <p className="text-gray-500">Manage your funds and transactions</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setDepositDialogOpen(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Deposit
          </Button>
          <Button 
            onClick={() => setWithdrawDialogOpen(true)} 
            variant="outline"
            className="border-[#2A2D3E] text-white hover:bg-[#1A1D2E]"
            disabled={!wallet?.available_balance}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div>
          <WalletCard wallet={wallet} loading={loading} />
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2">
          <div className="card-dark p-6">
            <h2 className="text-lg font-semibold text-white mb-6">Transaction History</h2>
            
            {transactions.length > 0 ? (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const config = transactionTypeConfig[tx.type] || transactionTypeConfig.deposit;
                  const Icon = config.icon;
                  const isOutgoing = tx.from_email === user?.email;

                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{config.label}</p>
                          <p className="text-gray-500 text-sm">{tx.description || '-'}</p>
                          <p className="text-gray-600 text-xs">
                            {format(new Date(tx.created_date), 'MMM d, yyyy · h:mm a')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${isOutgoing ? 'text-red-400' : 'text-green-400'}`}>
                          {isOutgoing ? '-' : '+'}{formatAmount(tx.amount)}
                        </p>
                        <Badge className={`${
                          tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-gray-500/20 text-gray-400'
                        } border-0`}>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No transactions yet</h3>
                <p className="text-gray-500">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">Deposit Funds</DialogTitle>
            <DialogDescription className="text-gray-500">
              Add funds to your wallet (simulated)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Payment Method</Label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button className="p-4 rounded-xl border-2 border-[#FF6633] bg-[#FF6633]/10 text-center">
                  <p className="text-white font-medium">MTN MoMo</p>
                  <p className="text-gray-500 text-xs">Mobile Money</p>
                </button>
                <button className="p-4 rounded-xl border border-[#2A2D3E] bg-[#0F1117] text-center hover:border-[#FF6633]/50 transition-colors">
                  <p className="text-white font-medium">Airtel Money</p>
                  <p className="text-gray-500 text-xs">Mobile Money</p>
                </button>
              </div>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Amount (UGX)</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g., 500000"
                className="input-dark"
              />
            </div>
            <div className="flex gap-2">
              {[50000, 100000, 500000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDepositAmount(amount.toString())}
                  className="flex-1 px-4 py-2 rounded-xl bg-[#0F1117] border border-[#2A2D3E] text-gray-400 hover:border-[#FF6633]/50 hover:text-white transition-colors"
                >
                  {formatAmount(amount)}
                </button>
              ))}
            </div>
            <Button 
              onClick={handleDeposit} 
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Deposit'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">Withdraw Funds</DialogTitle>
            <DialogDescription className="text-gray-500">
              Withdraw to your mobile money (simulated)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
              <p className="text-gray-500 text-sm">Available Balance</p>
              <p className="text-xl font-bold text-white">{formatAmount(wallet?.available_balance)}</p>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Amount (UGX)</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="e.g., 100000"
                className="input-dark"
              />
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Mobile Money Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+256 700 000000"
                  className="input-dark pl-12"
                />
              </div>
            </div>
            <Button 
              onClick={handleWithdraw} 
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Withdraw'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}