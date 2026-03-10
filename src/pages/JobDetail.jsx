import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/lib/supabaseClient';
import { 
  ChevronLeft, 
  DollarSign, 
  User, 
  Calendar, 
  CheckCircle,
  Lock,
  Play,
  XCircle,
  Loader2,
  FileText,
  Star,
  MessageSquare,
  Upload
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  funded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  work_submitted: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  revision_requested: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusIcons = {
  pending: Lock,
  funded: DollarSign,
  in_progress: Play,
  work_submitted: FileText,
  revision_requested: MessageSquare,
  completed: CheckCircle,
  cancelled: XCircle,
};

const safeFormat = (date, pattern = 'MMM d, yyyy') => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return format(d, pattern);
};

export default function JobDetail() {
  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [workSubmitDialogOpen, setWorkSubmitDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [workFiles, setWorkFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.email) {
      setLoading(false);
      return;
    }

    setUser(session.session.user);

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
      setLoading(false);
      return;
    }

    // Load wallet  providerWallet
    const { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', session.session.user.id)
    if (wallets?.length) setWallet(wallets[0]);

    // Load job
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();
    if (!jobs) {
      setJob(null);
      setLoading(false);
      return;
    }
    setJob(jobs);

    // Load transactions
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('job_id', id);
    setTransactions(allTransactions || []);

    // Load orders
    const { data: allOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('job_id', id);
    setOrders(allOrders || []);

    // Load existing review
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('job_id', id);
    if (reviews?.length) {
      setExistingReview(reviews[0]);
      setReviewForm({ rating: reviews[0].rating, comment: reviews[0].comment || '' });
    }

    setLoading(false);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const isClient = job?.client_email === user?.email;
  const isProvider = job?.provider_email === user?.email;

  const handleFundJob = async () => {
    if (!wallet || wallet.available_balance < job.agreed_amount) {
      toast.error('Insufficient wallet balance');
      return;
    }

    setProcessing(true);

    // Lock funds in wallet
    await supabase
      .from('wallets')
      .update({
        available_balance: wallet.available_balance - job.agreed_amount,
        locked_balance: (wallet.locked_balance || 0) + job.agreed_amount
      })
      .eq('id', wallet.id);

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'funded' })
      .eq('id', job.id);

    // Create transaction
    await supabase
      .from('transactions')
      .insert({
        job_id: job.id,
        from_wallet_id: wallet.id,
        from_email: user.email,
        amount: job.agreed_amount,
        type: 'escrow_lock',
        description: `Escrow for: ${job.title}`,
        status: 'completed'
      });

    toast.success('Job funded successfully!');
    setConfirmDialog({ open: false, action: null });
    setProcessing(false);
    loadData();
  };

  const handleStartJob = async () => {
    setProcessing(true);
    await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', job.id);
    toast.success('Job started!');
    setConfirmDialog({ open: false, action: null });
    setProcessing(false);
    loadData();
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingFile(true);
    const uploadedUrls = [];

    for (const file of files) {
      const { data, error } = await supabase.storage
        .from('job-files')
        .upload(`work/${Date.now()}_${file.name}`, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
      } else {
        uploadedUrls.push(supabase.storage.from('job-files').getPublicUrl(data.path).publicUrl);
      }
    }

    setWorkFiles([...workFiles, ...uploadedUrls]);
    setUploadingFile(false);
  };

  const handleSubmitWork = async () => {
    if (!workFiles.length) {
      toast.error('Please upload at least one file');
      return;
    }

    setProcessing(true);
    await supabase.from('jobs').update({ status: 'work_submitted', work_files: workFiles }).eq('id', job.id);

    await supabase.from('notifications').insert({
      user_email: job.client_email,
      title: 'Work Submitted!',
      message: `Work has been submitted for: ${job.title}`,
      type: 'job',
      link: `JobDetail?id=${job.id}`
    });

    toast.success('Work submitted for review!');
    setWorkSubmitDialogOpen(false);
    setProcessing(false);
    loadData();
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error('Please provide revision feedback');
      return;
    }

    setProcessing(true);
    await supabase.from('jobs').update({ status: 'revision_requested', revision_notes: revisionNotes }).eq('id', job.id);

    await supabase.from('notifications').insert({
      user_email: job.provider_email,
      title: 'Revision Requested',
      message: `The client has requested revisions for: ${job.title}`,
      type: 'job',
      link: `JobDetail?id=${job.id}`
    });

    toast.success('Revision requested!');
    setRevisionDialogOpen(false);
    setRevisionNotes('');
    setProcessing(false);
    loadData();
  };

  const handleCompleteJob = async () => {
    setProcessing(true);

    await supabase.from('jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);

    // Update provider wallet
    const { data: providerWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', job.provider_id)
      .single();
    if (providerWallet) {

      await supabase.from('wallets').update({
        balance: (providerWallet.balance || 0) + job.agreed_amount,
        available_balance: (providerWallet.available_balance || 0) + job.agreed_amount
      }).eq('id', providerWallet.id);

      // Update client wallet (reduce locked balance)
      await supabase.from('wallets').update({
      locked_balance: (wallet.locked_balance || 0) - job.agreed_amount
    }).eq('id', wallet.id);

      // Create release transaction  transactions
      await supabase.from('transactions').insert({
        job_id: job.id,
        from_wallet_id: wallet.id,
        from_email: user.email,
        to_wallet_id: providerWallet.id,
        to_email: job.provider_email,
        amount: job.agreed_amount,
        type: 'release',
        description: `Payment for: ${job.title}`,
        status: 'completed'
      });
    }

    toast.success('Job completed! Payment released to provider.');
    setConfirmDialog({ open: false, action: null });
    setProcessing(false);
    setReviewDialogOpen(true);
    loadData();
  };

  const handleSubmitReview = async () => {
    setProcessing(true);

    // Fetch client profile
    const { data: clientProfiles } = await supabase.from('profiles').select('*').eq('user_email', user.email);
    const clientProfile = clientProfiles?.[0];

    if (existingReview) {
      await supabase.from('reviews').update({
        rating: reviewForm.rating,
        comment: reviewForm.comment
      }).eq('id', existingReview.id);
    } else {
      await supabase.from('reviews').insert({
        job_id: job.id,
        provider_email: job.provider_email,
        client_email: user.email,
        client_name: clientProfile?.full_name || 'Anonymous',
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });

      // Notify provider
      await supabase.from('notifications').insert({
        user_email: job.provider_email,
        title: 'New Review!',
        message: `${clientProfile?.full_name || 'A client'} left you a ${reviewForm.rating}-star review`,
        type: 'review',
        link: `ProviderProfile?id=${job.provider_id}`
      });
    }

    toast.success('Review submitted!');
    setReviewDialogOpen(false);
    setProcessing(false);
    loadData();
  };

  if (loading) return <div className="p-6 lg:p-8">Loading...</div>;
  if (!job) return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="card-dark p-12 text-center max-w-md">
        <h3 className="text-lg font-medium text-white mb-2">Job not found</h3>
        <p className="text-gray-500 mb-4">The job you're looking for doesn't exist.</p>
        <Link to={createPageUrl('DashboardJobs')}>
          <Button className="btn-primary">View All Jobs</Button>
        </Link>
      </div>
    </div>
  );

  const StatusIcon = statusIcons[job.status] || Lock;

  return (
    <div className="p-6 lg:p-8">
      {/* Main Job content here remains mostly unchanged */}
      {/* ...the rest of the JSX can remain as is, only logic for Base44 replaced with Supabase */}
      <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link 
          to={createPageUrl('DashboardJobs')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Jobs
        </Link>

        {/* Main Job Card */}
        <div className="card-dark p-6 lg:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${statusColors[job.status]?.split(' ')[0]} flex items-center justify-center`}>
                  <StatusIcon className={`w-6 h-6 ${statusColors[job.status]?.split(' ')[1]}`} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{job.title}</h1>
                  <Badge className={`${statusColors[job.status]} border capitalize mt-1`}>
                    {job.status?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              {job.description && (
                <p className="text-gray-400 mb-6">{job.description}</p>
              )}
              
              {job.work_files && job.work_files.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-[#0A0E1A] border border-[#1E2430]">
                  <h3 className="text-white font-medium mb-3">Submitted Work</h3>
                  <div className="space-y-2">
                    {job.work_files.map((url, i) => (
                      <a 
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#FF6B3D] hover:text-[#FF5722] transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Work File {i + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              
              {job.revision_notes && (
                <div className="mb-6 p-4 rounded-xl bg-[#FF6B3D]/10 border border-[#FF6B3D]/30">
                  <h3 className="text-[#FF6B3D] font-medium mb-2">Revision Feedback</h3>
                  <p className="text-white">{job.revision_notes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 text-gray-400">
                  <DollarSign className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">Agreed Amount</p>
                    <p className="font-semibold text-white">{formatAmount(job.agreed_amount)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <User className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">{isClient ? 'Provider' : 'Client'}</p>
                    <p className="text-white">{isClient ? job.provider_email : job.client_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-white">
                    {job.created_at
                      ? format(new Date(job.created_at), 'MMM d, yyyy')
                      : '—'}
                  </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons  tx.created_date */}
          <div className="pt-6 border-t border-[#2A2D3E] flex flex-wrap gap-3">
            {isClient && job.status === 'pending' && (
              <Button 
                onClick={() => setConfirmDialog({ open: true, action: 'fund' })}
                className="btn-primary"
              >
                <Lock className="w-4 h-4 mr-2" />
                Fund Job ({formatAmount(job.agreed_amount)})
              </Button>
            )}
            
            {isProvider && job.status === 'funded' && (
              <Button 
                onClick={() => setConfirmDialog({ open: true, action: 'start' })}
                className="btn-primary"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Working
              </Button>
            )}
            
            {isProvider && (job.status === 'in_progress' || job.status === 'revision_requested') && (
              <Button 
                onClick={() => {
                  setWorkFiles(job.work_files || []);
                  setWorkSubmitDialogOpen(true);
                }}
                className="btn-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                {job.status === 'revision_requested' ? 'Resubmit Work' : 'Submit Work'}
              </Button>
            )}
            
            {isClient && job.status === 'work_submitted' && (
              <>
                <Button 
                  onClick={() => setRevisionDialogOpen(true)}
                  variant="outline"
                  className="border-[#FF6B3D] text-[#FF6B3D] hover:bg-[#FF6B3D]/10"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Revision
                </Button>
                <Button 
                  onClick={() => setConfirmDialog({ open: true, action: 'complete' })}
                  className="btn-secondary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Complete
                </Button>
              </>
            )}

            {job.status === 'completed' && (
              <>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Completed on {job.completed_at
              ? format(new Date(job.completed_at), 'MMM d, yyyy')
              : '—'}</span>
                </div>
                {isClient && (
                  <Button 
                    onClick={() => setReviewDialogOpen(true)}
                    variant="outline"
                    className="border-[#2A2D3E] text-white hover:bg-[#1A1D2E]"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {existingReview ? 'Edit Review' : 'Leave Review'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs for Transactions & Orders */}
        <div className="card-dark p-6">
          <Tabs defaultValue="transactions">
            <TabsList className="bg-[#0F1117] border border-[#2A2D3E] mb-6">
              <TabsTrigger value="transactions" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
                Transactions ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-[#FF6633] data-[state=active]:text-white">
                Orders ({orders.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions">
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium capitalize">{tx.type?.replace('_', ' ')}</p>
                          <p className="text-gray-500 text-sm">{tx.description}</p>
                          <p className="text-gray-600 text-xs">
                            {tx.created_at
                              ? format(new Date(tx.created_at), 'MMM d, yyyy · h:mm a')
                              : ''}
                          </p>
                        </div>
                        <p className="text-lg font-semibold text-white">{formatAmount(tx.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="orders">
              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{order.description}</p>
                          <p className="text-gray-500 text-sm">
                            From: {order.requester_email} → To: {order.supplier_email}
                          </p>
                          <Badge className={`mt-2 ${
                            order.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          } border-0`}>
                            {order.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-lg font-semibold text-white">{formatAmount(order.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No internal orders</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Review Dialog   job.completed_at*/}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">
              {existingReview ? 'Edit Your Review' : 'Rate Your Experience'}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              How was your experience with this service provider?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 mb-3 block">Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="p-1"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        star <= reviewForm.rating 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-600 hover:text-yellow-400'
                      }`} 
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-400 mb-2 block">Comment (Optional)</Label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Share your experience..."
                className="input-dark min-h-[100px]"
              />
            </div>
            <Button 
              onClick={handleSubmitReview}
              disabled={processing}
              className="btn-primary w-full"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Star className="w-4 h-4 mr-2" />
              )}
              {existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog  created_date */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {confirmDialog.action === 'fund' && 'Fund this job?'}
              {confirmDialog.action === 'start' && 'Start working on this job?'}
              {confirmDialog.action === 'complete' && 'Mark job as complete?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              {confirmDialog.action === 'fund' && `This will lock ${formatAmount(job?.agreed_amount)} from your wallet in escrow until the job is completed.`}
              {confirmDialog.action === 'start' && 'This will notify the client that you have started working on this job.'}
              {confirmDialog.action === 'complete' && `This will release ${formatAmount(job?.agreed_amount)} from escrow to the provider.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#2A2D3E] text-white hover:bg-[#2A2D3E]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (confirmDialog.action === 'fund') handleFundJob();
                if (confirmDialog.action === 'start') handleStartJob();
                if (confirmDialog.action === 'complete') handleCompleteJob();
              }}
              disabled={processing}
              className="btn-primary"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Work Submit Dialog  created_date */}
      <Dialog open={workSubmitDialogOpen} onOpenChange={setWorkSubmitDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">Submit Your Work</DialogTitle>
            <DialogDescription className="text-gray-500">
              Upload files showing completed work
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="work-files"
              />
              <label htmlFor="work-files">
                <Button 
                  type="button" 
                  disabled={uploadingFile} 
                  className="btn-primary w-full"
                  onClick={() => document.getElementById('work-files').click()}
                >
                  {uploadingFile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Files
                    </>
                  )}
                </Button>
              </label>
            </div>
            
            {workFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400">{workFiles.length} file(s) uploaded</p>
                {workFiles.map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-[#0A0E1A]">
                    <span className="text-white text-sm">File {i + 1}</span>
                    <button
                      onClick={() => setWorkFiles(workFiles.filter((_, idx) => idx !== i))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <Button 
              onClick={handleSubmitWork}
              disabled={processing || workFiles.length === 0}
              className="btn-primary w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Work'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revision Request Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
          <DialogHeader>
            <DialogTitle className="text-white">Request Revision</DialogTitle>
            <DialogDescription className="text-gray-500">
              Provide feedback on what needs to be changed
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Explain what needs to be revised..."
              className="input-dark min-h-[150px]"
            />
            <Button 
              onClick={handleRequestRevision}
              disabled={processing || !revisionNotes.trim()}
              className="btn-primary w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Revision Request
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}