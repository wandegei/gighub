import React from "react";
import ProviderCard from "./ProviderCard";

export default function ProviderGrid({ providers, loading, userType }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card-dark p-6 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-[#2A2D3E] mb-4" />
              <div className="h-5 bg-[#2A2D3E] rounded w-32 mb-2" />
              <div className="h-4 bg-[#2A2D3E] rounded w-24 mb-4" />
              <div className="h-10 bg-[#2A2D3E] rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="card-dark p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#2A2D3E] flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">👤</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          {userType === "client"
            ? "No providers in this category, showing all providers below."
            : "No providers found"}
        </h3>
        <p className="text-gray-500">
          {userType === "client"
            ? "You can still browse all providers in the system."
            : "Try adjusting your search or browse other categories."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {providers.map(provider => (
        <ProviderCard key={provider.id || provider.user_id} provider={provider} />
      ))}
    </div>
  );
}