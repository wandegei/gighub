/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import Categories from './pages/Categories';
import CategoryProviders from './pages/CategoryProviders';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';
import DashboardJobs from './pages/DashboardJobs';
import DashboardNotifications from './pages/DashboardNotifications';
import DashboardOrders from './pages/DashboardOrders';
import DashboardPortfolio from './pages/DashboardPortfolio';
import DashboardProfile from './pages/DashboardProfile';
import DashboardReviews from './pages/DashboardReviews';
import DashboardServices from './pages/DashboardServices';
import DashboardVerification from './pages/DashboardVerification';
import DashboardWallet from './pages/DashboardWallet';
import Discover from './pages/Discover';
import Home from './pages/Home';
import JobDetail from './pages/JobDetail';
import JobPostingDetail from './pages/JobPostingDetail';
import JobPostings from './pages/JobPostings';
import Login from './pages/Login';   // 👈 ADD THIS
import MapSearch from './pages/MapSearch';
import Messages from './pages/Messages';
import PostJob from './pages/PostJob';
import Pricing from './pages/Pricing';
import ReferralRedirect from './pages/ReferralRedirect';
import ProviderProfile from './pages/ProviderProfile';
import MyReferrals from './pages/MyReferrals';
import Providers from './pages/Providers';
import AdminDashboard from './pages/AdminDashboard';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import AboutUs from './Pages/AboutUs';
import ServiceDetail from './pages/ServiceDetail';
import __Layout from './Layout.jsx';

export const PAGES = {
    "AIAssistant": AIAssistant,
    "Categories": Categories,
    "CategoryProviders": CategoryProviders,
    "CompleteProfile": CompleteProfile,
    "Dashboard": Dashboard,
    "MyReferrals": MyReferrals,
    "ReferralRedirect": ReferralRedirect,
    "DashboardJobs": DashboardJobs,
    "DashboardNotifications": DashboardNotifications,
    "DashboardOrders": DashboardOrders,
    "DashboardPortfolio": DashboardPortfolio,
    "DashboardProfile": DashboardProfile,
    "DashboardReviews": DashboardReviews,
    "DashboardServices": DashboardServices,
    "DashboardVerification": DashboardVerification,
    "DashboardWallet": DashboardWallet,
    "Discover": Discover,
    "Home": Home,
    "JobDetail": JobDetail,
    "JobPostingDetail": JobPostingDetail,
    "JobPostings": JobPostings,
    "Login": Login,
    "MapSearch": MapSearch,
    "Messages": Messages,
    "ContactUs": ContactUs,
    "PrivacyPolicy": PrivacyPolicy,
    "Terms": Terms,
    "AboutUs": AboutUs,
    "AdminDashboard": AdminDashboard,
    "PostJob": PostJob,
    "Pricing": Pricing,
    "ProviderProfile": ProviderProfile,
    "Providers": Providers,
    "ServiceDetail": ServiceDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};