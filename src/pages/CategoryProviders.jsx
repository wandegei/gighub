import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "../lib/supabaseClient";
import { Search, ChevronLeft, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProviderGrid from "../components/providers/ProviderGrid";

export default function CategoryProviders() {
  const [category, setCategory] = useState(null);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get("slug");

    if (!slug) {
      setLoading(false);
      return;
    }

    // Load category by slug
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug);

    if (catError) {
      console.error("Error fetching category:", catError);
      setLoading(false);
      return;
    }

    if (categories?.length > 0) {
      setCategory(categories[0]);

      // Load provider-category relations
      const { data: relations, error: relError } = await supabase
        .from("provider_categories")
        .select("provider_id")
        .eq("category_id", categories[0].id);

      if (relError) {
        console.error("Error fetching provider relations:", relError);
        setLoading(false);
        return;
      }

      const providerIds = relations.map((r) => r.provider_id);

      if (providerIds.length > 0) {
        const { data: allProviders, error: provError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", providerIds)
          .eq("user_type", "provider");

        if (provError) {
          console.error("Error fetching providers:", provError);
        } else {
          setProviders(allProviders || []);
        }
      }
    }

    setLoading(false);
  };

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.bio?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter ||
      provider.location?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          to={createPageUrl("Categories")}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Categories
        </Link>

        {/* Header */}
        <div className="mb-10">
          {category ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {category.name}
              </h1>
              {category.description && (
                <p className="text-gray-500 text-lg">{category.description}</p>
              )}
            </>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Providers
            </h1>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search providers..."
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
            {filteredProviders.length}{" "}
            {filteredProviders.length === 1 ? "provider" : "providers"} found
            {searchQuery && ` for "${searchQuery}"`}
            {locationFilter && ` in "${locationFilter}"`}
          </p>
        )}

        {/* Grid */}
        <ProviderGrid providers={filteredProviders} loading={loading} />
      </div>
    </div>
  );
}