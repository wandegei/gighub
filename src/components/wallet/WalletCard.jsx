import React from 'react';
import { Wallet, Lock, CheckCircle } from 'lucide-react';

export default function WalletCard({ wallet, loading }) {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="card-dark p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-8 bg-[#2A2D3E] rounded w-32" />
          <div className="h-12 bg-[#2A2D3E] rounded w-48" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-[#2A2D3E] rounded" />
            <div className="h-16 bg-[#2A2D3E] rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-dark overflow-hidden">
      <div className="bg-gradient-to-br from-[#FF6633] to-[#E55A2B] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-sm">Total Balance</p>
            <h2 className="text-2xl font-bold text-white">{formatAmount(wallet?.balance)}</h2>
          </div>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-[#7CB342]" />
            <span className="text-gray-500 text-sm">Available</span>
          </div>
          <p className="text-lg font-semibold text-white">{formatAmount(wallet?.available_balance)}</p>
        </div>
        
        <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-500 text-sm">Locked (Escrow)</span>
          </div>
          <p className="text-lg font-semibold text-white">{formatAmount(wallet?.locked_balance)}</p>
        </div>
      </div>
    </div>
  );
}