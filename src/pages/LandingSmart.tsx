import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogoMark } from '@/components/LogoMark';
import { 
  Bot, Mail, CheckCircle, Building2, ArrowRight, ShieldAlert, Menu, X,
  Sparkles, Brain, Clock, TrendingUp, MessageSquare, Wrench, DollarSign,
  Users, BarChart3, BrainCircuit, Target, Hammer, UserCheck, Layout,
  Calendar, Bell, Moon, Sun, Zap as ZapIcon, Home as HomeIcon, ClipboardList, CreditCard,
  Check, XCircle, AlertTriangle as AlertTriangleIcon, Scale as ScaleIcon, FileText as FileTextIcon, Thermometer as ThermometerIcon, Paintbrush as PaintbrushIcon
} from 'lucide-react';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

// Pain points - emotional drivers from research
const painPoints = [
  {
    icon: Moon,
    text: 'Your phone buzzes at midnight with a "small leak"'
  },
  {
    icon: DollarSign,
    text: 'Chasing rent every month like it\'s your part-time job'
  },
  {
    icon: MessageSquare,
    text: 'Maintenance requests buried in email threads'
  },
  {
    icon: HomeIcon,
    text: 'Vacancies lasting weeks because you can\'t respond fast enough'
  },
  {
    icon: AlertTriangleIcon,
    text: 'Missing compliance deadlines and risking fines'
  },
  {
    icon: ClipboardList,
    text: 'Juggling 4 different apps and spreadsheets'
  }
];

// Feature outcomes with concrete benefits
const featureOutcomes = [
  {
    icon: CreditCard,
    title: 'Rent Collection That Actually Collects',
    description: 'AI automatically sends payment reminders, applies late fees, and processes payments—no awkward conversations required. Tenants pay on time or the system handles the follow-up.',
    result: '94% on-time payment rate without you lifting a finger',
    confidence: 94
  },
  {
    icon: Wrench,
    title: 'Maintenance Requests That Fix Themselves',
    description: 'Tenants report issues via text or app. AI instantly categorizes urgency, dispatches the right vendor, schedules the repair, and updates everyone—while you sleep.',
    result: '3x faster resolution times and tenants who renew',
    confidence: 91
  },
  {
    icon: Users,
    title: 'Vacancy Marketing on Autopilot',
    description: 'When a unit opens, AI instantly posts to multiple platforms, pre-screens applicants, schedules showings, and ranks candidates by your criteria.',
    result: 'Average 12-day fill time vs. industry standard 30+ days',
    confidence: 87
  },
  {
    icon: Layout,
    title: 'The Peace of Mind Dashboard',
    description: 'One screen shows rent status, upcoming renewals, maintenance in progress, and tenant satisfaction. AI flags issues before they become emergencies.',
    result: 'Finally, true passive income',
    confidence: 89
  }
];

// Compliance requirements data
const complianceRisks = [
  {
    icon: Hammer,
    title: 'Good Cause Eviction Law',
    status: 'Auto-Tracked',
    description: 'NYC\'s new law limits rent increases and eviction rights. We track your eligibility automatically.',
    deadline: 'Active Now',
    color: 'red'
  },
  {
    icon: HomeIcon,
    title: 'HPD Registration',
    status: 'Never Miss It',
    description: 'Annual registration for all NYC rentals. Automated reminders save you from $500/unit fines.',
    deadline: 'Annual',
    color: 'amber'
  },
  {
    icon: ScaleIcon,
    title: 'Rent Stabilization',
    status: 'Accurate Tracking',
    description: 'Rent-stabilized units have strict increase caps. We calculate allowable increases automatically.',
    deadline: 'Per Lease',
    color: 'amber'
  },
  {
    icon: FileTextIcon,
    title: 'Local Law 97',
    status: '2025 Ready',
    description: 'Carbon emissions monitoring for buildings. We track your status and alert you to requirements.',
    deadline: '2025',
    color: 'amber'
  },
  {
    icon: ThermometerIcon,
    title: 'Heat Season Compliance',
    status: 'Oct-May',
    description: 'Minimum temps: 68°F (6am-10pm), 62°F (10pm-6am). We track violations proactively.',
    deadline: 'Seasonal',
    color: 'blue'
  },
  {
    icon: PaintbrushIcon,
    title: 'Lead Paint Records',
    status: 'Organized',
    description: 'Pre-1960 buildings: disclosure tracking and remediation records, all in one place.',
    deadline: 'Per Unit',
    color: 'amber'
  }
];

// How it works steps
const howItWorks = [
  {
    step: '01',
    title: 'Connect your properties',
    description: 'Add basic info or upload documents. The AI extracts key dates, lease terms, and tenant details automatically.',
    icon: Building2
  },
  {
    step: '02',
    title: 'Set your preferences',
    description: 'Configure your rules—when to escalate, who to call, how to handle late rent. The AI learns your style.',
    icon: Brain
  },
  {
    step: '03',
    title: 'Let it run',
    description: 'AI handles the day-to-day while you monitor from your dashboard. Review with one click, approve with another.',
    icon: Zap
  }
];

// Testimonials
const testimonials = [
  {
    quote: 'I actually took a vacation last month without checking my phone once. The AI handled two maintenance emergencies and collected rent from all 12 tenants. Game changer.',
    name: 'Marcus T.',
    title: '18-unit portfolio, Austin'
  },
  {
    quote: 'Response time dropped from 2 days to 2 hours. My renewal rate jumped from 65% to 91%. I didn\'t realize how much money I was losing to slow communication.',
    name: 'Sarah K.',
    title: '24-unit portfolio, Denver'
  },
  {
    quote: 'I used to spend 6-8 hours every month chasing late rent. Now I spend zero. The AI is more persistent (and polite) than I ever was.',
    name: 'David R.',
    title: '12-unit portfolio, Phoenix'
  }
];

// Stats
const stats = [
  { value: '16+ hrs', label: 'Saved per month' },
  { value: '94%', label: 'On-time payments' },
  { value: '12 days', label: 'Avg. vacancy fill' },
  { value: '2 min', label: 'Setup time' }
];

export function LandingSmart() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [typingDemo, setTypingDemo] = useState('');
  const [showConfidence, setShowConfidence] = useState(false);

  const demoText = 'Text tenant 3A about the late rent';

  // Typing animation effect
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= demoText.length) {
        setTypingDemo(demoText.slice(0, index));
        index++;
      } else {
        setTimeout(() => setShowConfidence(true), 300);
        clearInterval(timer);
      }
    }, 80);

    return () => clearInterval(timer);
  }, []);

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
    
    // Safe parsing of existing signups
    let existingSignups: Array<{ email: string; timestamp: string; source: string }> = [];
    try {
      const saved = localStorage.getItem('beta_signups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          existingSignups = parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing beta signups:', e);
      existingSignups = [];
    }
    existingSignups.push({
      email,
      timestamp: new Date().toISOString(),
      source: 'ai_landing'
    });
    localStorage.setItem('beta_signups', JSON.stringify(existingSignups));
    
    localStorage.setItem('pending_signup_email', email);
    setShowSuccess(true);
    setTimeout(() => {
      navigate('/signup');
    }, 1500);
  };

  const handleTryFree = () => {
    navigate('/signup');
  };

  const handleSignIn = () => {
    navigate('/login');
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
              <button onClick={() => scrollToSection('pain-points')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">Pain Points</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">How It Works</button>
              <button onClick={() => scrollToSection('compliance')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">Compliance</button>
            </div>

            {/* CTA Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={handleSignIn}
                className="px-5 py-2 text-gray-700 hover:text-[#1E3A5F] font-medium rounded-lg text-sm transition-colors"
              >
                Sign In
              </button>
              <button 
                onClick={handleTryFree}
                className="px-5 py-2 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg text-sm transition-colors"
              >
                Get Started Free
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
                      onClick={() => scrollToSection('pain-points')} 
                      className="w-full mobile-menu-item text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      Pain Points
                    </button>
                    <button 
                      onClick={() => scrollToSection('how-it-works')} 
                      className="w-full mobile-menu-item text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      How It Works
                    </button>
                    <button 
                      onClick={() => scrollToSection('compliance')} 
                      className="w-full mobile-menu-item text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      Compliance
                    </button>
                    <div className="border-t border-gray-200 my-2"></div>
                    <button 
                      onClick={handleSignIn}
                      className="w-full mobile-menu-item text-gray-600 hover:text-[#1E3A5F] hover:bg-gray-50 transition-colors text-left font-medium"
                    >
                      Sign In
                    </button>
                  </nav>
                  
                  {/* Drawer Footer */}
                  <div className="p-4 border-t border-gray-200 safe-area-bottom">
                    <button 
                      onClick={handleTryFree}
                      className="w-full px-5 py-3 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg transition-colors"
                    >
                      Get Started Free
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Hero Section - VERSION 2 */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy - VERSION 2 */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">AI-Powered Property Management</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E3A5F] leading-tight mb-6 tracking-tight">
                Your Properties Run
                <br />
                <span className="text-amber-600">Themselves</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                AI-powered property management that handles the 3 AM calls, chases late rent, and schedules repairs—so you can focus on growing your portfolio (or just getting your weekends back).
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 justify-center lg:justify-start">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>2-minute setup</span>
                </div>
              </div>

              {/* Email Capture Form */}
              <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto lg:mx-0 mb-4">
                {showSuccess ? (
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Great! Redirecting to signup...</span>
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
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-slate-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-amber-500/20"
                    >
                      {isSubmitting ? 'Starting...' : 'Start Automating Free'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </form>
              
              <p className="text-sm text-gray-500">
                Want to sign in instead?{' '}
                <button onClick={handleSignIn} className="text-amber-600 hover:text-amber-700 font-medium underline">
                  Sign in here
                </button>
              </p>
            </div>

            {/* Right: AI Demo - VERSION 2 */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 to-purple-500/20 rounded-3xl blur-2xl opacity-50" />
              
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-sm text-slate-400">Just say what you need...</span>
                  </div>
                </div>

                {/* Demo Content */}
                <div className="p-6 space-y-4">
                  {/* Input */}
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 animate-pulse" />
                    <div className="w-full pl-12 pr-4 py-4 bg-slate-800 rounded-xl text-slate-200 text-lg">
                      {typingDemo}
                      <span className="inline-block w-0.5 h-5 bg-amber-400 animate-pulse ml-0.5" />
                    </div>
                  </div>

                  {/* AI Interpretation */}
                  {showConfidence && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-slate-300">
                            AI understood: 
                            <span className="text-amber-400 font-medium"> Send friendly rent reminder to Unit 3A</span>
                          </span>
                        </div>
                        <div className="mt-2 pl-7">
                          <ConfidenceBadge confidence={94} size="sm" />
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Drafted message</p>
                        <p className="text-sm text-slate-300">
                          Hi there! Just a friendly reminder that your rent payment is due. 
                          If you've already sent it, please disregard. Let me know if you have any questions!
                        </p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Matches your usual tone</span>
                          <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-medium rounded-lg transition-colors">
                            Send Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200">$14.4k</p>
                      <p className="text-xs text-slate-500">Collected</p>
                    </div>
                    
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <Building2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200">6 Units</p>
                      <p className="text-xs text-slate-500">Occupied</p>
                    </div>
                    
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <Brain className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200">94%</p>
                      <p className="text-xs text-slate-500">Match</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section - VERSION 2 (The Hook) */}
      <section id="pain-points" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-4">
              Property Management Wasn't<br />Supposed to Be a Second Job
            </h2>
            <p className="text-lg text-gray-600">
              You got into real estate for passive income—not to become a 24/7 on-call service.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {painPoints.map((pain, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <pain.icon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{pain.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xl font-semibold text-[#1E3A5F]">There's a better way.</p>
          </div>
        </div>
      </section>

      {/* Feature Outcomes Section - VERSION 2 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-full mb-4">
              <BrainCircuit className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">What The AI Does</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">
              More than just another app
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These aren't features to learn—they're outcomes you'll notice immediately.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {featureOutcomes.map((feature, i) => (
              <div key={i} className="group bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-[#1E3A5F]">{feature.title}</h3>
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                        {feature.confidence}%
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                    
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-700 font-medium">{feature.result}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - VERSION 2 */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">How it works</h2>
            <p className="text-gray-600">No setup wizard. No 200 settings. Just intelligent help from day one.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <span className="text-3xl font-bold text-gray-200">{step.step}</span>
                <h3 className="text-lg font-semibold text-[#1E3A5F] mt-2">{step.title}</h3>
                <p className="text-gray-600 text-sm mt-2">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - VERSION 2 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#1E3A5F]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>        
        </div>
      </section>

      {/* Testimonials - VERSION 2 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">What landlords are saying</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-xl">
                <blockquote className="text-gray-700 italic mb-4 text-sm leading-relaxed">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-gray-900 font-semibold text-sm">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section - VERSION 2 */}
      <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-full mb-4">
              <ShieldAlert className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">NYC Compliance Included</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">Never miss a deadline again</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              One missed compliance deadline can cost thousands. The AI tracks every requirement automatically—and alerts you before trouble starts.
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
                    <Clock className="w-3 h-3" />
                    <span>Tracks: {risk.deadline}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA - VERSION 2 */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Bot className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">
            Ready to Get Your Time Back?
          </h2>
          <p className="text-gray-600 mb-8">
            Join landlords who've automated the busywork and rediscovered why they got into real estate.
          </p>
          
          <button
            onClick={handleTryFree}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-colors inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Start Your Free Account
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Free forever
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Cancel anytime
            </span>
          </div>

          <p className="text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <button onClick={handleSignIn} className="text-amber-600 hover:text-amber-700 font-medium">
              Sign in
            </button>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <LogoMark size={32} showWordmark={true} />
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-[#1E3A5F]">Privacy</a>
              <a href="/terms" className="hover:text-[#1E3A5F]">Terms</a>
              <a href="mailto:concierge@landlordbot.app" className="hover:text-[#1E3A5F]">Contact</a>
            </div>
            
            <p className="text-sm text-gray-400">Free for NYC landlords.</p>
          </div>        
        </div>
      </footer>
    </div>
  );
}

export default LandingSmart;
