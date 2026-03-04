import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { 
  Wallet, 
  Briefcase, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import WalletCard from '../components/wallet/WalletCard';
import JobCard from '../components/jobs/JobCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    
    // Load profile
    const profiles = await base44.entities.Profile.filter({ user_email: userData.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
    }
    
    // Load wallet
    const wallets = await base44.entities.Wallet.filter({ user_email: userData.email });
    if (wallets.length > 0) {
      setWallet(wallets[0]);
    }
    
    // Load jobs
    const allJobs = await base44.entities.Job.list('-created_date', 5);
    const userJobs = allJobs.filter(j => 
      j.client_email === userData.email || j.provider_email === userData.email
    );
    setJobs(userJobs);
    
    setLoading(false);
  };

  const stats = [
    {
      label: 'Total Jobs',
      value: jobs.length,
      icon: Briefcase,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      label: 'Completed',
      value: jobs.filter(j => j.status === 'completed').length,
      icon: ArrowUpRight,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    {
      label: 'In Progress',
      value: jobs.filter(j => j.status === 'in_progress').length,
      icon: ArrowDownRight,
      color: 'text-[#FF6633]',
      bgColor: 'bg-[#FF6633]/10'
    }
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        <p className="text-gray-500">Here's what's happening with your account today.</p>
      </div>

      {/* Stats Grid */}
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
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="lg:col-span-1">
          <WalletCard wallet={wallet} loading={loading} />
          <div className="mt-4 flex gap-3">
            <Link to={createPageUrl('DashboardWallet')} className="flex-1">
              <Button variant="outline" className="w-full border-[#2A2D3E] text-white hover:bg-[#1A1D2E]">
                <Wallet className="w-4 h-4 mr-2" />
                View Wallet
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2">
          <div className="card-dark p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
              <Link 
                to={createPageUrl('DashboardJobs')}
                className="flex items-center gap-1 text-[#FF6633] hover:text-[#E55A2B] text-sm"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E] animate-pulse">
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
                  {profile?.user_type === 'client' 
                    ? 'Start by hiring a service provider' 
                    : 'Wait for clients to hire you'}
                </p>
                {profile?.user_type === 'client' && (
                  <Link to={createPageUrl('Providers')}>
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
    </div>
  );
}