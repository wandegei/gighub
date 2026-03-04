import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Plus, Briefcase, MapPin, Calendar, DollarSign, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

export default function JobPostings() {
  const [postings, setPostings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [postingsData, categoriesData] = await Promise.all([
      base44.entities.JobPosting.filter({ status: 'open' }, '-created_date'),
      base44.entities.Category.list('name')
    ]);
    
    setPostings(postingsData);
    setCategories(categoriesData);
    
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        const profiles = await base44.entities.Profile.filter({ user_email: userData.email });
        if (profiles.length > 0) setProfile(profiles[0]);
      }
    } catch (e) {}
    
    setLoading(false);
  };

  const getCategory = (id) => categories.find(c => c.id === id);

  const formatBudget = (min, max) => {
    if (!min && !max) return 'Budget not specified';
    if (!max) return `From UGX ${min.toLocaleString()}`;
    return `UGX ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  let filteredPostings = postings.filter(posting => {
    const matchesSearch = posting.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          posting.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || posting.category_id === categoryFilter;
    const matchesBudget = budgetFilter === 'all' || 
                         (budgetFilter === 'low' && posting.budget_max && posting.budget_max < 500000) ||
                         (budgetFilter === 'mid' && posting.budget_min && posting.budget_min >= 500000 && posting.budget_max && posting.budget_max < 2000000) ||
                         (budgetFilter === 'high' && posting.budget_min && posting.budget_min >= 2000000);
    
    return matchesSearch && matchesCategory && matchesBudget;
  });

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Job Postings</h1>
            <p className="text-[#FF6B3D]">Browse open jobs and apply with your proposal</p>
          </div>
          {profile?.user_type === 'client' && (
            <Link to={createPageUrl('PostJob')}>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Post a Job
              </Button>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="card-dark p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="input-dark pl-12"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="input-dark w-full lg:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#151922] border-[#1E2430]">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="input-dark w-full lg:w-[180px]">
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent className="bg-[#151922] border-[#1E2430]">
                <SelectItem value="all">All Budgets</SelectItem>
                <SelectItem value="low">&lt; 500K</SelectItem>
                <SelectItem value="mid">500K - 2M</SelectItem>
                <SelectItem value="high">&gt; 2M</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <p className="text-white mb-6">{filteredPostings.length} jobs found</p>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card-dark p-6 animate-pulse">
                <div className="h-6 bg-[#1E2430] rounded w-3/4 mb-4" />
                <div className="h-4 bg-[#1E2430] rounded w-full mb-2" />
                <div className="h-4 bg-[#1E2430] rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredPostings.length > 0 ? (
          <div className="space-y-4">
            {filteredPostings.map(posting => {
              const category = getCategory(posting.category_id);
              return (
                <Link
                  key={posting.id}
                  to={createPageUrl(`JobPostingDetail?id=${posting.id}`)}
                  className="card-dark p-6 block hover:border-[#FF6B3D]/50 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-6 h-6" style={{ color: 'black' }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2 hover:text-[#FF6B3D] transition-colors">
                            {posting.title}
                          </h3>
                          <p className="text-white line-clamp-2 mb-3">{posting.description}</p>
                          
                          <div className="flex flex-wrap gap-3 text-sm">
                            {category && (
                              <Badge className="bg-[#FF6B3D]/10 text-[#FF6B3D] border-[#FF6B3D]/30">
                                {category.name}
                              </Badge>
                            )}
                            {posting.location && (
                              <span className="flex items-center gap-1 text-white">
                                <MapPin className="w-4 h-4" />
                                {posting.location}
                              </span>
                            )}
                            {posting.deadline && (
                              <span className="flex items-center gap-1 text-white">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(posting.deadline), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-[#FF6B3D] font-semibold mb-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="text-lg">{formatBudget(posting.budget_min, posting.budget_max)}</span>
                      </div>
                      <p className="text-sm text-gray-500">Posted {format(new Date(posting.created_date), 'MMM d')}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card-dark p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}