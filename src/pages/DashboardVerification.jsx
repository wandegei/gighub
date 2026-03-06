import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Shield, Upload, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function DashboardVerification() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [formData, setFormData] = useState({
    verification_type: "",
    notes: "",
    document_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Get current user
    const { data: { user: userData } } = await supabase.auth.getUser();
    if (!userData) return;
    setUser(userData);

    // Load profile
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_email", userData.email)
      .limit(1);
    if (profiles?.length > 0) {
      setProfile(profiles[0]);

      // Load verifications
      const { data: verifs } = await supabase
        .from("verifications")
        .select("*")
        .eq("provider_id", profiles[0].id)
        .order("created_date", { ascending: false });
      setVerifications(verifs || []);
    }

    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("verification-documents")
        .upload(fileName, file);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, document_url: publicUrlData.publicUrl }));
      toast.success("Document uploaded");
    } catch (err) {
      toast.error("Upload failed");
    }
    setUploadingFile(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.verification_type) {
      toast.error("Please select verification type");
      return;
    }

    setSubmitting(true);
    await supabase.from("verifications").insert({
      provider_id: profile.id,
      provider_email: user.email,
      verification_type: formData.verification_type,
      status: "pending",
      document_url: formData.document_url,
      notes: formData.notes,
      created_date: new Date().toISOString(),
    });

    toast.success("Verification request submitted!");
    setFormData({ verification_type: "", notes: "", document_url: "" });
    setSubmitting(false);
    loadData();
  };

  const statusConfig = {
    pending: { icon: Clock, color: "bg-yellow-500", text: "Pending Review" },
    verified: { icon: CheckCircle2, color: "bg-green-500", text: "Verified" },
    rejected: { icon: XCircle, color: "bg-red-500", text: "Rejected" },
  };

  const verificationTypes = {
    identity: { name: "Identity Verification", desc: "Verify your identity with government-issued ID" },
    skills: { name: "Skills Verification", desc: "Verify your skills with certificates or portfolio" },
    business: { name: "Business Verification", desc: "Verify your business registration" },
    background: { name: "Background Check", desc: "Complete background verification" },
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#1E2430] rounded w-48 mb-6" />
          <div className="h-96 bg-[#1E2430] rounded-xl" />
        </div>
      </div>
    );
  }

  if (profile?.user_type !== "provider") {
    return (
      <div className="p-6 lg:p-8">
        <div className="card-dark p-12 text-center">
          <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Verification is for providers only</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Trust & Verification</h1>
        <p className="text-[#FF6B3D]">Build trust with verified credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Verification */}
        <div className="card-dark p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#FF6B3D]" />
            Request Verification
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-white mb-2 block">Verification Type</Label>
              <Select value={formData.verification_type} onValueChange={(v) => setFormData({ ...formData, verification_type: v })}>
                <SelectTrigger className="input-dark">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#151922] border-[#1E2430]">
                  {Object.entries(verificationTypes).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="text-white">{value.name}</div>
                        <div className="text-xs text-gray-500">{value.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Upload Document</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="doc-upload"
                  accept="image/*,.pdf"
                />
                <label htmlFor="doc-upload">
                  <Button type="button" disabled={uploadingFile} className="btn-primary" onClick={() => document.getElementById('doc-upload').click()}>
                    {uploadingFile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </label>
                {formData.document_url && (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Additional Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                className="input-dark min-h-[100px]"
              />
            </div>

            <Button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Your Verifications */}
        <div className="card-dark p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Your Verifications</h2>
          {verifications.length > 0 ? (
            <div className="space-y-4">
              {verifications.map((verif) => {
                const config = statusConfig[verif.status];
                const StatusIcon = config.icon;

                return (
                  <div key={verif.id} className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E2430]">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white">
                          {verificationTypes[verif.verification_type]?.name || verif.verification_type}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted {new Date(verif.created_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={`${config.color} text-white`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {config.text}
                      </Badge>
                    </div>
                    {verif.notes && <p className="text-sm text-white mt-2">{verif.notes}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No verifications yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Why Get Verified */}
      <div className="card-dark p-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Why Get Verified?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {["Build Trust", "Stand Out", "Higher Rates", "Security"].map((title, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-white">{title}</h4>
                <p className="text-sm text-gray-500">
                  {title === "Build Trust" && "Clients are more likely to hire verified providers"}
                  {title === "Stand Out" && "Get priority in search results"}
                  {title === "Higher Rates" && "Command better prices for your services"}
                  {title === "Security" && "Protected platform with verified users"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}