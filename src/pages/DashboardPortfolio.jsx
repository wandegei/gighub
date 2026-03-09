import { useState, useEffect } from "react";
import {
  Plus,
  Image as ImageIcon,
  Play,
  FileText,
  Trash2,
  Edit2,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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

export default function DashboardPortfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    media_type: "image",
    media_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: profileData } = await supabase
  .from("profiles")
  .select("*")
  .eq("user_id", user.id)
  .maybeSingle();

if (profileData) {
  setProfile(profileData);

  const { data: items } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("provider_id", profileData.id);

  setPortfolio(items || []);
}

    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage
      .from("portfolio")
      .upload(fileName, file);

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("portfolio")
      .getPublicUrl(fileName);

    setFormData((prev) => ({ ...prev, media_url: publicUrlData.publicUrl }));
    setUploading(false);
    toast.success("File uploaded");
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        title: item.title,
        description: item.description || "",
        media_type: item.media_type,
        media_url: item.media_url,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        title: "",
        description: "",
        media_type: "image",
        media_url: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.media_url) {
      toast.error("Please fill in title and upload a file");
      return;
    }

    setSaving(true);

    if (selectedItem) {
      await supabase
        .from("portfolio_items")
        .update({ ...formData, provider_id: profile.id })
        .eq("id", selectedItem.id);
      toast.success("Portfolio item updated");
    } else {
      await supabase.from("portfolio_items").insert({
        ...formData,
        provider_id: profile.id,
      });
      toast.success("Portfolio item added");
    }

    setDialogOpen(false);
    setSaving(false);
    loadData();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    await supabase.from("portfolio_items").delete().eq("id", selectedItem.id);
    toast.success("Portfolio item deleted");
    setDeleteDialogOpen(false);
    setSelectedItem(null);
    loadData();
  };

  const mediaTypeIcons = {
    image: ImageIcon,
    video: Play,
    document: FileText,
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="flex justify-between">
            <div className="h-8 bg-[#2A2D3E] rounded w-48" />
            <div className="h-10 bg-[#2A2D3E] rounded w-32" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-[#2A2D3E] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile || profile.user_type !== "provider") {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="card-dark p-12 text-center max-w-md">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Portfolio is for Providers</h3>
          <p className="text-gray-500">Switch to a provider account to showcase your work.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">My Portfolio</h1>
          <p className="text-gray-500">Showcase your best work to attract clients</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Portfolio Grid */}
      {portfolio.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.map((item) => {
            const Icon = mediaTypeIcons[item.media_type] || ImageIcon;
            return (
              <div
                key={item.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-[#1A1D2E] border border-[#2A2D3E]"
              >
                {item.media_type === "image" ? (
                  <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-16 h-16 text-gray-500" />
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenDialog(item)}
                      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setDeleteDialogOpen(true);
                      }}
                      className="w-9 h-9 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{item.title}</h4>
                    {item.description && (
                      <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-dark p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No portfolio items yet</h3>
          <p className="text-gray-500 mb-4">Upload images, videos, or documents to showcase your work</p>
          <Button onClick={() => handleOpenDialog()} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Item
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedItem ? "Edit Portfolio Item" : "Add Portfolio Item"}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Upload your work to showcase to potential clients
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Modern Kitchen Renovation"
                className="input-dark"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this work..."
                className="input-dark min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Media Type</Label>
              <Select value={formData.media_type} onValueChange={(value) => setFormData({ ...formData, media_type: value })}>
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-400 mb-2 block">Upload File</Label>
              {formData.media_url ? (
                <div className="relative">
                  {formData.media_type === "image" ? (
                    <img src={formData.media_url} alt="Preview" className="w-full h-40 object-cover rounded-xl" />
                  ) : (
                    <div className="w-full h-40 bg-[#0F1117] rounded-xl flex items-center justify-center border border-[#2A2D3E]">
                      <div className="text-center">
                        {formData.media_type === "video" ? (
                          <Play className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        ) : (
                          <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        )}
                        <p className="text-gray-500 text-sm">File uploaded</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => setFormData({ ...formData, media_url: "" })}
                    className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="w-full h-40 border-2 border-dashed border-[#2A2D3E] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6633]/50 transition-colors">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-[#FF6633] animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-gray-500 text-sm">Click to upload</p>
                      </>
                    )}
                  </div>
                  <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                </label>
              )}
            </div>

            <Button onClick={handleSave} disabled={saving} className="btn-primary w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : selectedItem ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog   user.email*/}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Portfolio Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              This action cannot be undone. This will permanently delete this portfolio item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2A2D3E] text-white hover:bg-[#2A2D3E]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}