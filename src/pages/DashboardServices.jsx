
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Plus, Briefcase, Edit2, Trash2, Eye, EyeOff, Loader2, Upload, X, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function DashboardServices() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    price: "",
    price_type: "fixed",
    delivery_days: "",
    deliverables: [],
    image_url: "",
  });
  const [newDeliverable, setNewDeliverable] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user: userData } } = await supabase.auth.getUser();
    if (!userData) return;
    setUser(userData);

    // Load profile   .eq("provider_id", profiles[0].id);
    const { data: profileData } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", userData.id)
  .maybeSingle();

if (profileData) {
  setProfile(profileData);

      // Load services
      const { data: svcs } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", profileData.id);
      setServices(svcs || []);
    }

    // Load categories
    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
    setCategories(cats || []);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage
      .from("service-images")
      .upload(fileName, file);

    if (error) {
      toast.error("Image upload failed");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("service-images")
      .getPublicUrl(fileName);

    setFormData(prev => ({ ...prev, image_url: publicUrlData.publicUrl }));
    setUploading(false);
    toast.success("Image uploaded");
  };

  const openDialog = (service = null) => {
    if (service) {
      setSelectedService(service);
      setFormData({
        title: service.title,
        description: service.description || "",
        category_id: service.category_id,
        price: service.price?.toString() || "",
        price_type: service.price_type || "fixed",
        delivery_days: service.delivery_days?.toString() || "",
        deliverables: service.deliverables || [],
        image_url: service.image_url || "",
      });
    } else {
      setSelectedService(null);
      setFormData({
        title: "",
        description: "",
        category_id: "",
        price: "",
        price_type: "fixed",
        delivery_days: "",
        deliverables: [],
        image_url: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.category_id || !formData.price || !formData.delivery_days) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);

    const data = {
      ...formData,
      price: parseFloat(formData.price),
      delivery_days: parseInt(formData.delivery_days),
      provider_id: profile.id,
      provider_email: user.email,
      is_active: true,
    };

    if (selectedService) {
      await supabase.from("services").update(data).eq("id", selectedService.id);
      toast.success("Service package updated");
    } else {
      await supabase.from("services").insert(data);
      toast.success("Service package created");
    }

    setDialogOpen(false);
    setSaving(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!selectedService) return;
    await supabase.from("services").delete().eq("id", selectedService.id);
    toast.success("Service deleted");
    setDeleteDialogOpen(false);
    setSelectedService(null);
    loadData();
  };

  const toggleActive = async (service) => {
    await supabase.from("services").update({ is_active: !service.is_active }).eq("id", service.id);
    toast.success(service.is_active ? "Service hidden" : "Service visible");
    loadData();
  };

  const formatAmount = (amount) => {
    if (!amount) return "Negotiable";
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(amount);
  };

  const getCategory = (id) => categories.find(c => c.id === id);

  const filteredServices = services.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="h-8 bg-[#2A2D3E] rounded w-48" />
            <div className="h-10 bg-[#2A2D3E] rounded w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-[#2A2D3E] rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!profile || profile.user_type !== "provider") {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="card-dark p-12 text-center max-w-md">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Services are for Providers</h3>
          <p className="text-gray-500">Switch to a provider account to list your services.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header  userData.email */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Service Packages</h1>
          <p className="text-gray-500">Create and manage service packages with fixed pricing</p>
        </div>
        <Button onClick={() => openDialog()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search services..."
          className="input-dark pl-12 max-w-md"
        />
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map(service => {
            const category = getCategory(service.category_id);
            return (
              <div key={service.id} className={`card-dark overflow-hidden ${!service.is_active ? "opacity-60" : ""}`}>
                <div className="aspect-video relative bg-[#0F1117]">
                  {service.image_url ? (
                    <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Briefcase className="w-10 h-10 text-gray-600" />
                    </div>
                  )}
                  {!service.is_active && (
                    <Badge className="absolute top-3 right-3 bg-gray-800 text-gray-400">Hidden</Badge>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-semibold line-clamp-1">{service.title}</h3>
                    <p className="text-[#FF6633] font-semibold text-sm whitespace-nowrap">{formatAmount(service.price)}</p>
                  </div>
                  {category && <Badge className="bg-[#FF6633]/10 text-[#FF6633] border-0 mb-3">{category.name}</Badge>}
                  <div className="flex gap-2 pt-3 border-t border-[#2A2D3E]">
                    <Button size="sm" variant="ghost" onClick={() => openDialog(service)} className="flex-1 text-gray-400 hover:text-white">
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(service)} className="flex-1 text-gray-400 hover:text-white">
                      {service.is_active ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {service.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedService(service); setDeleteDialogOpen(true); }} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-dark p-12 text-center">
          <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No services yet</h3>
          <p className="text-gray-500 mb-4">Add your first service to start getting hired</p>
          <Button onClick={() => openDialog()} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      )}

      {/* Dialogs */}
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedService ? "Edit Service Package" : "Create Service Package"}</DialogTitle>
            <DialogDescription className="text-gray-500">Define your service package with clear deliverables</DialogDescription>
          </DialogHeader>
          {/* Form UI remains unchanged */}
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Service Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Professional Plumbing Services" className="input-dark" />
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Package Description *</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What's included in this package..." className="input-dark min-h-[80px]" />
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Category *</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger className="input-dark"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400 mb-2 block">Package Price (UGX) *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="e.g., 500000" className="input-dark" />
              </div>
              <div>
                <Label className="text-gray-400 mb-2 block">Delivery Time (Days) *</Label>
                <Input type="number" value={formData.delivery_days} onChange={(e) => setFormData({ ...formData, delivery_days: e.target.value })} placeholder="e.g., 3" className="input-dark" />
              </div>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">What's Included</Label>
              <div className="flex gap-2 mb-2">
                <Input 
                  value={newDeliverable} 
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newDeliverable.trim()) {
                        setFormData({ ...formData, deliverables: [...formData.deliverables, newDeliverable.trim()] });
                        setNewDeliverable('');
                      }
                    }
                  }}
                  placeholder="Add deliverable (press Enter)" 
                  className="input-dark flex-1" 
                />
                <Button 
                  type="button"
                  onClick={() => {
                    if (newDeliverable.trim()) {
                      setFormData({ ...formData, deliverables: [...formData.deliverables, newDeliverable.trim()] });
                      setNewDeliverable('');
                    }
                  }}
                  variant="outline"
                  className="border-[#2A2D3E] text-white hover:bg-[#2A2D3E]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.deliverables.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.deliverables.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0A0E1A] border border-[#1E2430]">
                      <span className="text-white text-sm flex-1">{item}</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliverables: formData.deliverables.filter((_, idx) => idx !== i) })}
                        className="text-red-400 hover:text-red-300 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Service Image</Label>
              {formData.image_url ? (
                <div className="relative">
                  <img src={formData.image_url} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                  <button onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="w-full h-32 border-2 border-dashed border-[#2A2D3E] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6633]/50 transition-colors">
                    {uploading ? <Loader2 className="w-8 h-8 text-[#FF6633] animate-spin" /> : <><Upload className="w-8 h-8 text-gray-500 mb-2" /><p className="text-gray-500 text-sm">Click to upload</p></>}
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : selectedService ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Service?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2A2D3E] text-white hover:bg-[#2A2D3E]">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
