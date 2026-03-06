import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '../utils'
import { supabase } from '@/lib/supabaseClient'
import { Search, ArrowRight, Shield, Wallet, Users, ChevronRight, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CategoryCard from '../components/categories/CategoryCard'
import FeaturedProviders from '../components/featured/FeaturedProviders'

export default function Home() {

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8)

    if (error) {
      console.error('Error loading categories:', error)
    } else {
      setCategories(data)
    }

    setLoading(false)
  }

  const features = [
    {
      icon: Shield,
      title: 'Secure Escrow',
      description: 'Your payments are protected until the job is complete'
    },
    {
      icon: Users,
      title: 'Verified Providers',
      description: 'Connect with trusted and skilled professionals'
    },
    {
      icon: Wallet,
      title: 'Easy Payments',
      description: 'Seamless mobile money integration for quick transactions'
    }
  ]

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-b from-[#FF6633]/10 to-transparent" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#FF6633]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#7CB342]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">

          <div className="max-w-3xl mx-auto text-center">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Find Skilled <span className="text-[#FF6633]">Professionals</span> for Any Service
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Connect with verified service providers, manage projects with secure escrow payments, and get quality work done.
            </p>

            {/* SEARCH */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">

              <div className="relative flex-1">

                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for services..."
                  className="input-dark pl-12 h-14 text-lg"
                />

              </div>

              <Link to={createPageUrl(`Categories${searchQuery ? `?search=${searchQuery}` : ''}`)}>
                <Button className="btn-primary h-14 px-8 w-full sm:w-auto">
                  Search
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

            </div>

            {/* POPULAR */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">

              <span>Popular:</span>

              {['Mechanics', 'Builders', 'Cleaners', 'Barbers'].map((cat) => (

                <Link
                  key={cat}
                  to={createPageUrl(`CategoryProviders?slug=${cat.toLowerCase()}`)}
                  className="px-3 py-1.5 rounded-full bg-[#1A1D2E] text-gray-400 hover:text-white hover:bg-[#2A2D3E] transition-colors"
                >
                  {cat}
                </Link>

              ))}

            </div>

            {/* BECOME PROVIDER */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">

              <Button
                onClick={() => (window.location.href = '/login')}
                variant="outline"
                className="border-[#7CB342] text-[#7CB342] hover:bg-[#7CB342]/10"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Become a Provider
              </Button>

            </div>

          </div>
        </div>
      </section>


      {/* FEATURES */}
      <section className="py-16 bg-[#0F1117]">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {features.map((feature, index) => (

              <div
                key={index}
                className="card-dark p-6 text-center hover:border-[#FF6633]/30 transition-all duration-300"
              >

                <div className="w-14 h-14 rounded-2xl bg-[#FF6633]/10 flex items-center justify-center mx-auto mb-4">

                  <feature.icon className="w-7 h-7 text-[#FF6633]" />

                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>

                <p className="text-gray-500 text-sm">
                  {feature.description}
                </p>

              </div>

            ))}

          </div>

        </div>
      </section>


      {/* FEATURED PROVIDERS */}
      <section className="py-16 lg:py-24 bg-[#0A0E1A]">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">

            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#FF6B3D] to-[#FF5722] px-4 py-2 rounded-full mb-4">
              <span className="text-sm font-semibold" style={{ color: 'black' }}>
                ★ FEATURED
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Top Rated Professionals
            </h2>

            <p className="text-gray-400 max-w-2xl mx-auto">
              Verified providers with excellent ratings and reviews
            </p>

          </div>

          <FeaturedProviders />

        </div>
      </section>


      {/* CATEGORIES */}
      <section className="py-16 lg:py-24">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between mb-10">

            <div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Browse Categories
              </h2>

              <p className="text-gray-500">
                Explore services from verified professionals
              </p>

            </div>

            <Link
              to={createPageUrl('Categories')}
              className="flex items-center gap-2 text-[#FF6633] hover:text-[#E55A2B] transition-colors"
            >

              View All
              <ChevronRight className="w-4 h-4" />

            </Link>

          </div>


          {loading ? (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {[...Array(8)].map((_, i) => (

                <div key={i} className="card-dark overflow-hidden animate-pulse">

                  <div className="aspect-[4/3] bg-[#2A2D3E]" />

                  <div className="p-4 space-y-3">

                    <div className="h-5 bg-[#2A2D3E] rounded w-3/4" />
                    <div className="h-4 bg-[#2A2D3E] rounded w-1/2" />

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}

            </div>

          )}

        </div>

      </section>


      {/* CTA */}
      <section className="py-16 lg:py-24">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="card-dark p-8 lg:p-12 text-center bg-gradient-to-br from-[#FF6633]/10 to-transparent">

            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>

            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of satisfied users. Register as a provider or find the perfect professional for your needs.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">

              <Button
                onClick={() => (window.location.href = '/login')}
                className="btn-primary"
              >
                Sign Up Now
              </Button>

              <Link to={createPageUrl('Categories')}>
                <Button
                  variant="outline"
                  className="border-[#2A2D3E] text-white hover:bg-[#1A1D2E] w-full sm:w-auto"
                >
                  Browse Services
                </Button>
              </Link>

            </div>

          </div>

        </div>

      </section>

    </div>
  )
}