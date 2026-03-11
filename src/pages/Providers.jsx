import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // your Supabase client
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ProviderGrid from '../components/providers/ProviderGrid';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_type', 'provider')
      .order('created_at', { ascending: false }); 

    if (error) {
      console.error('Error fetching providers:', error.message);
      setProviders([]);
    } else {
      setProviders(data);
    }

    setLoading(false);
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          provider.bio?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !locationFilter || 
                            provider.location?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">All Providers</h1>
          <p className="text-gray-500 text-lg">Browse all service providers on GigHub</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search providers by name or skills..."
              className="input-dark pl-12"
            />
          </div>
          <div className="relative sm:w-64">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Filter by location..."
              className="input-dark pl-12"
            />
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-gray-500 mb-6">
            {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'} found
          </p>
        )}

        {/* Grid */}
        <ProviderGrid providers={filteredProviders} loading={loading} />
      </div>
    </div>
  );
}