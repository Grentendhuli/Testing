import { lazy } from 'react';

// Public Pages
export const Landing = lazy(() => import('./Landing'));
export const LandingSmart = lazy(() => import('./LandingSmart'));
export const Pricing = lazy(() => import('./Pricing'));
export const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
export const TermsOfService = lazy(() => import('./TermsOfService'));
export const EULA = lazy(() => import('./EULA'));
export const ForgotPassword = lazy(() => import('./ForgotPassword'));
export const NotFound = lazy(() => import('./NotFound'));

// Protected Pages
export const Dashboard = lazy(() => import('./Dashboard'));
export const DashboardSmart = lazy(() => import('./DashboardSmart'));
export const Units = lazy(() => import('./Units'));
export const RentCollection = lazy(() => import('./RentCollection'));
export const Leases = lazy(() => import('./Leases'));
export const Leads = lazy(() => import('./Leads'));
export const Messages = lazy(() => import('./Messages'));
export const Reports = lazy(() => import('./Reports'));
export const Config = lazy(() => import('./Config'));
export const Profile = lazy(() => import('./Profile'));
export const Billing = lazy(() => import('./Billing'));
export const LandlordAssistant = lazy(() => import('./LandlordAssistant'));
export const NYCCompliance = lazy(() => import('./NYCCompliance'));
export const MarketInsights = lazy(() => import('./MarketInsights'));
export const Recommendations = lazy(() => import('./Recommendations'));
export const Listings = lazy(() => import('./Listings'));
export const MaintenanceSmart = lazy(() => import('./MaintenanceSmart'));
