import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Briefcase, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JobCard from '../components/jobs/JobCard';

export default function DashboardJobs() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

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
    
    // Load jobs
    const allJobs = await base44.entities.Job.list('-created_date');
    const userJobs = allJobs.filter(j => 
      j.client_email === userData.email || j.provider_email === userData.email
    );
    setJobs(userJobs);
    
    setLoading(false);
  };

  const filteredJobs = jobs.filter(job => {
    // Search filter
    const matchesSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    // Role filter
    let matchesRole = true;
    if (roleFilter === 'client') {
      matchesRole = job.client_email === user?.email;
    } else if (roleFilter === 'provider') {
      matchesRole = job.provider_email === user?.email;
    }
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const statusCounts = {
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    funded: jobs.filter(j => j.status === 'funded').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    completed: jobs.filter(j => j.status === 'completed').length,
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">My Jobs</h1>
          <p className="text-gray-500">Manage your jobs and track progress</p>
        </div>
        {profile?.user_type === 'client' && (
          <Link to={createPageUrl('Providers')}>
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
              <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
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
          <TabsTrigger value="all" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            All
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            Pending
          </TabsTrigger>
          <TabsTrigger value="funded" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            Funded
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            In Progress
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
            Completed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Jobs List */}
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
            <JobCard key={job.id} job={job} userEmail={user?.email} />
          ))}
        </div>
      ) : (
        <div className="card-dark p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
          <p className="text-gray-500 mb-4">
            {statusFilter !== 'all' 
              ? `No ${statusFilter.replace('_', ' ')} jobs`
              : profile?.user_type === 'client' 
                ? 'Start by hiring a service provider' 
                : 'Wait for clients to hire you'}
          </p>
          {profile?.user_type === 'client' && statusFilter === 'all' && (
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
  );
}