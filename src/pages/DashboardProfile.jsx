import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User, MapPin, Camera, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function DashboardProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    location: "",
    bio: "",
    user_type: "client",
    avatar_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);

      setUser(user);

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || "",
          phone_number: profileData.phone_number || "",
          location: profileData.location || "",
          bio: profileData.bio || "",
          user_type: profileData.user_type || "client",
          avatar_url: profileData.avatar_url || "",
        });

        // Load provider categories
        if (profileData.user_type === "provider") {
          const { data: relations } = await supabase
            .from("provider_categories")
            .select("category_id")
            .eq("provider_id", profileData.id);
          setSelectedCategories(relations?.map(r => r.category_id) || []);
        }
      }

      // Load all categories
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      setCategories(cats || []);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage.from("profiles").upload(fileName, file);
    if (error) {
      toast.error("Image upload failed");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("profiles").getPublicUrl(fileName);
    setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
    toast.success("Image uploaded");
    setUploading(false);
  };

  const handleCategoryToggle = (id) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.full_name) return toast.error("Please enter your name");

    setSaving(true);
    try {
      let profileId = profile?.id;

      if (!profile) {
        // Create profile
        const { data: newProfile, error } = await supabase
          .from("profiles")
          .insert({ ...formData, user_id: user.id, user_email: user.email })
          .select()
          .single();
        if (error) throw error;
        profileId = newProfile.id;
        setProfile(newProfile);

        // Create wallet
        await supabase.from("wallets").upsert({ user_id: user.id, balance: 0 }, { onConflict: "user_id" });

      } else {
        // Update profile
        await supabase.from("profiles").update(formData).eq("user_id", user.id);
      }

      // Update provider categories
      if (formData.user_type === "provider") {
        await supabase.from("provider_categories").delete().eq("provider_id", profileId);
        if (selectedCategories.length > 0) {
          const inserts = selectedCategories.map(catId => ({ provider_id: profileId, category_id: catId }));
          await supabase.from("provider_categories").insert(inserts);
        }
      }

      toast.success("Profile saved successfully");
      await loadProfile(); // reload profile after save

    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-white">Loading profile...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl lg:text-3xl font-bold text-white mb-8">Edit Profile</h1>

      <div className="card-dark p-6 lg:p-8">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#1A1D2E]">
            {formData.avatar_url ? (
              <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <User className="w-12 h-12 text-gray-500" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#FF6633] flex items-center justify-center cursor-pointer">
              {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <Label className="text-gray-400">Full Name</Label>
            <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="input-dark" />
          </div>

          <div>
            <Label className="text-gray-400">Account Type</Label>
            <Select value={formData.user_type} onValueChange={v => setFormData({ ...formData, user_type: v })}>
              <SelectTrigger className="input-dark"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-400">Phone</Label>
            <Input value={formData.phone_number} onChange={e => setFormData({ ...formData, phone_number: e.target.value })} className="input-dark" />
          </div>

          <div>
            <Label className="text-gray-400">Location</Label>
            <Input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="input-dark" />
          </div>

          <div>
            <Label className="text-gray-400">Bio</Label>
            <Textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} className="input-dark" />
          </div>

          {/* Provider Categories */}
          {formData.user_type === "provider" && (
            <div>
              <Label className="text-gray-400 mb-2 block">Service Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-4 py-2 rounded-xl text-sm ${
                      selectedCategories.includes(cat.id)
                        ? "bg-[#FF6633] text-white"
                        : "bg-[#0F1117] text-gray-400 border border-[#2A2D3E]"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="btn-primary w-full">
            {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />} Save Profile
          </Button>
        </div>
      </div>
    </div>
  );
}