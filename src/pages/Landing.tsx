import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from '@/components/LogoMark';
import { 
  Bot, Mail, CheckCircle, Building2, ArrowRight, ShieldAlert, AlertTriangle,
  FileText, Scale, Thermometer, Paintbrush, Home, Gavel, Zap, Menu, X
} from 'lucide-react';

// NYC Compliance requirements data
const complianceRisks = [
  {
    icon: Gavel,
    title: 'Good Cause Eviction',
    status: 'High Risk',
    description: 'New statewide law limits rent increases and eviction rights. Non-compliance = lawsuits.',
    deadline: 'Active Now',
    color: 'red'
  },
  {
    icon: Home,
    title: 'HPD Registration',
    status: 'Required',
    description: 'Annual registration due for all NYC rentals. Fines up to $500 per unit for non-compliance.',
    deadline: 'Annual',
    color: 'amber'
  },
  {
    icon: Scale,
    title: 'DHCR Rent Stabilization',
    status: 'Track Every Lease',
    description: 'Rent-stabilized units have strict increase caps. Wrong calculations = penalties.',
    deadline: 'Per Lease',
    color: 'amber'
  },
  {
    icon: FileText,
    title: 'Local Law 97',
    status: '2025 Enforcement',
    description: 'Carbon emissions limits for buildings. Non-compliant = fines + mandated improvements.',
    deadline: '2025',
    color: 'amber'
  },
  {
    icon: Thermometer,
    title: 'Heat Season',
    status: 'Oct 1 - May 31',
    description: 'Minimum 68°F (6am-10pm), 62°F (10pm-6am). Violations = $250-$500/day fines.',
    deadline: 'Seasonal',
    color: 'blue'
  },
  {
    icon: Paintbrush,
    title: 'Lead Paint Remediation',
    status: 'Per Unit',
    description: 'Pre-1960 buildings must disclose lead hazards. Required for child-occupied units.',
    deadline: 'Ongoing',
    color: 'amber'
  }
];

export function Landing() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Track scroll for nav styling
  useEffect(() => {
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    
    setIsSubmitting(true);
    
    // Navigate to signup — Supabase handles persistence
    // Legacy localStorage code removed — was not persisting data
    localStorage.setItem('pending_signup_email', email);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/signup');
    }, 1000);
  };

  const handleTryFree = () => {
    navigate('/signup');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const getStatusColor = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    };
    return colors[color] || colors.amber;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isNavScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <LogoMark size={40} showWordmark={true} />
            </div>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('compliance')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">Risks</button>
              <button onClick={() => scrollToSection('features')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">Features</button>
            </div>

            {/* CTA Button - Desktop */}
            <div className="hidden md:block">
              <button 
                onClick={handleTryFree}
                className="px-5 py-2 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg text-sm transition-colors"
              >
                Try Free
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 touch-target"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu - Slide Out Drawer */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden z-40"
                  onClick={() => setMobileMenuOpen(false)}
                />
                
                {/* Drawer */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 right-0 bottom-0 w-[280px] bg-white shadow-2xl md:hidden z-50 flex flex-col"
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <span className="font-semibold text-[#1E3A5F]">Menu</span>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 text-gray-600 touch-target"
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Drawer Content */}
                  <nav className="flex-1 py-4">
                    <button 
                      onClick={() => scrollToSection('compliance')} 
                      className="w-full mobile-menu-item text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      Risks
                    </button>
                    <button 
                      onClick={() => scrollToSection('features')} 
                      className="w-full mobile-menu-item text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      Features
                    </button>
                  </nav>
                  
                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-gray-200 safe-area-bottom">
                    <button 
                      onClick={handleTryFree}
                      className="w-full px-5 py-3 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg transition-colors"
                    >
                      Try Free
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Urgency Banner — Good Cause Eviction */}
      <div className="bg-amber-500 border-b border-amber-600 pt-20 pb-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-900" />
          <p className="text-amber-900 font-medium text-sm">
            <span className="font-bold">NYC landlords:</span> New Good Cause Eviction law limits your ability to increase rent & evict. 
            <span className="hidden sm:inline"> Track compliance or risk lawsuits.</span>
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section id="hero" className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E3A5F] leading-tight mb-4 tracking-tight">
            By NYC Landlords.<br className="hidden sm:block" />
            <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-blue-600">For NYC Landlords.</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
            The only <strong>NYC property management software</strong> built by a team of property managers who actually deal with Good Cause Eviction, HPD, and DHCR every day. 
            Stop paying $600/year for apps built in Texas that don't even know what Local Law 97 is.
          </p>
          
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            LandlordBot is the <strong className="text-[#1E3A5F]">free</strong> compliance co-pilot built exclusively for New York City.
          </p>

          {/* Email Capture Form */}
          <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto mb-4">
            {showSuccess ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-medium">You're in! Redirecting...</span>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 outline-none transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-red-600/20"
                >
                  {isSubmitting ? 'Getting Started...' : 'Start Tracking Free'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </form>
          
          <p className="text-sm text-gray-500">No credit card. Takes 2 minutes. Built by NYC property managers, for NYC landlords.</p>
        </div>
      </section>

      {/* Compliance Risk Grid */}
      <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full mb-4">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">6 Tracked Compliance Risks</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">NYC Compliance Requirements for Property Managers</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Miss any of these and you're exposing yourself to fines, lawsuits, or lost rental income. 
              LandlordBot tracks them all.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceRisks.map((risk, i) => {
              const colors = getStatusColor(risk.color);
              return (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <risk.icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                      {risk.status}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-[#1E3A5F] mb-2">{risk.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 min-h-[60px]">{risk.description}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3" />
                    <span>Deadline: {risk.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#1E3A5F]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '$340', label: 'Late fees recovered/mo' },
              { value: '3hrs', label: 'Time saved weekly' },
              { value: '100%', label: 'Free forever' },
              { value: 'NYC', label: 'Built for local law' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>        
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">NYC Property Management Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your rental business — all free, no limits.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: 'AI Tenant Messaging', desc: 'Auto-respond to common questions. Available 24/7.' },
              { icon: FileText, title: 'Lease Tracking', desc: 'Never miss a renewal. Automated reminders at 90, 60, 30 days.' },
              { icon: Zap, title: 'Rent Collection', desc: 'Track payments, auto-late fees, send reminders.' },
              { icon: Building2, title: 'Unlimited Units', desc: 'One unit or one hundred. Same price: free.' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <feature.icon className="w-8 h-8 text-[#1E3A5F] mb-4" />
                <h3 className="font-semibold text-[#1E3A5F] mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">Don't get caught off guard</h2>
          <p className="text-gray-600 mb-8">
            Join NYC landlords who track every deadline, stay compliant, and sleep better at night.
          </p>
          <button
            onClick={handleTryFree}
            className="px-8 py-4 bg-[#1E3A5F] hover:bg-[#152942] text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500 mt-4">Built by a team of NYC property managers, for NYC landlords. Free forever.</p>        
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-[#1E3A5F]">LandlordBot</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-[#1E3A5F]">Privacy</a>
              <a href="/terms" className="hover:text-[#1E3A5F]">Terms</a>
              <a href="mailto:concierge@landlordbot.app" className="hover:text-[#1E3A5F]">Contact</a>
            </div>
            <p className="text-sm text-gray-400">© 2026 LandlordBot. Built by NYC property managers.</p>
          </div>        
        </div>
      </footer>
    </div>
  );
}


export default Landing;
