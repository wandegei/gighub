import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CategoryGrid from '../components/categories/CategoryGrid';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await base44.entities.Category.list('-created_date');
    setCategories(data);
    setLoading(false);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Service Categories</h1>
          <p className="text-gray-500 text-lg">Find the right professional for your needs</p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="input-dark pl-12"
            />
          </div>
        </div>

        {/* Results Count */}
        {!loading && (
          <p className="text-gray-500 mb-6">
            Showing {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
            {searchQuery && ` for "${searchQuery}"`}
          </p>
        )}

        {/* Grid */}
        <CategoryGrid categories={filteredCategories} loading={loading} />

        {/* Empty State */}
        {!loading && filteredCategories.length === 0 && (
          <div className="card-dark p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#2A2D3E] flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No categories found</h3>
            <p className="text-gray-500">Try adjusting your search term</p>
          </div>
        )}
      </div>
    </div>
  );
}