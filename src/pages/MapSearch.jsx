import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "@/lib/supabaseClient";
import { MapPin, Star, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* Fix Leaflet marker icons */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

/* Map fly animation */
function LocationMarker({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 13);
  }, [position, map]);

  return null;
}

export default function MapSearch() {
  const [providers, setProviders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchLocation, setSearchLocation] = useState("");
  const [mapCenter, setMapCenter] = useState([0.3476, 32.5825]); // Kampala

  useEffect(() => {
    loadData();
  }, []);

  /* Locations lookup */
  const locations = {
    kampala: [0.3476, 32.5825],
    nakawa: [0.3136, 32.5811],
    kololo: [0.3345, 32.6025],
    ntinda: [0.292, 32.647],
    makerere: [0.3567, 32.5643],
  };

  /* Load data from Supabase */
  const loadData = async () => {
    setLoading(true);

    const [
      providersRes,
      reviewsRes,
      categoriesRes,
      verificationsRes,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_type", "provider"),

      supabase.from("reviews").select("*"),

      supabase.from("categories").select("*").order("name", { ascending: true }),

      supabase
        .from("verifications")
        .select("*")
        .eq("status", "verified"),
    ]);

    setProviders(providersRes.data || []);
    setReviews(reviewsRes.data || []);
    setCategories(categoriesRes.data || []);
    setVerifications(verificationsRes.data || []);

    setLoading(false);
  };

  /* Provider rating */
  const getProviderRating = (providerId) => {
    const providerReviews = reviews.filter(
      (r) => r.provider_id === providerId
    );

    if (!providerReviews.length) {
      return { avg: "New", count: 0 };
    }

    const avg =
      providerReviews.reduce((sum, r) => sum + r.rating, 0) /
      providerReviews.length;

    return {
      avg: avg.toFixed(1),
      count: providerReviews.length,
    };
  };

  /* Verification check */
  const isVerified = (providerId) => {
    return verifications.some((v) => v.provider_id === providerId);
  };

  /* Location search */
  const handleLocationSearch = () => {
    const key = searchLocation.toLowerCase();

    if (locations[key]) {
      setMapCenter(locations[key]);
    }
  };

  /* Loading state */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-white">
        Loading map...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Map Search
          </h1>
          <p className="text-[#FF6B3D]">Find providers near you</p>
        </div>

        {/* Search */}
        <div className="mb-6 flex gap-2">
          <Input
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search location (Kampala, Nakawa...)"
            className="input-dark flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLocationSearch();
              }
            }}
          />

          <Button onClick={handleLocationSearch} className="btn-primary">
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAP */}
          <div className="lg:col-span-2">
            <div
              className="card-dark p-2 rounded-xl overflow-hidden"
              style={{ height: "600px" }}
            >
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap"
                />

                <LocationMarker position={mapCenter} />

                {providers.map((provider) => {

                  if (!provider.latitude || !provider.longitude) return null;

                  const location = [
                    provider.latitude,
                    provider.longitude,
                  ];

                  const rating = getProviderRating(provider.id);
                  const verified = isVerified(provider.id);

                  return (
                    <Marker key={provider.id} position={location}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold mb-1">
                            {provider.full_name}
                          </h3>

                          {verified && (
                            <Badge className="mb-2 bg-green-500 text-white text-xs">
                              Verified
                            </Badge>
                          )}

                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{rating.avg}</span>
                          </div>

                          <p className="text-xs text-gray-600 mb-2">
                            {provider.location}
                          </p>

                          <Link
                            to={createPageUrl(
                              `ProviderProfile?id=${provider.id}`
                            )}
                          >
                            <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded">
                              View Profile
                            </button>
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>

          {/* PROVIDER LIST */}
          <div className="space-y-4">
            <div className="card-dark p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Nearby Providers
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {providers.slice(0, 10).map((provider) => {

                  const rating = getProviderRating(provider.id);
                  const verified = isVerified(provider.id);

                  return (
                    <Link
                      key={provider.id}
                      to={createPageUrl(
                        `ProviderProfile?id=${provider.id}`
                      )}
                      className="block p-3 rounded-xl bg-[#0A0E1A] hover:bg-[#151922]"
                    >
                      <div className="flex items-start gap-3">

                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center overflow-hidden">

                          {provider.avatar_url ? (
                            <img
                              src={provider.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-semibold text-black">
                              {provider.full_name?.charAt(0)}
                            </span>
                          )}

                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white truncate">
                              {provider.full_name}
                            </h4>

                            {verified && (
                              <Badge className="bg-green-500 text-white text-xs">
                                ✓
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-white">
                              {rating.avg}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {provider.location || "Location not set"}
                            </span>
                          </div>

                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}