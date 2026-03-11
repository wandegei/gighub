import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/lib/supabaseClient';
import { 
  ChevronLeft, MapPin, Star, Phone, Briefcase, 
  MessageSquare, Loader2, Check, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

  const navigate = useNavigate();

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

  const [paymentForm, setPaymentForm] = useState({
    phone: '',
    method: 'mtn'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return setLoading(false);

    const { data: serviceData } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (!serviceData) return setLoading(false);
    setService(serviceData);

    const { data: providerData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', serviceData.provider_id)
      .single();

    if (providerData) {
      setProvider(providerData);

      const { data: providerServices } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', serviceData.provider_id)
        .eq('is_active', true);

      setOtherServices(providerServices?.filter(s => s.id !== serviceData.id).slice(0, 4) || []);

      const { data: portfolioItems } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('provider_id', serviceData.provider_id);

      setPortfolio(portfolioItems?.slice(0, 6) || []);
    }

    const { data: categoryData } = await supabase
      .from('categories')
      .select('*')
      .eq('id', serviceData.category_id)
      .single();

    if (categoryData) setCategory(categoryData);

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .eq('provider_id', serviceData.provider_id);

    setReviews(reviewsData || []);

    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (authUser) {
      setUser(authUser);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      setUserProfile(profile);
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


  /* ---------------- MESSAGE PROVIDER ---------------- */

  const handleMessageProvider = async () => {

    if (!userProfile) {
      toast.error("Please sign in to message the provider");
      return;
    }

    const myId = userProfile.id;
    const otherId = provider.id;

    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(`and(user_one.eq.${myId},user_two.eq.${otherId}),and(user_one.eq.${otherId},user_two.eq.${myId})`)
      .maybeSingle();

    let conversation = existing;

    if (!conversation) {

      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_one: myId,
          user_two: otherId
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error("Failed to start conversation");
        return;
      }

      conversation = data;
    }

    navigate(`/messages?conversation=${conversation.id}`);
  };


  /* ---------------- BOOK PACKAGE ---------------- */

  const handleBookPackage = async () => {

    if (!userProfile) return toast.error('User profile not found');

    setSubmitting(true);

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        client_id: userProfile.id,
        provider_id: provider.id,
        title: service.title,
        description: service.description,
        agreed_amount: parseFloat(service.price),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error(error);
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

    let { data: wallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id);

    let wallet = wallets?.[0] || null;

    if (!wallet) {

      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          available_balance: 0,
          locked_balance: 0
        })
        .select()
        .single();

      wallet = newWallet;
    }

    const amount = parseFloat(service.price);

    await supabase
      .from('wallets')
      .update({
        balance: (wallet.balance || 0) + amount,
        locked_balance: (wallet.locked_balance || 0) + amount
      })
      .eq('id', wallet.id);

    await supabase
      .from('jobs')
      .update({ status: 'funded' })
      .eq('id', createdJobId);

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

        <Link to={createPageUrl('Discover')} className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">

            <div className="aspect-video rounded-2xl overflow-hidden bg-[#1A1D2E]">
              {service.image_url ? (
                <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Briefcase className="w-20 h-20 text-[#FF6633]/50" />
                </div>
              )}
            </div>

            <div>
              {category && (
                <Badge className="bg-[#FF6633]/10 text-[#FF6633] border-[#FF6633]/30 mb-3">
                  {category.name}
                </Badge>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                {service.title}
              </h1>
              <p className="text-gray-400">{service.description}</p>
            </div>

          </div>


          {/* SIDEBAR */}
          <div className="space-y-6">

            <div className="card-dark p-6 sticky top-24">

              <div className="mb-6">
                <p className="text-gray-500 text-sm">Starting at</p>
                <p className="text-3xl font-bold text-[#FF6633]">
                  {formatAmount(service.price)}
                </p>
              </div>

              {user ? (
                <Button
                  onClick={() => setHireDialogOpen(true)}
                  className="btn-primary w-full mb-4"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Book Package
                </Button>
              ) : (
                <Button
                  onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
                  className="btn-primary w-full mb-4"
                >
                  Sign in to Book
                </Button>
              )}

              {/* MESSAGE PROVIDER BUTTON */}

              {user && (
                <Button
                  onClick={handleMessageProvider}
                  variant="outline"
                  className="btn-primary w-full mb-4"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Provider
                </Button>
              )}

              {provider?.phone_number && (
                <a href={`tel:${provider.phone_number}`}>
                  <Button
                    variant="outline"
                    className="btn-primary w-full mb-4"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Provider
                  </Button>
                </a>
              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );
}