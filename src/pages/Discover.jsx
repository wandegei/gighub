import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "@/lib/supabaseClient";
import { Search, MapPin, Star, Grid, List, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Discover() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recommendedServices, setRecommendedServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [priceSort, setPriceSort] = useState("none");
  const [viewMode, setViewMode] = useState("grid");
  const [ratingFilter, setRatingFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [servicesData, categoriesData, providersData, reviewsData, skillsData] =
  await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),

    supabase.from("categories").select("*").order("name"),
    supabase.from("profiles").select("*").eq("user_type", "provider"),
    supabase.from("reviews").select("*"),
    supabase.from("skills").select("*"),
  ]);

    setServices(servicesData.data || []);
    setCategories(categoriesData.data || []);
    setProviders(providersData.data || []);
    setReviews(reviewsData.data || []);
    setSkills(skillsData.data || []);

    // Calculate recommended based on ratings   !searchQuery && !categoryFilter
    const servicesWithRating = (servicesData.data || []).map(s => {
      const rating = getProviderRating(s.provider_id, reviewsData.data || []);
      return { ...s, avgRating: parseFloat(rating.avg) || 0, reviewCount: rating.count };
    });

    const recommended = servicesWithRating
      .filter(s => s.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount)
      .slice(0, 6);

    setRecommendedServices(recommended);
    setLoading(false);
  };

  const getProviderRating = (providerId, allReviews = reviews) => {
    const providerReviews = allReviews.filter(r => r.provider_id === providerId);
    if (!providerReviews.length) return { avg: 0, count: 0 };
    const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    return { avg: avg.toFixed(1), count: providerReviews.length };
  };

  const getProvider = (providerId) => providers.find(p => p.id === providerId);
  const getCategory = (categoryId) => categories.find(c => c.id === categoryId);

  const formatAmount = (amount) => {
    if (!amount) return "Negotiable";
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  let filteredServices = services.filter(service => {
    const provider = getProvider(service.provider_id);
    const rating = getProviderRating(service.provider_id);
    const providerSkills = skills.filter(s => s.provider_id === service.provider_id);

    const matchesSearch = service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          provider?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          providerSkills.some(skill => skill.skill_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || service.category_id === categoryFilter;
    const matchesLocation = !locationFilter || provider?.location?.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesRating = ratingFilter === "all" ||
                          (ratingFilter === "4+" && parseFloat(rating.avg) >= 4) ||
                          (ratingFilter === "3+" && parseFloat(rating.avg) >= 3);

    return matchesSearch && matchesCategory && matchesLocation && matchesRating;
  });

  if (priceSort === "low") {
    filteredServices.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (priceSort === "high") {
    filteredServices.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Discover Services</h1>
          <p className="text-[#9BA3AF] text-lg">Find the perfect service provider for your needs</p>
        </div>

        {/* Recommended Section   .eq("is_active", true)*/}
        {!searchQuery && !categoryFilter && recommendedServices.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <h2 className="text-xl font-semibold text-white">Top Rated Services</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedServices.slice(0, 3).map((service) => {
                const provider = getProvider(service.provider_id);
                const category = getCategory(service.category_id);

                return (
                  <Link
                    key={service.id}
                    to={createPageUrl(`ServiceDetail?id=${service.id}`)}
                    className="card-dark p-4 hover:border-[#FF6B3D]/50 transition-all group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden mb-3">
                      {service.image_url ? (
                        <img src={service.image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#FF6B3D]/20 to-[#FF5722]/20 flex items-center justify-center">
                          <Briefcase className="w-10 h-10 text-[#FF6B3D]/50" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-semibold mb-1 line-clamp-1 group-hover:text-[#FF6B3D] transition-colors">
                      {service.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{service.avgRating}</span>
                      <span className="text-gray-500">({service.reviewCount})</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="card-dark p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services, providers..."
                className="input-dark pl-12"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="input-dark w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder="Location"
                  className="input-dark pl-10 w-[140px]"
                />
              </div>

              <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger className="input-dark w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#151922] border-[#1E2430]">
                  <SelectItem value="none">Default</SelectItem>
                  <SelectItem value="low">Price: Low to High</SelectItem>
                  <SelectItem value="high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="input-dark w-[130px]">
                  <SelectValue placeholder="Rating" />
                </SelectTrigger>
                <SelectContent className="bg-[#151922] border-[#1E2430]">
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="4+">4+ Stars</SelectItem>
                  <SelectItem value="3+">3+ Stars</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-[#2A2D3E] rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-3 ${viewMode === "grid" ? "bg-[#FF6633] text-white" : "text-gray-500 hover:text-white"}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-3 ${viewMode === "list" ? "bg-[#FF6633] text-white" : "text-gray-500 hover:text-white"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {!loading && (
          <p className="text-gray-500 mb-6">{filteredServices.length} services found</p>
        )}

        {loading ? (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-dark p-4 animate-pulse">
                <div className="aspect-video bg-[#2A2D3E] rounded-xl mb-4" />
                <div className="h-5 bg-[#2A2D3E] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#2A2D3E] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
            {filteredServices.map(service => {
              const provider = getProvider(service.provider_id);
              const category = getCategory(service.category_id);
              const rating = getProviderRating(service.provider_id);

              return (
                <Link
                  key={service.id}
                  to={createPageUrl(`ServiceDetail?id=${service.id}`)}
                  className={`card-dark overflow-hidden hover:border-[#FF6633]/30 transition-all group ${viewMode === "list" ? "flex" : ""}`}
                >
                  <div className={`relative overflow-hidden ${viewMode === "list" ? "w-48 flex-shrink-0" : "aspect-video"}`}>
                    {service.image_url ? (
                      <img src={service.image_url} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#FF6633]/20 to-[#E55A2B]/20 flex items-center justify-center">
                        <Briefcase className="w-12 h-12 text-[#FF6633]/50" />
                      </div>
                    )}
                    {category && <Badge className="absolute top-3 left-3 bg-black/50 text-white border-0">{category.name}</Badge>}
                  </div>

                  <div className="p-4 flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#FF6633] transition-colors line-clamp-1">
                      {service.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mt-1 mb-3">
                      {service.description || "No description"}
                    </p>

                    {provider && (
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#2A2D3E]">
                          {provider.avatar_url ? (
                            <img src={provider.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br from-[#FF6633] to-[#E55A2B]">
                              {provider.full_name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{provider.full_name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{provider.location || "No location"}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-[#2A2D3E]">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-medium">{rating.avg || "New"}</span>
                        <span className="text-gray-500 text-sm">({rating.count})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[#FF6633] font-semibold">{formatAmount(service.price)}</p>
                        {service.price_type && service.price_type !== "fixed" && (
                          <p className="text-gray-600 text-xs capitalize">{service.price_type}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card-dark p-12 text-center">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
            <Button onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setLocationFilter(""); }} variant="outline" className="border-[#2A2D3E] text-white hover:bg-[#1A1D2E]">
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}