import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { MapPin, Star } from 'lucide-react';

export default function ProviderCard({ provider }) {
  return (
    <div className="card-dark p-6 hover:border-[#FF6633]/30 transition-all duration-300 animate-fade-in">
      <div className="flex flex-col items-center text-center">
        {/* Avatar with green border */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-[#7CB342] to-[#689F38]">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1D2E]">
              {provider.avatar_url ? (
                <img 
                  src={provider.avatar_url} 
                  alt={provider.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6633] to-[#E55A2B]">
                  <span className="text-2xl font-bold text-white">
                    {provider.full_name?.charAt(0)?.toUpperCase() || 'P'}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Online indicator */}
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#7CB342] rounded-full border-2 border-[#1A1D2E]" />
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-white mb-1">
          {provider.full_name}
        </h3>

        {/* Location */}
        {provider.location && (
          <div className="flex items-center gap-1 text-gray-500 text-sm mb-4">
            <MapPin className="w-3.5 h-3.5" />
            <span>{provider.location}</span>
          </div>
        )}

        {/* Rating placeholder */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
            />
          ))}
          <span className="text-sm text-gray-500 ml-1">(4.0)</span>
        </div>

        {/* View Profile Button */}
        <Link
          to={createPageUrl(`ProviderProfile?id=${provider.id}`)}
          className="w-full py-2.5 px-4 bg-[#7CB342] hover:bg-[#689F38] text-white font-medium rounded-xl transition-colors"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}