import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/lib/supabaseClient';
import { 
  ChevronLeft, MapPin, Star, Phone, Calendar, Briefcase, 
  MessageSquare, Loader2, Check, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ServiceDetail() {
  const [service, setService] = useState(null);
  const [provider, setProvider] = useState(null);
  const [category, setCategory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [otherServices, setOtherServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdJobId, setCreatedJobId] = useState(null);
  
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    agreed_amount: '',
    payment_method: 'mtn'
  });
  const [paymentForm, setPaymentForm] = useState({
    phone: '',
    method: 'mtn'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) return setLoading(false);

    // Load service
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    if (!services) return setLoading(false);
    setService(services);
    setJobForm(prev => ({ ...prev, title: services.title, agreed_amount: services.price?.toString() || '' }));

    // Load provider
    const { data: providerData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', services.provider_id)
      .single();
    if (providerData) {
      setProvider(providerData);

      // Other services
      const { data: providerServices } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', services.provider_id)
        .eq('is_active', true);
      setOtherServices(providerServices?.filter(s => s.id !== services.id).slice(0, 4) || []);

      // Portfolio items
      const { data: portfolioItems } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', services.provider_id);
      setPortfolio(portfolioItems?.slice(0, 6) || []);
    }

    // Category
    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('id', services.category_id)
      .single();
    if (categories) setCategory(categories);

    // Reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', services.provider_id);
    setReviews(reviewsData || []);

    // Auth user
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      setUser(authUser);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_email', authUser.email);
      if (profiles?.length > 0) setUserProfile(profiles[0]);
    }

    setLoading(false);
  };

  const formatAmount = (amount) => {
    if (!amount) return 'Negotiable';
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleBookPackage = async () => {
    if (!userProfile) return toast.error('User profile not found');
    setSubmitting(true);

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        client_id: userProfile.id,
        client_email: user.email,
        provider_id: provider.id,
        provider_email: provider.user_email,
        title: service.title,
        description: service.description || `Package includes: ${service.deliverables?.join(', ')}`,
        agreed_amount: parseFloat(service.price),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    setCreatedJobId(job.id);
    setHireDialogOpen(false);
    setPaymentDialogOpen(true);
    setSubmitting(false);
  };

  const handlePayment = async () => {
    if (!paymentForm.phone) return toast.error('Please enter your phone number');
    setSubmitting(true);

    // Get or create wallet
    let { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_email', user.email);
    let wallet = wallets?.[0];

    if (!wallet) {
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({
          user_id: userProfile.id,
          user_email: user.email,
          balance: 0,
          available_balance: 0,
          locked_balance: 0
        })
        .select()
        .single();
      wallet = newWallet;
    }

    const amount = parseFloat(service.price);

    // Update wallet
    await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance || 0) + amount,
        available_balance: wallet.available_balance || 0,
        locked_balance: (wallet.locked_balance || 0) + amount
      })
      .eq('id', wallet.id);

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'funded' })
      .eq('id', createdJobId);

    // Create transaction
    await supabase
      .from('transactions')
      .insert({
        job_id: createdJobId,
        from_wallet_id: wallet.id,
        from_email: user.email,
        amount,
        type: 'escrow_lock',
        description: `${paymentForm.method.toUpperCase()} payment for: ${service.title}`,
        status: 'completed'
      });

    // Notify provider
    await supabase
      .from('notifications')
      .insert({
        user_email: provider.user_email,
        title: 'New Booking!',
        message: `${userProfile.full_name} booked your "${service.title}" package (${formatAmount(amount)})`,
        type: 'job',
        link: `JobDetail?id=${createdJobId}`
      });

    toast.success('Payment successful! Job funded in escrow.');
    setPaymentDialogOpen(false);
    setSubmitting(false);
    window.location.href = createPageUrl(`JobDetail?id=${createdJobId}`);
  };

  if (loading) return <div className="min-h-screen py-8 lg:py-12">Loading...</div>;
  if (!service) return (
    <div className="min-h-screen py-8 lg:py-12 flex items-center justify-center">
      <div className="card-dark p-12 text-center max-w-md">
        <h3 className="text-lg font-medium text-white mb-2">Service not found</h3>
        <Link to={createPageUrl('Discover')}>
          <Button className="btn-primary mt-4">Browse Services</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back */}
        <Link to={createPageUrl('Discover')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-[#1A1D2E]">
              {service.image_url ? (
                <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6633]/20 to-[#E55A2B]/20">
                  <Briefcase className="w-20 h-20 text-[#FF6633]/50" />
                </div>
              )}
            </div>

            {/* Service Info */}
            <div>
              {category && (
                <Badge className="bg-[#FF6633]/10 text-[#FF6633] border-[#FF6633]/30 mb-3">
                  {category.name}
                </Badge>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">{service.title}</h1>
              <p className="text-gray-400 leading-relaxed">{service.description || 'No description provided.'}</p>
            </div>

            {/* Portfolio Preview */}
            {portfolio.length > 0 && (
              <div className="card-dark p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Portfolio</h3>
                <div className="grid grid-cols-3 gap-3">
                  {portfolio.map(item => (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-[#0F1117]">
                      {item.media_type === 'image' ? (
                        <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          {item.media_type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="card-dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Reviews ({reviews.length})</h3>
                {avgRating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-semibold">{avgRating}</span>
                  </div>
                )}
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map(review => (
                    <div key={review.id} className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">
                              {review.client_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <span className="text-white font-medium">{review.client_name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-gray-400 text-sm">{review.comment}</p>}
                      <p className="text-gray-600 text-xs mt-2">{format(new Date(review.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price & Hire Card */}
            <div className="card-dark p-6 sticky top-24">
              <div className="mb-6">
                <p className="text-gray-500 text-sm">Starting at</p>
                <p className="text-3xl font-bold text-[#FF6633]">{formatAmount(service.price)}</p>
                {service.price_type && (
                  <p className="text-gray-500 text-sm capitalize">{service.price_type}</p>
                )}
              </div>

              {user ? (
                userProfile?.user_type === 'client' ? (
                  <Button onClick={() => setHireDialogOpen(true)} className="btn-primary w-full mb-4">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Book Package
                  </Button>
                ) : (
                  <p className="text-gray-500 text-sm text-center mb-4">Switch to client account to book</p>
                )
              ) : (
                <Button onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })} className="btn-primary w-full mb-4">
                  Sign in to Book
                </Button>
              )}

              {provider?.phone_number && (
                <a href={`tel:${provider.phone_number}`}>
                  <Button variant="outline" className="w-full border-[#2A2D3E] text-white hover:bg-[#1A1D2E]">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Provider
                  </Button>
                </a>
              )}
            </div>

            {/* Provider Card */}
            {provider && (
              <Link to={createPageUrl(`ProviderProfile?id=${provider.id}`)} className="card-dark p-6 block hover:border-[#FF6633]/30 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-br from-[#7CB342] to-[#689F38]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1D2E]">
                      {provider.profile_image_url ? (
                        <img src={provider.profile_image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6633] to-[#E55A2B]">
                          <span className="text-xl font-bold text-white">{provider.full_name?.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{provider.full_name}</h4>
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <MapPin className="w-3 h-3" />
                      {provider.location || 'No location'}
                    </div>
                    {avgRating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white text-sm">{avgRating}</span>
                        <span className="text-gray-500 text-sm">({reviews.length})</span>
                      </div>
                    )}
                  </div>
                </div>
                {provider.bio && <p className="text-gray-500 text-sm line-clamp-3">{provider.bio}</p>}
              </Link>
            )}

            {/* Other Services */}
            {otherServices.length > 0 && (
              <div className="card-dark p-6">
                <h4 className="text-white font-semibold mb-4">More from this provider</h4>
                <div className="space-y-3">
                  {otherServices.map(svc => (
                    <Link key={svc.id} to={createPageUrl(`ServiceDetail?id=${svc.id}`)} className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1117] border border-[#2A2D3E] hover:border-[#FF6633]/30 transition-all">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#2A2D3E] flex-shrink-0">
                        {svc.image_url ? (
                          <img src={svc.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{svc.title}</p>
                        <p className="text-[#FF6633] text-sm">{formatAmount(svc.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Book Package Dialog */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Book: {service?.title}</DialogTitle>
            <DialogDescription className="text-gray-500">
              Review package details before payment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400">Package Price</span>
                <span className="text-2xl font-bold text-[#FF6B3D]">{formatAmount(service?.price)}</span>
              </div>
              
              {service?.delivery_days && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-400">Delivery Time</span>
                  <span className="text-white">{service.delivery_days} days</span>
                </div>
              )}
              
              {service?.deliverables && service.deliverables.length > 0 && (
                <div>
                  <p className="text-gray-400 mb-2 text-sm">Includes:</p>
                  <ul className="space-y-1">
                    {service.deliverables.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-[#7CB342] mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Protected by Escrow</span>
              </div>
              <p className="text-gray-400 text-xs">
                Payment held securely until job completion. Only released when you're satisfied.
              </p>
            </div>
            
            <Button onClick={handleBookPackage} disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {submitting ? 'Processing...' : 'Continue to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Mobile Money Payment</DialogTitle>
            <DialogDescription className="text-gray-500">
              Pay {formatAmount(service?.price)} via Mobile Money
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400 mb-2 block">Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}>
                <SelectTrigger className="input-dark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                  <SelectItem value="mtn">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-yellow-400 flex items-center justify-center">
                        <span className="text-xs font-bold text-black">M</span>
                      </div>
                      MTN Mobile Money
                    </div> base44
                  </SelectItem>
                  <SelectItem value="airtel">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-red-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">A</span>
                      </div>
                      Airtel Money
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-gray-400 mb-2 block">Phone Number</Label>
              <Input
                type="tel"
                value={paymentForm.phone}
                onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                placeholder="e.g., 0700123456"
                className="input-dark"
              />
            </div>
            
            <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Amount to pay</span>
                <span className="text-xl font-bold text-white">{formatAmount(service?.price)}</span>
              </div>
              <p className="text-gray-500 text-xs">
                Funds will be locked in escrow until job completion
              </p>
            </div>
            
            <Button onClick={handlePayment} disabled={submitting} className="btn-primary w-full">
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatAmount(service?.price)}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}