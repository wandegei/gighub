import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '../utils'
import { supabase } from '@/lib/supabaseClient'

import {
  ChevronLeft,
  Star,
  Phone,
  Briefcase,
  MessageSquare,
  Loader2,
  Lock
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

import { toast } from 'sonner'

export default function ServiceDetail(){

  const [service,setService] = useState(null)
  const [provider,setProvider] = useState(null)
  const [category,setCategory] = useState(null)

  const [reviews,setReviews] = useState([])
  const [otherServices,setOtherServices] = useState([])
  const [portfolio,setPortfolio] = useState([])

  const [user,setUser] = useState(null)
  const [userProfile,setUserProfile] = useState(null)

  const [loading,setLoading] = useState(true)
  const [submitting,setSubmitting] = useState(false)

  const [createdJobId,setCreatedJobId] = useState(null)

  const [loginDialogOpen,setLoginDialogOpen] = useState(false)
  const [hireDialogOpen,setHireDialogOpen] = useState(false)
  // const [paymentDialogOpen,setPaymentDialogOpen] = useState(false)

  const [loginForm,setLoginForm] = useState({email:'',password:''})
  const [paymentForm,setPaymentForm] = useState({phone:'',method:'mtn'})

  useEffect(()=>{
    loadData()
  },[])

  async function loadData(){
    try{
      setLoading(true)
      const id = new URLSearchParams(window.location.search).get('id')
      if(!id){ setLoading(false); return }

      const {data:serviceData} = await supabase
        .from('services')
        .select('*')
        .eq('id',id)
        .maybeSingle()

      if(!serviceData){ setLoading(false); return }
      setService(serviceData)

      const {data:providerData} = await supabase
        .from('profiles')
        .select('*')
        .eq('id',serviceData.provider_id)
        .maybeSingle()

      if(providerData){
        setProvider(providerData)
        console.log("Provider loaded:", providerData)

        const {data:providerServices} = await supabase
          .from('services')
          .select('*')
          .eq('provider_id',serviceData.provider_id)
          .eq('is_active',true)

        setOtherServices(
          providerServices?.filter(s=>s.id!==serviceData.id).slice(0,4) || []
        )

        const {data:portfolioItems} = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('provider_id',serviceData.provider_id)

        setPortfolio(portfolioItems?.slice(0,6) || [])
      }

      const {data:categoryData} = await supabase
        .from('categories')
        .select('*')
        .eq('id',serviceData.category_id)
        .maybeSingle()

      if(categoryData) setCategory(categoryData)

      const {data:reviewsData} = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id',serviceData.provider_id)

      setReviews(reviewsData || [])

      const {data:{user:authUser}} = await supabase.auth.getUser()
      if(authUser){
        setUser(authUser)
        const {data:profile} = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id',authUser.id)
          .maybeSingle()
        setUserProfile(profile)
        console.log("User profile loaded:", profile)
      }

    }catch(err){
      console.error(err)
    }
    setLoading(false)
  }

  const formatAmount = amount =>
    !amount
      ? 'Negotiable'
      : new Intl.NumberFormat('en-UG',{
          style:'currency',
          currency:'UGX',
          minimumFractionDigits:0,
          maximumFractionDigits:0
        }).format(amount)

  const avgRating =
    reviews.length>0
      ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1)
      : null

  /* ------------------- LOGIN   Review package before payment------------------- */
  async function handleLogin(){
    if(!loginForm.email || !loginForm.password){
      toast.error("Enter email and password")
      return
    }
    setSubmitting(true)
    const {data,error} = await supabase.auth.signInWithPassword(loginForm)
    if(error){
      toast.error(error.message)
      setSubmitting(false)
      return
    }
    setUser(data.user)
    const {data:profile} = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id',data.user.id)
      .maybeSingle()
    setUserProfile(profile)
    toast.success("Logged in successfully")
    setLoginDialogOpen(false)
    setSubmitting(false)
  }

  /* ------------------- BOOK ------------------- */
async function handleBookPackage() {
  if (!userProfile || !provider || !service) {
    toast.error("Service or user data not ready yet");
    return;
  }

  try {
    setSubmitting(true);

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        client_id: userProfile.id,
        provider_id: provider.id,
        title: service.title,
        description: service.description,
        agreed_amount: parseFloat(service.price),
        status: "pending",
      })
      .select()
      .single();

    if (jobError) {
      toast.error("Failed to create job: " + jobError.message);
      return;
    }

    setHireDialogOpen(false);

    // Trigger payment immediately
    await handlePayment(job.id);
  } catch (err) {
    console.error("Booking failed:", err);
    toast.error("Booking failed");
  } finally {
    setSubmitting(false);
  }
}

  /* ------------------- PAYMENT ------------------- */
async function handlePayment(jobId) {
  if (!user || !jobId || !service) {
    toast.error("Missing required data for payment");
    return;
  }

  try {
    setSubmitting(true); // show loading state

    const amount = Number(service.price);

    const response = await fetch(
      "https://cwvfozdugyzkzalbrhpo.supabase.co/functions/v1/supabase-functions-new-flutterwave-payment",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          email: user.email,
          job_id: jobId,
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Payment function error:", errData);
      toast.error(errData.message || "Payment request failed");
      return;
    }

    const result = await response.json().catch(() => ({}));
    console.log("Payment function result:", result);

    if (result?.link) {
      // ✅ Redirect user to payment link
      window.location.href = result.link;
    } else {
      toast.error("No payment link returned");
      console.error("Payment link missing in response:", result);
    }
  } catch (err) {
    console.error("Payment failed:", err);
    toast.error("Payment failed");
  } finally {
    setSubmitting(false); // stop loading
  }
}

  /* ------------------- MESSAGING  ------------------- */
 async function openMessage() {
  console.log("Client profile id:", userProfile?.id);
  console.log("Provider profile id:", provider?.id);

  if (!userProfile) {
    toast.error("Login first");
    return;
  }

  if (!provider) {
    toast.error("Provider still loading");
    return;
  }

  if (provider.id === userProfile.id) {
    toast.error("You cannot message yourself");
    return;
  }

  try {
    // 1️⃣ Check if a conversation already exists between these two users setPaymentDialogOpen 
    const { data: existing, error: fetchError } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(user_one.eq.${userProfile.id},user_two.eq.${provider.id}),and(user_one.eq.${provider.id},user_two.eq.${userProfile.id})`
      )
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching conversation:", fetchError);
      toast.error("Failed to check existing conversation");
      return;
    }

    let convo = existing;

    // 2️⃣ If no existing conversation, create a new one
    if (!convo) {
      const { data: newConvo, error: insertError } = await supabase
        .from("conversations")
        .insert({
          user_one: userProfile.id,
          user_two: provider.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating conversation:", insertError);
        toast.error(insertError.message);
        return;
      }

      convo = newConvo;
      console.log("Created new conversation:", convo);
    } else {
      console.log("Using existing conversation:", convo);
    }

    // 3️⃣ Redirect to messages page with convoId
    window.location.href = createPageUrl(`Messages?convoId=${convo.id}`);
  } catch (err) {
    console.error("Messaging failed:", err);
    toast.error("Messaging failed");
  }
}

  if(loading) return <div className="p-10">Loading...</div>
  if(!service) return <div className="p-10 text-center">Service not found</div>

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">

        <Link to={createPageUrl('Discover')} className="inline-flex items-center gap-2 text-gray-400 mb-6">
          <ChevronLeft className="w-4 h-4"/>
          Back to Services
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* MAIN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video rounded-2xl overflow-hidden bg-[#1A1D2E]">
              {service.image_url
                ? <img src={service.image_url} alt={service.title} className="w-full h-full object-cover"/>
                : <div className="flex items-center justify-center h-full">
                    <Briefcase className="w-20 h-20 text-[#FF6633]/50"/>
                  </div>
              }
            </div>

            <div>
              {category && <Badge className="mb-3">{category.name}</Badge>}
              <h1 className="text-3xl font-bold text-white mb-4">{service.title}</h1>
              <p className="text-gray-400">{service.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <div className="card-dark p-6 sticky top-24">
              <p className="text-gray-400 text-sm">Starting at</p>
              <p className="text-3xl font-bold text-[#FF6633]">{formatAmount(service.price)}</p>

              {user
                ? <Button onClick={()=>setHireDialogOpen(true)} disabled={!provider} className="btn-primary w-full mt-4">
                    <Briefcase className="w-4 h-4 mr-2"/>Book Package
                  </Button>
                : <Button onClick={()=>setLoginDialogOpen(true)} className="btn-primary w-full mt-4">
                    <Lock className="w-4 h-4 mr-2"/>Sign in to Book
                  </Button>
              }

              {provider?.phone_number &&
                <a href={`tel:${provider.phone_number}`}>
                  <Button variant="outline" className="w-full mt-3">
                    <Phone className="w-4 h-4 mr-2"/>Contact Provider
                  </Button>
                </a>
              }

              {userProfile?.user_type === "client" && provider &&
                <Button variant="outline" className="w-full mt-3" onClick={openMessage}>
                  <MessageSquare className="w-4 h-4 mr-2"/>Message Provider
                </Button>
              }
            </div>
          </div>

        </div>
      </div>

      {/* LOGIN DIALOG */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Login</DialogTitle>
            <DialogDescription className="text-gray-500">Login with email and password</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Input type="email" placeholder="Email" value={loginForm.email} onChange={e=>setLoginForm({...loginForm,email:e.target.value})}/>
            <Input type="password" placeholder="Password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm,password:e.target.value})}/>
            <Button onClick={handleLogin} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="animate-spin w-4 h-4"/> : 'Login'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* BOOK DIALOG */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Book: {service?.title}</DialogTitle>
            <DialogDescription className="text-gray-500">Review package before payment</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Package Price</span>
                <span className="text-2xl font-bold text-[#FF6B3D]">{formatAmount(service?.price)}</span>
              </div>
            </div>

            <Button onClick={handleBookPackage} className="w-full btn-primary" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin w-4 h-4"/> : 'Proceed to Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PAYMENT DIALOG  handlePayment paymentDialogOpen */}
      

    </div>
  )
}