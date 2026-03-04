import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, MapPin, Phone, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

export default function DashboardProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    location: '',
    bio: '',
    user_type: 'client',
    profile_image_url: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    
    // Load profile
    const profiles = await base44.entities.Profile.filter({ user_email: userData.email });
    if (profiles.length > 0) {
      const p = profiles[0];
      setProfile(p);
      setFormData({
        full_name: p.full_name || '',
        phone_number: p.phone_number || '',
        location: p.location || '',
        bio: p.bio || '',
        user_type: p.user_type || 'client',
        profile_image_url: p.profile_image_url || ''
      });
      
      // Load selected categories
      const relations = await base44.entities.ProviderCategory.filter({ provider_id: p.id });
      setSelectedCategories(relations.map(r => r.category_id));
    } else {
      setFormData(prev => ({ ...prev, full_name: userData.full_name || '' }));
    }
    
    // Load all categories
    const cats = await base44.entities.Category.list('name');
    setCategories(cats);
    
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData(prev => ({ ...prev, profile_image_url: file_url }));
    setUploading(false);
    toast.success('Image uploaded');
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    if (!formData.full_name) {
      toast.error('Please enter your name');
      return;
    }
    
    setSaving(true);
    
    if (profile) {
      // Update existing profile
      await base44.entities.Profile.update(profile.id, {
        ...formData,
        user_email: user.email
      });
      
      // Update categories if provider
      if (formData.user_type === 'provider') {
        // Delete old relations
        const oldRelations = await base44.entities.ProviderCategory.filter({ provider_id: profile.id });
        for (const rel of oldRelations) {
          await base44.entities.ProviderCategory.delete(rel.id);
        }
        // Create new relations
        for (const catId of selectedCategories) {
          await base44.entities.ProviderCategory.create({
            provider_id: profile.id,
            category_id: catId,
            provider_email: user.email
          });
        }
      }
      
      toast.success('Profile updated');
    } else {
      // Create new profile
      const newProfile = await base44.entities.Profile.create({
        ...formData,
        user_email: user.email
      });
      setProfile(newProfile);
      
      // Create wallet
      await base44.entities.Wallet.create({
        user_id: newProfile.id,
        user_email: user.email,
        balance: 0,
        available_balance: 0,
        locked_balance: 0
      });
      
      // Create category relations if provider
      if (formData.user_type === 'provider') {
        for (const catId of selectedCategories) {
          await base44.entities.ProviderCategory.create({
            provider_id: newProfile.id,
            category_id: catId,
            provider_email: user.email
          });
        }
      }
      
      toast.success('Profile created');
    }
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-[#2A2D3E] rounded w-48" />
            <div className="card-dark p-8 space-y-6">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full bg-[#2A2D3E]" />
              </div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-[#2A2D3E] rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">Edit Profile</h1>
        
        <div className="card-dark p-6 lg:p-8">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] p-1">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1D2E]">
                  {formData.profile_image_url ? (
                    <img 
                      src={formData.profile_image_url} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF6633] flex items-center justify-center cursor-pointer hover:bg-[#E55A2B] transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="text-gray-500 text-sm mt-3">Click the camera icon to upload a photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <Label className="text-gray-400 mb-2 block">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
                className="input-dark"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Account Type</Label>
              <Select 
                value={formData.user_type} 
                onValueChange={(value) => setFormData({ ...formData, user_type: value })}
              >
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  <SelectItem value="client">Client - I want to hire services</SelectItem>
                  <SelectItem value="provider">Provider - I offer services</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+256 700 000000"
                  className="input-dark pl-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Kampala, Uganda"
                  className="input-dark pl-12"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Bio</Label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                className="input-dark min-h-[120px]"
              />
            </div>

            {/* Categories (for providers) */}
            {formData.user_type === 'provider' && (
              <div>
                <Label className="text-gray-400 mb-3 block">Service Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${
                        selectedCategories.includes(cat.id)
                          ? 'bg-[#FF6633] text-white'
                          : 'bg-[#0F1117] text-gray-400 border border-[#2A2D3E] hover:border-[#FF6633]/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {categories.length === 0 && (
                  <p className="text-gray-500 text-sm">No categories available</p>
                )}
              </div>
            )}

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}