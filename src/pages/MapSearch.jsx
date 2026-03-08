import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from "@/lib/supabaseClient";
import { MapPin, Star, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
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
  const [searchLocation, setSearchLocation] = useState('');
  const [mapCenter, setMapCenter] = useState([0.3476, 32.5825]); // Kampala

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Fetch providers
    const { data: providersData } = await supabase
      .from('Profile')
      .select('*')
      .eq('user_type', 'provider');

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('Review')
      .select('*')
      .order('created_date', { ascending: false });

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('Category')
      .select('*')
      .order('name', { ascending: true });

    // Fetch verifications
    const { data: verificationsData } = await supabase
      .from('Verification')
      .select('*')
      .eq('status', 'verified');

    setProviders(providersData || []);
    setReviews(reviewsData || []);
    setCategories(categoriesData || []);
    setVerifications(verificationsData || []);
    setLoading(false);
  };

  const getProviderRating = (providerId) => {
    const providerReviews = reviews.filter(r => r.provider_id === providerId);
    if (providerReviews.length === 0) return 0;
    const avg = providerReviews.reduce((sum, r) => sum + r.rating, 0) / providerReviews.length;
    return avg.toFixed(1);
  };

  const isVerified = (providerId) => {
    return verifications.some(v => v.provider_id === providerId);
  };

  // Mock locations for demo (replace with real coordinates in production)
  const getProviderLocation = (index) => {
    const locations = [
      [0.3476, 32.5825], // Kampala
      [0.3136, 32.5811], // Nakawa
      [0.3345, 32.6025], // Kololo
      [0.3567, 32.5643], // Makerere
      [0.2920, 32.6470], // Ntinda
    ];
    return locations[index % locations.length];
  };

  const handleLocationSearch = () => {
    if (searchLocation.toLowerCase().includes('kampala')) {
      setMapCenter([0.3476, 32.5825]);
    } else if (searchLocation.toLowerCase().includes('nakawa')) {
      setMapCenter([0.3136, 32.5811]);
    }
  };

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Map Search</h1>
          <p className="text-[#FF6B3D]">Find providers near you</p>
        </div>

        <div className="mb-6 flex gap-2">
          <Input
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search location (e.g., Kampala, Nakawa)..."
            className="input-dark flex-1"
            onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
          />
          <Button onClick={handleLocationSearch} className="btn-primary">
            <Navigation className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card-dark p-2 rounded-xl overflow-hidden" style={{ height: '600px' }}>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <LocationMarker position={mapCenter} setPosition={setMapCenter} />

                {providers.map((provider, index) => {
                  const location = getProviderLocation(index);
                  const rating = getProviderRating(provider.id);
                  const verified = isVerified(provider.id);

                  return (
                    <Marker key={provider.id} position={location}>
                      <Popup>
                        <div className="p-2">
                          <h3 className="font-semibold mb-1">{provider.full_name}</h3>
                          {verified && (
                            <Badge className="mb-2 bg-green-500 text-white text-xs">Verified</Badge>
                          )}
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">{rating || 'New'}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{provider.location}</p>
                          <Link to={createPageUrl(`ProviderProfile?id=${provider.id}`)}>
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

          <div className="space-y-4">
            <div className="card-dark p-4">
              <h3 className="text-lg font-semibold text-white mb-4">Nearby Providers</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {providers.slice(0, 10).map((provider) => {
                  const rating = getProviderRating(provider.id);
                  const verified = isVerified(provider.id);

                  return (
                    <Link
                      key={provider.id}
                      to={createPageUrl(`ProviderProfile?id=${provider.id}`)}
                      className="block p-3 rounded-xl bg-[#0A0E1A] hover:bg-[#151922] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {provider.avatar_url ? (
                            <img src={provider.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-semibold" style={{ color: 'black' }}>
                              {provider.full_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white truncate">{provider.full_name}</h4>
                            {verified && (
                              <Badge className="bg-green-500 text-white text-xs">✓</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm text-white">{rating || 'New'}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{provider.location || 'Location not set'}</span>
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