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
  const [userType, setUserType] = useState("client");

  useEffect(() => {
    detectUserTypeAndLoad();
  }, []);

  /* -------------------------------------------------- */
  /* Detect user type then load providers  providerIds */
  /* -------------------------------------------------- */

  const detectUserTypeAndLoad = async () => {

    setLoading(true);

    try {

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUserType("client");
        await loadProviders("client");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", user.id)
        .maybeSingle();

      const type = profile?.user_type || "client";

      setUserType(type);

      await loadProviders(type);

    } catch (err) {

      console.error("User detection error:", err);

    } finally {

      setLoading(false);

    }

  };

  /* -------------------------------------------------- */
  /* Load providers */
  /* -------------------------------------------------- */

  const loadProviders = async (currentUserType) => {

    try {

      const urlParams = new URLSearchParams(window.location.search);
      const slug = urlParams.get("slug");

      let categoryData = null;
      let providerIds = [];

      /* ---------- Load category ---------- */

      if (slug) {

        const { data: categories, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", slug)
          .limit(1);

        if (error) console.error(error);

        if (categories?.length > 0) {

          categoryData = categories[0];

          setCategory(categoryData);

          const { data: relations, error: relError } = await supabase
            .from("provider_categories")
            .select("provider_id")
            .eq("category_id", categoryData.id);

          if (relError) console.error(relError);

          providerIds = relations?.map(r => r.provider_id) || [];

        }

      }

      let allProviders = [];

      /* ---------- Providers in this category ---------- */

      if (providerIds.length > 0) {

        const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", providerIds); // ✅ CORRECT

        if (error) console.error(error);

        allProviders = data || [];

      }

      /* ---------- Fallback: show all providers ---------- */

      if (currentUserType === "client" && allProviders.length === 0) {

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_type", "provider");

        if (error) console.error(error);

        allProviders = data || [];

      }

      /* ---------- Ensure ID exists ---------- */

      const providersWithId = (allProviders || []).map(p => ({
        ...p,
        id: p.id || p.user_id
      }));

      setProviders(providersWithId);

      console.log("Providers loaded:", providersWithId);

    } catch (err) {

      console.error("Provider load error:", err);

    }

  };

  /* -------------------------------------------------- */
  /* Filtering */
  /* -------------------------------------------------- */

  const filteredProviders = providers.filter(provider => {

    const matchesSearch =
      provider.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.bio?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !locationFilter ||
      provider.location?.toLowerCase().includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;

  });

  /* -------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------- */

  return (

    <div className="min-h-screen py-8 lg:py-12">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back Button */}

        <Link
          to={createPageUrl("Categories")}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-black mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Categories
        </Link>

        {/* Header */}

        <div className="mb-10">

          {category ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
                {category.name}
              </h1>

              {category.description && (
                <p className="text-gray-500 text-lg">
                  {category.description}
                </p>
              )}
            </>
          ) : (
            <h1 className="text-3xl sm:text-4xl font-bold text-black mb-3">
              All Providers
            </h1>
          )}

        </div>

        {/* Filters */}

        <div className="flex flex-col sm:flex-row gap-4 mb-10">

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search providers..."
              className="input-dark pl-12"
            />
          </div>

          <div className="relative sm:w-64">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
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
          </p>
        )}

        {/* Providers Grid  providerIds */}

        <ProviderGrid
          providers={filteredProviders}
          loading={loading}
          userType={userType}
        />

      </div>

    </div>

  );

}