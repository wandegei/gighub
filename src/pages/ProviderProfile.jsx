import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/lib/supabaseClient'; // Make sure you have Supabase client setup  format(new Date(review.created_date), 'MMM d, yyyy')
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Star, 
  Briefcase,
  Image as ImageIcon,
  Play,
  FileText,
  MessageSquare,
  X,
  Maximize2,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ProviderProfile() {
  const [provider, setProvider] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [services, setServices] = useState([]);
  const [skills, setSkills] = useState([]);
  const [hireDialogOpen, setHireDialogOpen] = useState(false);
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [jobForm, setJobForm] = useState({ title: '', description: '', agreed_amount: '' });
  const [submitting, setSubmitting] = useState(false);
  const [verifications, setVerifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch provider
      let { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profiles) {
        setProvider(profiles);

        // Portfolio
        let { data: portfolioItems } = await supabase
          .from('portfolio_items')
          .select('*')
          .eq('provider_id', id);
        setPortfolio(portfolioItems || []);

        // Categories
        let { data: relations } = await supabase
          .from('provider_categories')
          .select('*')
          .eq('provider_id', id);
        if (relations?.length > 0) {
          let { data: allCategories } = await supabase
            .from('categories')
            .select('*');
          const providerCategories = allCategories.filter(c =>
            relations.some(r => r.category_id === c.id)
          );
          setCategories(providerCategories);
        }

        // Reviews
        let { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('provider_id', id);
        setReviews(reviewsData || []);

        // Services
        let { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('provider_id', id)
          .eq('is_active', true);
        setServices(servicesData || []);

        // Skills
        let { data: skillsData } = await supabase
          .from('skills')
          .select('*')
          .eq('provider_id', id);
        setSkills(skillsData || []);

        // Verifications
        let { data: verificationsData } = await supabase
          .from('verifications')
          .select('*')
          .eq('provider_id', id)
          .eq('status', 'verified');
        setVerifications(verificationsData || []);
      }

      // Current logged-in user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) setUser(currentUser);

    } catch (error) {
      console.error('Error loading provider data:', error);
    }

    setLoading(false);
  };

  const handleHire = async () => {
    if (!jobForm.title || !jobForm.agreed_amount) {
      toast.error('Please fill in job title and amount');
      return;
    }

    setSubmitting(true);

    try {
      // Fetch client profile
      let { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_email', user.email)
        .single();

      if (!userProfile) {
        toast.error('Please complete your profile first');
        setSubmitting(false);
        return;
      }

      // Create job
      await supabase.from('jobs').insert({
        client_id: userProfile.id,
        client_email: user.email,
        provider_id: provider.id,
        provider_email: provider.user_email,
        title: jobForm.title,
        description: jobForm.description,
        agreed_amount: parseFloat(jobForm.agreed_amount),
        status: 'pending'
      });

      toast.success('Job created! Fund it to proceed.');
      setHireDialogOpen(false);
      setJobForm({ title: '', description: '', agreed_amount: '' });

    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job');
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 lg:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-6 bg-[#2A2D3E] rounded w-32" />
            <div className="card-dark p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-32 h-32 rounded-full bg-[#2A2D3E]" />
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-[#2A2D3E] rounded w-48" />
                  <div className="h-4 bg-[#2A2D3E] rounded w-32" />
                  <div className="h-20 bg-[#2A2D3E] rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen py-8 lg:py-12 flex items-center justify-center">
        <div className="card-dark p-12 text-center max-w-md">
          <h3 className="text-lg font-medium text-white mb-2">Provider not found</h3>
          <p className="text-gray-500 mb-4">The provider you're looking for doesn't exist.</p>
          <Link to={createPageUrl('Providers')}>
            <Button className="btn-primary">Browse Providers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const mediaTypeIcons = {
    image: ImageIcon,
    video: Play,
    document: FileText
  };

  return (
    <div className="min-h-screen py-8 lg:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link 
          to={createPageUrl('Providers')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Providers
        </Link>

        {/* Profile Card */}
        <div className="card-dark p-6 lg:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-full p-1 bg-gradient-to-br from-[#7CB342] to-[#689F38] mx-auto md:mx-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-[#1A1D2E]">
                  {provider.avatar_url ? (
                    <img 
                      src={provider.avatar_url} 
                      alt={provider.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6633] to-[#E55A2B]">
                      <span className="text-4xl font-bold text-white">
                        {provider.full_name?.charAt(0)?.toUpperCase() || 'P'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                {provider.full_name}
              </h1>
              
              {/* Rating */}
              {reviews.length > 0 ? (
                <div className="flex items-center justify-center md:justify-start gap-1 mb-3">
                  {[...Array(5)].map((_, i) => {
                    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    return (
                      <Star 
                        key={i} 
                        className={`w-5 h-5 ${i < Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                      />
                    );
                  })}
                  <span className="text-gray-400 ml-2">
                    ({(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}) · {reviews.length} reviews
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-1 mb-3 text-gray-500">
                  <Star className="w-5 h-5" />
                  <span>No reviews yet</span>
                </div>
              )}

              {/* Location */}
              {provider.location && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{provider.location}</span>
                </div>
              )}

              {/* Categories & Verification */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                {categories.map((cat) => (
                  <Badge key={cat.id} className="bg-[#FF6633]/10 text-[#FF6633] border-[#FF6633]/30">
                    {cat.name}
                  </Badge>
                ))}
                {verifications.length > 0 && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              {/* Bio */}
              {provider.bio && (
                <p className="text-gray-400 mb-4">{provider.bio}</p>
              )}
              
              {/* Skills */}
              {skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill.id} variant="outline" className="bg-[#0A0E1A] border-[#1E2430] text-[#E4E7EB]">
                        {skill.skill_name}
                        {skill.proficiency && (
                          <span className="ml-1 text-xs text-gray-500">• {skill.proficiency}</span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                {user ? (
                  <Dialog open={hireDialogOpen} onOpenChange={setHireDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Hire Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1A1D2E] border-[#2A2D3E]">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create a Job</DialogTitle>
                        <DialogDescription className="text-gray-500">
                          Hire {provider.full_name} for your project
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Job Title</label>
                          <Input
                            value={jobForm.title}
                            onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                            placeholder="e.g., Fix plumbing issue"
                            className="input-dark"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Description</label>
                          <Textarea
                            value={jobForm.description}
                            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                            placeholder="Describe the work needed..."
                            className="input-dark min-h-[100px]"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 mb-1 block">Agreed Amount (UGX)</label>
                          <Input
                            type="number"
                            value={jobForm.agreed_amount}
                            onChange={(e) => setJobForm({ ...jobForm, agreed_amount: e.target.value })}
                            placeholder="e.g., 500000"
                            className="input-dark"
                          />
                        </div>
                        <Button 
                          onClick={handleHire} 
                          disabled={submitting}
                          className="btn-primary w-full"
                        >
                          {submitting ? 'Creating...' : 'Create Job'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <Button 
                  onClick={async () => {
                    // Redirect to Supabase login page
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google', // or 'github', 'facebook', etc.
                      options: { redirectTo: window.location.href } // optional: redirect back after login
                    });
                    if (error) toast.error(error.message);
                  }}
                  className="btn-primary"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Sign in to Hire
                </Button>
                )}
                
                {provider.phone_number && (
                  <a href={`tel:${provider.phone_number}`}>
                    <Button variant="outline" className="border-[#2A2D3E] text-white hover:bg-[#2A2D3E] w-full sm:w-auto">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="card-dark p-6 lg:p-8">
          <Tabs defaultValue="portfolio" className="w-full">
            <TabsList className="bg-[#0A0E1A] border border-[#1E2430] mb-6">
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B3D] data-[state=active]:to-[#FF5722] data-[state=active]:text-white">
                Portfolio ({portfolio.length})
              </TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B3D] data-[state=active]:to-[#FF5722] data-[state=active]:text-white">
                Services ({services.length})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6B3D] data-[state=active]:to-[#FF5722] data-[state=active]:text-white">
                Reviews ({reviews.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="portfolio">
              {portfolio.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item) => {
                    const Icon = mediaTypeIcons[item.media_type] || ImageIcon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedMedia(item);
                          setMediaViewerOpen(true);
                        }}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-[#151922] border border-[#1E2430] hover:border-[#FF6B3D]/50 transition-all cursor-pointer"
                      >
                        {item.media_type === 'image' ? (
                          <img 
                            src={item.media_url} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : item.media_type === 'video' ? (
                          <div className="relative w-full h-full bg-black">
                            <video src={item.media_url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Play className="w-16 h-16 text-white fill-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-3 right-3">
                            <Maximize2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                            {item.description && (
                              <p className="text-gray-300 text-sm line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No portfolio items yet</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="services">
              {services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      to={createPageUrl(`ServiceDetail?id=${service.id}`)}
                      className="card-dark p-4 hover:border-[#FF6B3D]/50 transition-all group"
                    >
                      <div className="flex gap-4">
                        {service.image_url ? (
                          <img 
                            src={service.image_url} 
                            alt={service.title}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#FF6B3D]/20 to-[#FF5722]/20 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-8 h-8 text-[#FF6B3D]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-semibold mb-1 group-hover:text-[#FF6B3D] transition-colors line-clamp-1">
                            {service.title}
                          </h4>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-2">{service.description}</p>
                          <p className="text-[#FF6B3D] font-semibold">
                            {service.price ? `UGX ${service.price.toLocaleString()}` : 'Negotiable'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No services listed yet</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="reviews">
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-[#151922] border border-[#1E2430]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {review.client_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">{review.client_name || 'Anonymous'}</p>
                            <p className="text-gray-600 text-xs">
                              {format(new Date(review.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-gray-400">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Media Viewer Dialog */}
      <Dialog open={mediaViewerOpen} onOpenChange={setMediaViewerOpen}>
        <DialogContent className="bg-[#151922] border-[#1E2430] max-w-4xl p-0">
          {selectedMedia && (
            <>
              <button
                onClick={() => setMediaViewerOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              {selectedMedia.media_type === 'image' ? (
                <img 
                  src={selectedMedia.media_url} 
                  alt={selectedMedia.title}
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : selectedMedia.media_type === 'video' ? (
                <video 
                  src={selectedMedia.media_url} 
                  controls 
                  autoPlay
                  className="w-full max-h-[80vh]"
                />
              ) : (
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <a 
                    href={selectedMedia.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FF6B3D] hover:underline"
                  >
                    Open Document
                  </a>
                </div>
              )}
              
              <div className="p-6 border-t border-[#1E2430]">
                <h3 className="text-xl font-semibold text-white mb-2">{selectedMedia.title}</h3>
                {selectedMedia.description && (
                  <p className="text-gray-400">{selectedMedia.description}</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}