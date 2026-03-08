import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { createPageUrl } from "../utils";
import { User, MapPin, Phone, Camera, Loader2, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CompleteProfile() {
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState(1);

  const userType = localStorage.getItem("selectedUserType") || "client";

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    location: "",
    bio: "",
    avatar_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error || !currentUser) {
        window.location.href = createPageUrl("CompleteProfile"); // Redirect to login flow
        return;
      }

      setUser(currentUser);
      setFormData(prev => ({ ...prev, full_name: currentUser.user_metadata.full_name || "" }));

      // Check if profile exists
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_email", currentUser.email);

      if (profiles?.length > 0) {
        window.location.href = createPageUrl("Dashboard");
        return;
      }

      // Load categories
      const { data: cats } = await supabase.from("categories").select("*").order("name", { ascending: true });
      setCategories(cats || []);
    } catch (err) {
      console.error(err);
      window.location.href = createPageUrl("CompleteProfile");
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(`${user.id}/${file.name}`, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const file_url = supabase.storage.from("profile-images").getPublicUrl(data.path).publicUrl;
      setFormData(prev => ({ ...prev, avatar_url: file_url }));
      toast.success("Photo uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    }

    setUploading(false);
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.full_name || !formData.phone_number || !formData.location) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (userType === "provider") setStep(2);
      else handleComplete();
    } else if (step === 2) {
      if (selectedCategories.length === 0) {
        toast.error("Please select at least one category");
        return;
      }
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setSaving(true);

    try {
      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert([{
          ...formData,
          user_type: userType,
          user_email: user.email
        }])
        .select()
        .single();

      if (profileError) throw profileError;

      // Create wallet
      await supabase.from("wallets").insert([{
        user_id: newProfile.id,
        user_email: user.email,
        balance: 0,
        available_balance: 0,
        locked_balance: 0
      }]);

      // Create provider-category relations
      if (userType === "provider") {
        const relations = selectedCategories.map(catId => ({
          provider_id: newProfile.id,
          category_id: catId,
          provider_email: user.email
        }));
        await supabase.from("provider_categories").insert(relations);
      }

      // Create welcome notification
      await supabase.from("notifications").insert([{
        user_email: user.email,
        title: "Welcome to GigHub!",
        message: userType === "provider"
          ? "Your provider account is ready. Start adding your services to get hired!"
          : "Your account is ready. Browse providers and find the services you need!",
        type: "system",
        link: userType === "provider" ? "DashboardServices" : "Discover"
      }]);

      localStorage.removeItem("selectedUserType");
      toast.success("Profile created successfully!");
      window.location.href = createPageUrl("Dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create profile");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6633] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to={createPageUrl("Home")} className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
              <span className="text-white font-bold text-xl">G</span>
            </div>
            <span className="text-xl font-bold text-white">GigHub</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">{userType === "provider" ? "Set up your provider profile" : "Tell us about yourself"}</p>

          {userType === "provider" && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? "bg-[#FF6633]" : "bg-[#2A2D3E]"}`} />
              <div className={`w-12 h-1 rounded ${step >= 2 ? "bg-[#FF6633]" : "bg-[#2A2D3E]"}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? "bg-[#FF6633]" : "bg-[#2A2D3E]"}`} />
            </div>
          )}
        </div>

        <div className="card-dark p-6 lg:p-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] p-1">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1D2E]">
                      {formData.avatar_url
                        ? <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><User className="w-10 h-10 text-gray-500" /></div>
                      }
                    </div>
                  </div>
                  <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF6633] flex items-center justify-center cursor-pointer hover:bg-[#E55A2B] transition-colors">
                    {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <p className="text-gray-500 text-sm mt-2">Add a profile photo</p>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="input-dark"
                />
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={formData.phone_number}
                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+256 700 000000"
                    className="input-dark pl-12"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Used for mobile money payments</p>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Kampala, Uganda"
                    className="input-dark pl-12"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">{userType === "provider" ? "About Your Services" : "About You"} (Optional)</Label>
                <Textarea
                  value={formData.bio}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={userType === "provider" ? "Describe your skills and experience..." : "Tell us about yourself..."}
                  className="input-dark min-h-[100px]"
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <Label className="text-gray-400 mb-4 block">Select your service categories *</Label>
                <p className="text-gray-600 text-sm mb-4">Choose the categories that best describe your services</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryToggle(cat.id)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                        selectedCategories.includes(cat.id)
                          ? "bg-[#FF6633] text-white"
                          : "bg-[#0F1117] text-gray-400 border border-[#2A2D3E] hover:border-[#FF6633]/50"
                      }`}
                    >
                      {selectedCategories.includes(cat.id) && <Check className="w-4 h-4" />}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleNext} disabled={saving} className="btn-primary w-full mt-8">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Profile...
              </>
            ) : (
              <>
                {step === 1 && userType === "provider" ? "Next" : "Complete Setup"} <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {step === 2 && (
            <button onClick={() => setStep(1)} className="w-full text-center text-gray-500 hover:text-white mt-4">
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}