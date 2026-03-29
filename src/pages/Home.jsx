import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { supabase } from "@/lib/supabaseClient";

import {
  Search,
  ArrowRight,
  Shield,
  Wallet,
  Users,
  ChevronRight,
  ChevronLeft,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import CategoryCard from "../components/categories/CategoryCard";
import FeaturedProviders from "../components/featured/FeaturedProviders";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  /* HERO SLIDES – Preloaded Videos  Latest Jobs Posted */
  const slides = [
    {
      video: "https://cwvfozdugyzkzalbrhpo.supabase.co/storage/v1/object/public/main%20vedios/mechanics.mp4",
      title: "Find Skilled Professional mechanics",
      subtitle: "Connect with trusted service providers instantly",
    },
    {
      video: "https://cwvfozdugyzkzalbrhpo.supabase.co/storage/v1/object/public/main%20vedios/builder%20school.mp4",
      title: "Hire Builders For Any Project",
      subtitle: "Get quality work from verified professionals",
    },
    {
      video: "https://cwvfozdugyzkzalbrhpo.supabase.co/storage/v1/object/public/main%20vedios/GigHub%20App_1.mp4",
      title: "Professional Cleaning Services",
      subtitle: "Reliable cleaners ready to help",
    },
    {
      video: "https://cwvfozdugyzkzalbrhpo.supabase.co/storage/v1/object/public/main%20vedios/barbers.mp4",
      title: "Barbers & Personal Services",
      subtitle: "Book experienced professionals near you",
    },
    {
      video: "https://cwvfozdugyzkzalbrhpo.supabase.co/storage/v1/object/public/main%20vedios/WhatsApp%20Video%202026-03-10%20at%206.58.15%20PM.mp4",
      title: "Barbers & Personal Services",
      subtitle: "Book experienced professionals near you",
    },
    {
      video: "https://cwvfozdugyzkzalbrhpo.supabase.co/storage/v1/object/public/main%20vedios/WhatsApp%20Video%202026-03-10%20at%207.04.41%20PM.mp4",
      title: "Barbers & Personal Services",
      subtitle: "Book experienced professionals near you",
    }
  ];

  const videoRefs = useRef([]);

  /* LOAD DATA */
  useEffect(() => {
    loadCategories();
    loadJobs();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) console.error(error);
    setCategories(data || []);
    setLoading(false);
  };

  const loadJobs = async () => {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);
    if (error) console.error(error);
    setJobs(data || []);
  };

  /* AUTO SLIDER – Smooth Fade */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  /* SEARCH */
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    window.location.href = createPageUrl(`Categories?search=${searchQuery}`);
  };

  const features = [
    { icon: Shield, title: "Secure Escrow", description: "Your payment stays protected until the job is completed" },
    { icon: Users, title: "Verified Providers", description: "Connect with trusted professionals in your area" },
    { icon: Wallet, title: "Easy Payments", description: "Pay easily with secure mobile payment systems" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO */}
      <section className="relative h-[90vh] overflow-hidden">
        {slides.map((slide, index) => (
          <video
            key={index}
            ref={(el) => (videoRefs.current[index] = el)}
            src={slide.video}
            autoPlay
            loop
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-black/40" />

        {/* HERO CONTENT */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="max-w-3xl text-center px-6">
            <h1 className="text-5xl font-bold text-white mb-6">
              {slides[currentSlide].title}
            </h1>
            <p className="text-xl text-gray-200 mb-10">
              {slides[currentSlide].subtitle}
            </p>

            {/* SEARCH */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search services..."
                  className="bg-white text-black pl-12 h-14 rounded-xl"
                />
              </div>
              <Button
                onClick={handleSearch}
                className="h-14 px-8 bg-[#FF6633] hover:bg-[#ff5722]"
              >
                Search
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* HERO BUTTONS */}
            <div className="flex justify-center gap-4 mb-8">
              <Link to={createPageUrl("Categories")}>
                <Button className="bg-[#FF6633] text-white px-6 py-3">
                  Find a Service
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* SLIDER ARROWS   Top Rated Professionals*/}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white"
        >
          <ChevronLeft size={26} />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white"
        >
          <ChevronRight size={26} />
        </button>
      </section>

      {/* TRUST STATS */}
      {/* <section className="py-12 bg-white border-y">
        <div className="max-w-6xl mx-auto grid grid-cols-3 text-center">
          <div>
            <h3 className="text-3xl font-bold text-[#FF6633]">2000+</h3>
            <p className="text-gray-600">Verified Providers</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-[#FF6633]">10K+</h3>
            <p className="text-gray-600">Jobs Completed</p>
          </div>
          <div>
            <h3 className="text-3xl font-bold text-[#FF6633]">35+</h3>
            <p className="text-gray-600">Service Categories</p>
          </div>
        </div>
      </section> */}

      {/* JOBS */}
      {/* <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
            Latest Jobs Posted
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-gray-50 p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg text-gray-900 mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-4">Budget: ${job.budget}</p>
                <Link to={createPageUrl(`JobDetails?id=${job.id}`)}>
                  <button className="text-[#FF6633] font-medium">View Job</button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FEATURE Verified Providers */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="bg-white shadow-md rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6633]/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-[#FF6633]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROVIDERS */}
      {/* <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Rated Professionals</h2>
          <p className="text-gray-600 mb-12">Verified providers with excellent ratings</p>
          <FeaturedProviders />
        </div>
      </section> */}

      {/* MAP SECTION */}
      <section className="py-16 bg-[#0A0E1A] text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Find Professionals Near You</h2>
        <p className="text-gray-300 mb-6">Discover trusted providers on the map</p>
        <Link to={createPageUrl("MapSearch")}>
          <Button className="bg-[#FF6633]">
            <MapPin className="mr-2 w-4 h-4" />
            Open Map
          </Button>
        </Link>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse Categories</h2>
              <p className="text-gray-600">Explore services from professionals</p>
            </div>
            <Link to={createPageUrl("Categories")} className="flex items-center gap-2 text-[#FF6633]">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white h-40 rounded-xl shadow animate-pulse" />
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
    </div>
  );
}