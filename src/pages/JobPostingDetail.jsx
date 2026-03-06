import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from "@/lib/supabaseClient";
import { ChevronLeft, MapPin, Calendar, DollarSign, Briefcase, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function JobPostingDetail() {
  const [posting, setPosting] = useState(null);
  const [category, setCategory] = useState(null);
  const [applications, setApplications] = useState([]);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposalForm, setProposalForm] = useState({ proposal: '', bid_amount: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
      setLoading(false);
      return;
    }

    // Load job posting
    const { data: postings } = await supabase
      .from('JobPostings')
      .select('*')
      .eq('id', id)
      .limit(1);
    if (postings?.length > 0) {
      setPosting(postings[0]);
      
      // Load category
      if (postings[0].category_id) {
        const { data: cats } = await supabase
          .from('Categories')
          .select('*')
          .eq('id', postings[0].category_id)
          .limit(1);
        if (cats?.length > 0) setCategory(cats[0]);
      }

      // Load job applications
      const { data: apps } = await supabase
        .from('JobApplications')
        .select('*')
        .eq('job_posting_id', id);
      if (apps) setApplications(apps);
    }

    // Load current user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      const { data: profiles } = await supabase
        .from('Profiles')
        .select('*')
        .eq('email', authUser.email)
        .limit(1);
      if (profiles?.length > 0) setProfile(profiles[0]);
    }

    setLoading(false);
  };

  const handleApply = async () => {
    if (!proposalForm.proposal || !proposalForm.bid_amount) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    // Create job application
    const { error } = await supabase.from('JobApplications').insert({
      job_posting_id: posting.id,
      provider_id: profile.id,
      provider_email: user.email,
      provider_name: profile.full_name,
      proposal: proposalForm.proposal,
      bid_amount: parseFloat(proposalForm.bid_amount),
      status: 'pending',
      created_at: new Date().toISOString()
    });
    if (error) {
      toast.error('Failed to submit application');
      setSubmitting(false);
      return;
    }

    // Create notification
    await supabase.from('Notifications').insert({
      user_email: posting.client_email,
      title: 'New Application!',
      message: `${profile.full_name} applied to your job "${posting.title}"`,
      type: 'job',
      link: `JobPostingDetail?id=${posting.id}`,
      created_at: new Date().toISOString()
    });

    toast.success('Application submitted!');
    setApplyDialogOpen(false);
    setSubmitting(false);
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF6B3D] animate-spin" />
      </div>
    );
  }

  if (!posting) {
    return (
      <div className="min-h-screen py-8 flex items-center justify-center">
        <div className="card-dark p-12 text-center">
          <h3 className="text-lg font-medium text-white mb-2">Job not found</h3>
          <Link to={createPageUrl('JobPostings')}>
            <Button className="btn-primary mt-4">Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatBudget = (min, max) => {
    if (!min && !max) return 'Budget not specified';
    if (!max) return `From UGX ${min.toLocaleString()}`;
    return `UGX ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const hasApplied = applications.some(app => app.provider_email === user?.email);

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to={createPageUrl('JobPostings')} className="inline-flex items-center gap-2 text-[#FF6B3D] hover:text-[#FF5722] mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-dark p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center">
                  <Briefcase className="w-8 h-8" style={{ color: 'black' }} />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">{posting.title}</h1>
                  <p className="text-white">Posted by {posting.client_name}</p>
                </div>
              </div>

              {category && (
                <Badge className="bg-[#FF6B3D]/10 text-[#FF6B3D] border-[#FF6B3D]/30 mb-4">
                  {category.name}
                </Badge>
              )}

              <div className="prose prose-invert max-w-none">
                <p className="text-white">{posting.description}</p>
              </div>

              {posting.skills_required && posting.skills_required.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-2">
                    {posting.skills_required.map((skill, i) => (
                      <Badge key={i} variant="outline" className="bg-[#0A0E1A] border-[#1E2430] text-white">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {posting.client_email === user?.email && applications.length > 0 && (
              <div className="card-dark p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Applications ({applications.length})</h3>
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E2430]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{app.provider_name}</span>
                        <span className="text-[#FF6B3D] font-semibold">UGX {app.bid_amount.toLocaleString()}</span>
                      </div>
                      <p className="text-white text-sm">{app.proposal}</p>
                      <p className="text-gray-500 text-xs mt-2">
                        Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="card-dark p-6 sticky top-24">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#FF6B3D]" />
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-semibold text-white">{formatBudget(posting.budget_min, posting.budget_max)}</p>
                  </div>
                </div>

                {posting.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#FF6B3D]" />
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold text-white">{posting.location}</p>
                    </div>
                  </div>
                )}

                {posting.deadline && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#FF6B3D]" />
                    <div>
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="font-semibold text-white">{format(new Date(posting.deadline), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
              </div>

              {user && profile?.user_type === 'provider' && posting.client_email !== user.email && (
                <Button 
                  onClick={() => setApplyDialogOpen(true)} 
                  disabled={hasApplied}
                  className="btn-primary w-full"
                >
                  {hasApplied ? 'Already Applied' : 'Apply Now'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="bg-[#151922] border-[#1E2430]">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Your Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-white mb-2 block">Your Bid (UGX)</Label>
              <Input
                type="number"
                value={proposalForm.bid_amount}
                onChange={(e) => setProposalForm({ ...proposalForm, bid_amount: e.target.value })}
                placeholder="Enter your bid amount"
                className="input-dark"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Proposal</Label>
              <Textarea
                value={proposalForm.proposal}
                onChange={(e) => setProposalForm({ ...proposalForm, proposal: e.target.value })}
                placeholder="Explain why you're the best fit for this job..."
                className="input-dark min-h-[150px]"
              />
            </div>
            <Button onClick={handleApply} disabled={submitting} className="btn-primary w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}