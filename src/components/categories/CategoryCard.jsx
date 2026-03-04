import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronRight } from 'lucide-react';

export default function CategoryCard({ category }) {
  return (
    <Link 
      to={createPageUrl(`CategoryProviders?slug=${category.slug}`)}
      className="group card-dark overflow-hidden hover:border-[#FF6633]/50 transition-all duration-300"
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={category.image_url || `https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop`}
          alt={category.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1117] via-transparent to-transparent" />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white group-hover:text-[#FF6633] transition-colors">
            {category.name}
          </h3>
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FF6633] group-hover:translate-x-1 transition-all" />
        </div>
        {category.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{category.description}</p>
        )}
      </div>
    </Link>
  );
}