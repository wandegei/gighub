import React from 'react';
import CategoryCard from './CategoryCard';

export default function CategoryGrid({ categories, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-dark overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-[#2A2D3E]" />
            <div className="p-4 space-y-3">
              <div className="h-5 bg-[#2A2D3E] rounded w-3/4" />
              <div className="h-4 bg-[#2A2D3E] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  );
}