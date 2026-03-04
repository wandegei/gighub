import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Briefcase, Loader2 } from 'lucide-react';
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

export default function PostJob() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    budget_min: '',
    budget_max: '',
    location: '',
    deadline: '',
    skills_required: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    
    const profiles = await base44.entities.Profile.filter({ user_email: userData.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      if (profiles[0].user_type !== 'client') {
        toast.error('Only clients can post jobs');
        window.location.href = createPageUrl('JobPostings');
        return;
      }
    }
    
    const cats = await base44.entities.Category.list('name');
    setCategories(cats);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }
    
    setSubmitting(true);
    
    const posting = await base44.entities.JobPosting.create({
      client_id: profile.id,
      client_email: user.email,
      client_name: profile.full_name,
      title: formData.title,
      description: formData.description,
      category_id: formData.category_id || null,
      budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
      budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
      location: formData.location,
      deadline: formData.deadline || null,
      status: 'open',
      skills_required: formData.skills_required ? formData.skills_required.split(',').map(s => s.trim()) : []
    });
    
    toast.success('Job posted successfully!');
    window.location.href = createPageUrl(`JobPostingDetail?id=${posting.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B3D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Post a Job</h1>
          <p className="text-[#FF6B3D]">Describe your project and get proposals from providers</p>
        </div>

        <form onSubmit={handleSubmit} className="card-dark p-6 lg:p-8 space-y-6">
          <div>
            <Label className="text-white mb-2 block">Job Title *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Need a plumber for bathroom renovation"
              className="input-dark"
              required
            />
          </div>

          <div>
            <Label className="text-white mb-2 block">Description *</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the work you need done..."
              className="input-dark min-h-[150px]"
              required
            />
          </div>

          <div>
            <Label className="text-white mb-2 block">Category</Label>
            <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
              <SelectTrigger className="input-dark">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-[#151922] border-[#1E2430]">
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Budget Min (UGX)</Label>
              <Input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                placeholder="Minimum budget"
                className="input-dark"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Budget Max (UGX)</Label>
              <Input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                placeholder="Maximum budget"
                className="input-dark"
              />
            </div>
          </div>

          <div>
            <Label className="text-white mb-2 block">Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Kampala, Uganda"
              className="input-dark"
            />
          </div>

          <div>
            <Label className="text-white mb-2 block">Deadline</Label>
            <Input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input-dark"
            />
          </div>

          <div>
            <Label className="text-white mb-2 block">Skills Required</Label>
            <Input
              value={formData.skills_required}
              onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
              placeholder="e.g., Plumbing, Welding (comma separated)"
              className="input-dark"
            />
          </div>

          <Button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Briefcase className="w-4 h-4 mr-2" />
                Post Job
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}