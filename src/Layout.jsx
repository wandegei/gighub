import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { supabase } from "@/lib/supabaseClient";
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  User, 
  Briefcase, 
  Wallet, 
  Image, 
  FileText, 
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Bell,
  Settings,
  MessageSquare
} from 'lucide-react';
import NotificationBell from './components/notifications/NotificationBell';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isDashboard = currentPageName?.toLowerCase().startsWith('dashboard');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUser(user);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    }
  } catch (error) {
    console.log("Not authenticated");
  } finally {
    setLoading(false);
  }
};

  const handleLogout = async () => {
  await supabase.auth.signOut();
  window.location.href = "/";
};

  const sidebarLinks = [
    { name: 'Overview', icon: LayoutDashboard, page: 'Dashboard' },
    { name: 'Profile', icon: User, page: 'DashboardProfile' },
    { name: 'Services', icon: Briefcase, page: 'DashboardServices', providerOnly: true },
    { name: 'Portfolio', icon: Image, page: 'DashboardPortfolio', providerOnly: true },
    { name: 'Reviews', icon: Settings, page: 'DashboardReviews', providerOnly: true },
    { name: 'AI Assistant', icon: Settings, page: 'AIAssistant', providerOnly: true },
    { name: 'Verification', icon: Settings, page: 'DashboardVerification', providerOnly: true },
    { name: 'Wallet', icon: Wallet, page: 'DashboardWallet' },
    { name: 'Jobs', icon: Briefcase, page: 'DashboardJobs' },
    { name: 'Orders', icon: FileText, page: 'DashboardOrders', providerOnly: true },
    { name: 'Messages', icon: MessageSquare, page: 'Messages' },
    { name: 'Notifications', icon: Bell, page: 'DashboardNotifications' },
  ];

  const filteredSidebarLinks = sidebarLinks.filter(link => {
    if (link.providerOnly && profile?.user_type !== 'provider') return false;
    return true;
  });

  if (isDashboard) {
    return (
      <div className="min-h-screen bg-[#3a4e8a] flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#2d395e] border-r border-[#2A2D3E]">
          <div className="flex flex-col flex-1 min-h-0 pt-6">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 px-6 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-xl font-bold text-white">GigHub</span>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
              {filteredSidebarLinks.map((link) => {
                const isActive = currentPageName === link.page;
                return (
                  <Link
                    key={link.page}
                    to={createPageUrl(link.page)}
                    className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                  >
                    <link.icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Info  */}
            <div className="p-4 border-t border-[#2A2D3E]">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1A1D2E]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                    <span className="text-white font-semibold">
                      {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <NotificationBell userEmail={user?.email} />
                <button onClick={handleLogout} className="text-gray-500 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header for Dashboard */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#607bca] border-b border-[#2A2D3E]">
          <div className="flex items-center justify-between px-4 h-16">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                <span className="text-white font-bold">G</span>
              </div>
              <span className="text-lg font-bold text-white">GigHub</span>
            </Link>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="bg-[#3b5191] border-b border-[#2A2D3E] px-4 pb-4">
              <nav className="space-y-1">
                {filteredSidebarLinks.map((link) => {
                  const isActive = currentPageName === link.page;
                  return (
                    <Link
                      key={link.page}
                      to={createPageUrl(link.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
                    >
                      <link.icon className="w-5 h-5" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
                <button onClick={handleLogout} className="sidebar-link w-full text-red-400">
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>
          )}
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="pt-16 lg:pt-0 min-h-screen">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Public Layout
  return (
    <div className="min-h-screen bg-[#455ca0] flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F1117]/95 backdrop-blur-md border-b border-[#2A2D3E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <span className="text-xl font-bold text-white">GigHub</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to={createPageUrl('Home')} className="text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link to={createPageUrl('Discover')} className="text-gray-400 hover:text-white transition-colors">
                Discover
              </Link>
              <Link to={createPageUrl('MapSearch')} className="text-gray-400 hover:text-white transition-colors">
                Map Search
              </Link>
              <Link to={createPageUrl('JobPostings')} className="text-gray-400 hover:text-white transition-colors">
                Find Jobs
              </Link>
              <Link to={createPageUrl('Messages')} className="text-gray-400 hover:text-white transition-colors">
                Messages
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-[#1A1D2E] animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#1A1D2E] transition-colors">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm font-semibold">
                            {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#1A1D2E] border-[#2A2D3E]">
                    <div className="px-3 py-2 border-b border-[#2A2D3E]">
                      <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Dashboard')} className="cursor-pointer text-gray-300 hover:text-white">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('DashboardProfile')} className="cursor-pointer text-gray-300 hover:text-white">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('DashboardWallet')} className="cursor-pointer text-gray-300 hover:text-white">
                        <Wallet className="w-4 h-4 mr-2" />
                        Wallet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#2A2D3E]" />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:text-red-300">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = "/login"}
                    className="text-gray-400 hover:text-white hover:bg-transparent"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => window.location.href = "/login"}
                    className="btn-primary"
                  >
                    Get Started
                  </Button>
                </>
              )}

              {/* Mobile Menu */}
              <button 
                className="md:hidden text-white ml-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Nav  profile */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-[#2A2D3E]">
              <nav className="flex flex-col gap-2">
                <Link 
                  to={createPageUrl('Home')} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Home
                </Link>
                <Link 
                  to={createPageUrl('Categories')} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Categories
                </Link>
                <Link 
                  to={createPageUrl('Providers')} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Providers
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 lg:pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#0F1117] border-t border-[#2A2D3E] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6633] to-[#E55A2B] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">G</span>
                </div>
                <span className="text-xl font-bold text-white">GigHub</span>
              </div>
              <p className="text-gray-500 text-sm">
                Connect with skilled professionals for all your service needs.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2">
                <li><Link to={createPageUrl('Categories')} className="text-gray-500 hover:text-white text-sm">Browse Categories</Link></li>
                <li><Link to={createPageUrl('Providers')} className="text-gray-500 hover:text-white text-sm">Find Providers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm">About Us</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-500 hover:text-white text-sm">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-500 hover:text-white text-sm">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-[#2A2D3E] text-center">
            <p className="text-gray-500 text-sm">© 2026 GigHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}