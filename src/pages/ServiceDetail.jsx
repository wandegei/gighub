import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '../utils'
import { supabase } from '@/lib/supabaseClient'
import {
  ChevronLeft,
  MapPin,
  Star,
  Phone,
  Briefcase,
  MessageSquare,
  Loader2,
  Check,
  CreditCard,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'
import { toast } from 'sonner'

export default function ServiceDetail() {
  const [service, setService] = useState(null)
  const [provider, setProvider] = useState(null)
  const [category, setCategory] = useState(null)
  const [reviews, setReviews] = useState([])
  const [otherServices, setOtherServices] = useState([])
  const [portfolio, setPortfolio] = useState([])

  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [createdJobId, setCreatedJobId] = useState(null)

  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [hireDialogOpen, setHireDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [paymentForm, setPaymentForm] = useState({ phone: '', method: 'mtn' })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const id = new URLSearchParams(window.location.search).get('id')
    if (!id) return setLoading(false)

    // Load Service
    const { data: serviceData } = await supabase.from('services').select('*').eq('id', id).single()
    if (!serviceData) return setLoading(false)
    setService(serviceData)

    // Load Provider
    const { data: providerData } = await supabase.from('profiles').select('*').eq('id', serviceData.provider_id).single()
    if (providerData) {
      setProvider(providerData)

      // Other services
      const { data: providerServices } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', serviceData.provider_id)
        .eq('is_active', true)
      setOtherServices(providerServices?.filter(s => s.id !== serviceData.id).slice(0, 4) || [])

      // Portfolio
      const { data: portfolioItems } = await supabase.from('portfolio_items').select('*').eq('provider_id', serviceData.provider_id)
      setPortfolio(portfolioItems?.slice(0, 6) || [])
    }

    // Category
    const { data: categoryData } = await supabase.from('categories').select('*').eq('id', serviceData.category_id).single()
    if (categoryData) setCategory(categoryData)

    // Reviews
    const { data: reviewsData } = await supabase.from('reviews').select('*').eq('provider_id', serviceData.provider_id)
    setReviews(reviewsData || [])

    // Auth user
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', authUser.id).single()
      setUserProfile(profile)
    }

    setLoading(false)
  }

  const formatAmount = (amount) => !amount ? 'Negotiable' : new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  /** Login handler (email/password) */
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { toast.error("Enter email and password"); return }
    setSubmitting(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: loginForm.email, password: loginForm.password })
    if (error) { toast.error(error.message); setSubmitting(false); return }
    setUser(data.user)
    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', data.user.id).single()
    setUserProfile(profile)
    toast.success("Logged in successfully")
    setLoginDialogOpen(false)
    setSubmitting(false)
  }

  /** Book package handler */
  const handleBookPackage = async () => {
    if (!userProfile) { toast.error("You must be logged in"); return }
    if (!provider || !provider.id) { toast.error("Provider data not loaded yet"); return }
    if (!service || !service.id) { toast.error("Service data not loaded yet"); return }

    setSubmitting(true)
    const { data: job, error } = await supabase.from('jobs')
      .insert({
        client_id: userProfile.id,
        provider_id: provider.id,
        title: service.title,
        description: service.description,
        agreed_amount: parseFloat(service.price),
        status: 'pending'
      })
      .select()
      .single()

    if (error) { toast.error(error.message); setSubmitting(false); return }

    setCreatedJobId(job.id)
    setHireDialogOpen(false)
    setPaymentDialogOpen(true)
    setSubmitting(false)
  }

  /** Payment handler */
  const handlePayment = async () => {
    if (!paymentForm.phone) { toast.error("Enter phone number"); return }
    if (!user || !user.id) { toast.error("User not found"); return }
    setSubmitting(true)

    let { data: wallets } = await supabase.from('wallets').select('*').eq('user_id', user.id)
    let wallet = wallets?.[0] || null
    if (!wallet) {
      const { data: newWallet } = await supabase.from('wallets').insert({ user_id: user.id, balance: 0, available_balance: 0, locked_balance: 0 }).select().single()
      wallet = newWallet
    }

    const amount = parseFloat(service.price)

    await supabase.from('wallets').update({
      balance: (wallet.balance || 0) + amount,
      locked_balance: (wallet.locked_balance || 0) + amount
    }).eq('id', wallet.id)

    await supabase.from('jobs').update({ status: 'funded' }).eq('id', createdJobId)
    await supabase.from('transactions').insert({
      job_id: createdJobId,
      from_wallet_id: wallet.id,
      from_email: user.email,
      amount,
      type: 'escrow_lock',
      description: `${paymentForm.method} payment for ${service.title}`,
      status: 'completed'
    })

    toast.success("Payment successful")
    setPaymentDialogOpen(false)
    setSubmitting(false)
    window.location.href = createPageUrl(`JobDetail?id=${createdJobId}`)
  }

  if (loading) return <div className="p-10">Loading...</div>
  if (!service) return <div className="p-10 text-center">Service not found</div>

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Link to={createPageUrl('Discover')} className="inline-flex items-center gap-2 text-gray-400 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Services
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Image */}
            <div className="aspect-video rounded-2xl overflow-hidden bg-[#1A1D2E]">
              {service.image_url ? <img src={service.image_url} alt={service.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full"><Briefcase className="w-20 h-20 text-[#FF6633]/50" /></div>}
            </div>

            {/* Service Info */}
            <div>
              {category && <Badge className="mb-3">{category.name}</Badge>}
              <h1 className="text-3xl font-bold text-white mb-4">{service.title}</h1>
              <p className="text-gray-400">{service.description || 'No description provided.'}</p>
            </div>

            {/* Portfolio */}
            {portfolio.length > 0 &&
              <div className="card-dark p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Portfolio</h3>
                <div className="grid grid-cols-3 gap-3">
                  {portfolio.map(item => (
                    <div key={item.id} className="aspect-square rounded-lg overflow-hidden bg-[#0F1117]">
                      {item.media_type === 'image' ? <img src={item.media_url} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500">{item.media_type}</div>}
                    </div>
                  ))}
                </div>
              </div>
            }

            {/* Reviews */}
            <div className="card-dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Reviews ({reviews.length})</h3>
                {avgRating && <div className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /><span className="text-white font-semibold">{avgRating}</span></div>}
              </div>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map(r => (
                    <div key={r.id} className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                            <span className="text-white text-sm font-semibold">{r.client_name?.charAt(0) || 'U'}</span>
                          </div>
                          <span className="text-white font-medium">{r.client_name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />)}
                        </div>
                      </div>
                      {r.comment && <p className="text-gray-400 text-sm">{r.comment}</p>}
                      <p className="text-gray-600 text-xs mt-2">{format(new Date(r.created_at), 'MMM d, yyyy')}</p>
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
            <div className="card-dark p-6 sticky top-24">
              <p className="text-gray-400 text-sm">Starting at</p>
              <p className="text-3xl font-bold text-[#FF6633]">{formatAmount(service.price)}</p>

              {user ? (
                <Button onClick={() => setHireDialogOpen(true)} className="btn-primary w-full mt-4"><Briefcase className="w-4 h-4 mr-2" />Book Package</Button>
              ) : (
                <Button onClick={() => setLoginDialogOpen(true)} className="btn-primary w-full mt-4"><Lock className="w-4 h-4 mr-2" />Sign in to Book</Button>
              )}

              {provider?.phone_number && (
                <a href={`tel:${provider.phone_number}`}><Button variant="outline" className="w-full mt-3"><Phone className="w-4 h-4 mr-2" />Contact Provider</Button></a>
              )}

              {user && userProfile && provider?.id !== userProfile.id && (
                <Button variant="outline" className="w-full mt-3" onClick={() => window.location.href = createPageUrl(`Messages?provider=${provider.id}`)}><MessageSquare className="w-4 h-4 mr-2" />Message Provider</Button>
              )}
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
            <Input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} className="input-dark" />
            <Input type="password" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="input-dark" />
            <Button onClick={handleLogin} disabled={submitting} className="w-full">{submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Login'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* HIRE / BOOK DIALOG */}
      <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Book: {service?.title}</DialogTitle>
            <DialogDescription className="text-gray-500">Review package details before payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-[#0F1117] border border-[#2A2D3E]">
              <div className="flex items-center justify-between mb-4"><span className="text-gray-400">Package Price</span><span className="text-2xl font-bold text-[#FF6B3D]">{formatAmount(service?.price)}</span></div>
              {service?.delivery_days && <div className="flex items-center justify-between mb-4"><span className="text-gray-400">Delivery Time</span><span className="text-white">{service.delivery_days} days</span></div>}
              {service?.deliverables?.length > 0 && <ul className="space-y-1 text-gray-300 text-sm">{service.deliverables.map((item, i) => <li key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-[#7CB342] mt-0.5 flex-shrink-0" />{item}</li>)}</ul>}
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400">You will be redirected to payment after booking.</div>
            <Button onClick={handleBookPackage} className="w-full btn-primary" disabled={submitting}>{submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Proceed to Payment'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PAYMENT DIALOG */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Payment</DialogTitle>
            <DialogDescription className="text-gray-500">Pay using mobile money</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input placeholder="Phone Number" value={paymentForm.phone} onChange={e => setPaymentForm({ ...paymentForm, phone: e.target.value })} className="input-dark" />
            <Select value={paymentForm.method} onValueChange={v => setPaymentForm({ ...paymentForm, method: v })}>
              <SelectTrigger className="w-full input-dark"><SelectValue placeholder="Payment Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                <SelectItem value="airtel">Airtel Money</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handlePayment} className="w-full btn-primary" disabled={submitting}>{submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Pay Now'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}