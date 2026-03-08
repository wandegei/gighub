import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '../utils'
import { supabase } from '@/lib/supabaseClient'
import { Search, ArrowRight, Shield, Wallet, Users, ChevronRight, Briefcase, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import CategoryCard from '../components/categories/CategoryCard'
import FeaturedProviders from '../components/featured/FeaturedProviders'

export default function Home() {

const [categories, setCategories] = useState([])
const [loading, setLoading] = useState(true)
const [searchQuery, setSearchQuery] = useState('')
const [currentSlide, setCurrentSlide] = useState(0)

useEffect(() => {
loadCategories()
}, [])

const slides = [
{
image:"https://images.unsplash.com/photo-1581092335397-9583eb92d232",
title:"Find Skilled Professionals",
subtitle:"Connect with trusted service providers instantly"
},
{
image:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
title:"Hire Builders For Any Project",
subtitle:"Get quality work from verified professionals"
},
{
image:"https://images.unsplash.com/photo-1581578731548-c64695cc6952",
title:"Professional Cleaning Services",
subtitle:"Reliable cleaners ready to help"
},
{
image:"https://images.unsplash.com/photo-1503951914875-452162b0f3f1",
title:"Barbers & Personal Services",
subtitle:"Book experienced professionals near you"
}
]

/* AUTO SLIDER */

useEffect(()=>{

const interval=setInterval(()=>{
setCurrentSlide(prev=>(prev+1)%slides.length)
},5000)

return()=>clearInterval(interval)

},[])

/* CONTROLS */

const nextSlide=()=>{
setCurrentSlide(prev=>(prev+1)%slides.length)
}

const prevSlide=()=>{
setCurrentSlide(prev=>prev===0?slides.length-1:prev-1)
}

const loadCategories=async()=>{

const {data,error}=await supabase
.from('categories')
.select('*')
.order('created_at',{ascending:false})
.limit(8)

if(error){
console.error(error)
}else{
setCategories(data)
}

setLoading(false)

}

const features=[
{
icon:Shield,
title:'Secure Escrow',
description:'Your payment stays protected until the job is completed'
},
{
icon:Users,
title:'Verified Providers',
description:'Connect with trusted professionals in your area'
},
{
icon:Wallet,
title:'Easy Payments',
description:'Pay easily with secure mobile payment systems'
}
]

return (

<div className="min-h-screen bg-gray-50">

{/* HERO */}

<section className="relative h-[90vh] overflow-hidden">

{slides.map((slide,index)=>(

<div
key={index}
className={`absolute inset-0 transition-opacity duration-1000 ${index===currentSlide?'opacity-100':'opacity-0'}`}
>

<img src={slide.image} className="w-full h-full object-cover"/>

<div className="absolute inset-0 bg-black/40"/>

</div>

))}

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

<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>

<Input
value={searchQuery}
onChange={(e)=>setSearchQuery(e.target.value)}
placeholder="Search services..."
className="bg-white text-black pl-12 h-14 rounded-xl"
/>

</div>

<Link to={createPageUrl(`Categories${searchQuery?`?search=${searchQuery}`:''}`)}>

<Button className="h-14 px-8 bg-[#FF6633] hover:bg-[#ff5722]">

Search
<ArrowRight className="ml-2 w-5 h-5"/>

</Button>

</Link>

</div>

{/* HERO ACTION BUTTONS */}

<div className="flex justify-center gap-4 mb-8">

<Button className="bg-[#FF6633] text-white px-6 py-3">
Find a Service
</Button>

<Button className="bg-white text-black px-6 py-3">
Post a Job
</Button>

</div>

{/* POPULAR */}

<div className="flex flex-wrap justify-center gap-3">

{['Mechanics','Builders','Cleaners','Barbers'].map(cat=>(

<Link
key={cat}
to={createPageUrl(`CategoryProviders?slug=${cat.toLowerCase()}`)}
className="px-4 py-2 rounded-full bg-white text-gray-800 shadow hover:bg-gray-100"
>

{cat}

</Link>

))}

</div>

</div>

</div>

{/* ARROWS */}

<button
onClick={prevSlide}
className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white"
>
<ChevronLeft size={26}/>
</button>

<button
onClick={nextSlide}
className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 p-3 rounded-full text-white"
>
<ChevronRight size={26}/>
</button>

</section>

{/* LIVE JOBS */}

<section className="py-16 bg-white">

<div className="max-w-7xl mx-auto px-6">

<h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
Latest Jobs Posted
</h2>

<div className="grid md:grid-cols-3 gap-6">

{[
{title:"Fix leaking sink",price:"$40"},
{title:"House cleaning",price:"$70"},
{title:"Home haircut service",price:"$20"}
].map((job,index)=>(

<div key={index} className="bg-gray-50 p-6 rounded-xl shadow-sm">

<h3 className="font-semibold text-lg text-gray-900 mb-2">
{job.title}
</h3>

<p className="text-gray-600 mb-4">
Budget: {job.price}
</p>

<button className="text-[#FF6633] font-medium">
View Job
</button>

</div>

))}

</div>

</div>

</section>

{/* FEATURES */}

<section className="py-16 bg-gray-100">

<div className="max-w-7xl mx-auto px-6">

<div className="grid md:grid-cols-3 gap-6">

{features.map((feature,index)=>(

<div key={index} className="bg-white shadow-md rounded-2xl p-6 text-center">

<div className="w-14 h-14 rounded-2xl bg-[#FF6633]/10 flex items-center justify-center mx-auto mb-4">

<feature.icon className="w-7 h-7 text-[#FF6633]"/>

</div>

<h3 className="text-lg font-semibold text-gray-900 mb-2">
{feature.title}
</h3>

<p className="text-gray-600 text-sm">
{feature.description}
</p>

</div>

))}

</div>

</div>

</section>

{/* FEATURED PROVIDERS */}

<section className="py-16 bg-white">

<div className="max-w-7xl mx-auto px-6">

<div className="text-center mb-12">

<h2 className="text-3xl font-bold text-gray-900 mb-4">
Top Rated Professionals
</h2>

<p className="text-gray-600">
Verified providers with excellent ratings
</p>

</div>

<FeaturedProviders/>

</div>

</section>

{/* CATEGORIES */}

<section className="py-16 bg-gray-100">

<div className="max-w-7xl mx-auto px-6">

<div className="flex justify-between mb-10">

<div>

<h2 className="text-3xl font-bold text-gray-900 mb-2">
Browse Categories
</h2>

<p className="text-gray-600">
Explore services from professionals
</p>

</div>

<Link
to={createPageUrl('Categories')}
className="flex items-center gap-2 text-[#FF6633]"
>

View All
<ChevronRight size={16}/>

</Link>

</div>

{loading? (

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

{[...Array(8)].map((_,i)=>(
<div key={i} className="bg-white h-40 rounded-xl shadow animate-pulse"/>
))}

</div>

):(

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

{categories.map(category=>(
<CategoryCard key={category.id} category={category}/>
))}

</div>

)}

</div>

</section>

</div>

)

}