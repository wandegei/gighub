import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { supabase } from "../../lib/supabaseClient";
import { Star, Shield, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FeaturedProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch providers
      const { data: providersData, error: providersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_type", "provider");

      if (providersError) throw providersError;

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*");

      if (reviewsError) throw reviewsError;

      // Fetch verifications
      const { data: verificationsData, error: verificationsError } =
        await supabase
          .from("verifications")
          .select("*")
          .eq("status", "verified");

      if (verificationsError) throw verificationsError;

      // Calculate ratings
      const providersWithRatings = providersData.map((provider) => {
        const providerReviews = reviewsData.filter(
          (r) => r.provider_id === provider.id
        );

        const avgRating =
          providerReviews.length > 0
            ? providerReviews.reduce((sum, r) => sum + r.rating, 0) /
              providerReviews.length
            : 0;

        const isVerified = verificationsData.some(
          (v) => v.provider_id === provider.id
        );

        return {
          ...provider,
          avgRating,
          reviewCount: providerReviews.length,
          isVerified,
        };
      });

      // Featured providers logic
      const featured = providersWithRatings
        .filter((p) => p.isVerified && p.avgRating >= 4.5 && p.reviewCount >= 3)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 6);

      setProviders(featured);
    } catch (error) {
      console.error("Error loading featured providers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card-dark p-6 animate-pulse">
            <div className="h-24 w-24 bg-[#1E2430] rounded-full mx-auto mb-4" />
            <div className="h-4 bg-[#1E2430] rounded w-3/4 mx-auto mb-2" />
            <div className="h-3 bg-[#1E2430] rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="card-dark p-12 text-center">
        <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500">No featured providers yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {providers.map((provider) => (
        <Link
          key={provider.id}
          to={createPageUrl(`ProviderProfile?id=${provider.id}`)}
          className="card-dark p-6 hover:border-[#FF6B3D] transition-all text-center group relative overflow-hidden"
        >
          <div className="absolute top-4 right-4">
            <Badge className="bg-gradient-to-r from-[#FF6B3D] to-[#FF5722]">
              <Award className="w-3 h-3 mr-1" style={{ color: "black" }} />
              <span style={{ color: "black" }}>Featured</span>
            </Badge>
          </div>

          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-[#FF6B3D]">
              {provider.profile_image_url ? (
                <img
                  src={provider.profile_image_url}
                  alt={provider.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: "black" }}>
                    {provider.full_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {provider.isVerified && (
              <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center border-2 border-[#0A0E1A]">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#FF6B3D] transition-colors">
            {provider.full_name}
          </h3>

          {provider.bio && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
              {provider.bio}
            </p>
          )}

          <div className="flex items-center justify-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-white">
              {provider.avgRating.toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">
              ({provider.reviewCount} reviews)
            </span>
          </div>

          {provider.location && (
            <p className="text-xs text-gray-600">{provider.location}</p>
          )}
        </Link>
      ))}
    </div>
  );
}