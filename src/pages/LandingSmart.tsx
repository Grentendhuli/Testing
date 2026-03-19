import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/LogoMark';
import { 
  Bot, Mail, CheckCircle, Building2, ArrowRight, ShieldAlert, AlertTriangle,
  FileText, Scale, Thermometer, Paintbrush, Home, Gavel, Zap, Menu, X,
  Sparkles, Brain, Clock, TrendingUp, MessageSquare, Wrench, DollarSign,
  Users, Percent, BarChart3, BrainCircuit, UserCheck, Target, Award,
  Hammer, Check, XCircle, Layout
} from 'lucide-react';
import { ConfidenceBadge } from '../components/ConfidenceBadge';

// AI features data
const aiFeatures = [
  {
    icon: Brain,
    title: 'AI Property Manager',
    description: 'Autopilot for routine tasks. The AI learns your preferences and handles repetitive work automatically.',
    demo: 'Auto-sorted 12 maintenance requests by priority',
    confidence: 92
  },
  {
    icon: Clock,
    title: 'Predictive Alerts',
    description: 'Know before problems happen. AI monitors patterns and warns you about late payments, maintenance issues, and lease expirations.',
    demo: 'Predicted 3 late payments with 89% accuracy',
    confidence: 89
  },
  {
    icon: MessageSquare,
    title: 'Smart Messaging',
    description: 'Natural language commands. Just say "Text tenant 4A about late rent" and the AI does the rest — with the right tone.',
    demo: 'Sent personalized messages to 5 tenants',
    confidence: 94
  },
  {
    icon: BarChart3,
    title: 'Intelligent Insights',
    description: 'AI analyzes your portfolio and suggests optimizations — rent adjustments, lease timing, and cost savings.',
    demo: 'Identified $3,600/year in rent optimization',
    confidence: 87
  }
];

// Compliance requirements data
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

export function LandingSmart() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [typingDemo, setTypingDemo] = useState('');
  const [showConfidence, setShowConfidence] = useState(false);

  const demoText = "Text tenant 3A about late rent";

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
              <button onClick={() => scrollToSection('ai-features')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">AI Features</button>
              <button onClick={() => scrollToSection('compliance')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">Compliance</button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium">How It Works</button>
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
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollToSection('ai-features')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium text-left">AI Features</button>
                <button onClick={() => scrollToSection('compliance')} className="text-gray-600 hover:text-[#1E3A5F] transition-colors text-sm font-medium text-left">Compliance</button>
                <button onClick={() => setMobileMenuOpen(false)} className="px-5 py-2 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg text-sm transition-colors w-full">
                  Try Free
                </button>
              </div>
            </div>
          )}
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
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full mb-6">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">By landlords, for landlords</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1E3A5F] leading-tight mb-6 tracking-tight">
                Property management
                <br />
                <span className="text-amber-600">by people who've done the job.</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-4 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                <strong className="text-[#1E3A5F]">Built by a NYC property manager</strong> with 10+ years, 700+ tenants, and 20+ staff under their belt. 
                Simplicity powered by AI — not corporate nonsense.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 justify-center lg:justify-start">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Free forever</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>AI-powered</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>NYC-compliant</span>
                </div>
              </div>

              {/* Email Capture Form */}
              <form onSubmit={handleEmailSubmit} className="max-w-md mx-auto lg:mx-0 mb-4">
                {showSuccess ? (
                  <div className="flex items-center justify-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">AI powered up! Redirecting...</span>
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
                      {isSubmitting ? 'Powering up AI...' : 'Get AI Assistant Free'}
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </form>
              
              <p className="text-sm text-gray-500">No credit card. Takes 2 minutes. Built by a landlord, for landlords.</p>
            </div>

            {/* Right: AI Demo */}
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
                    <span className="text-sm text-slate-400">AI Command Palette</span>
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
                            <span className="text-amber-400 font-medium">Send payment reminder to tenant in Unit 3A</span>
                          </span>
                        </div>
                        <div className="mt-2 pl-7">
                          <ConfidenceBadge confidence={94} size="sm" />
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="mt-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Preview message</p>
                        <p className="text-sm text-slate-300">
                          Hi there! Just a friendly reminder that your rent payment of $2,400 was due on the 1st. 
                          If you've already sent it, please disregard. Let me know if you have any questions!
                        </p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Matches your typical tone with Sarah</span>
                          <button className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-medium rounded-lg transition-colors">
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200">$14,400</p>
                      <p className="text-xs text-slate-500">Monthly</p>
                    </div>
                    
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <Building2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200">6 Units</p>
                      <p className="text-xs text-slate-500">Occupied</p>
                    </div>
                    
                    <div className="p-3 bg-slate-800/50 rounded-lg text-center">
                      <Brain className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200">94%</p>
                      <p className="text-xs text-slate-500">AI Confident</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* By Landlords, For Landlords Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full mb-6">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">The Software We'd Actually Use</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">Built to solve <span className="text-amber-600">real</span> landlord headaches</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Not another bloated tool built by people who've never collected rent. 
              LandlordBot was created by someone who actually lived the problem — then infused it with AI to make the job easier.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden mb-12">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {/* Corporate Tools */}
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Layout className="w-5 h-5 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600">Corporate Tools</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Built by generic software teams',
                    'Features you\'ll never use',
                    'AI bolted on as buzzword',
                    '200+ settings to "configure"',
                    'Complex workflows you hate',
                    'Support from someone in a call center'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-gray-500">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* LandlordBot */}
              <div className="p-8 bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#1E3A5F]">LandlordBot</h3>
                </div>
                <ul className="space-y-4">
                  {[
                    'Built by a property manager with 10+ years experience',
                    'Features we actually needed (700+ tenants later)',
                    'AI designed for rent collection, not marketing',
                    'Works out of the box from Day 1',
                    'Simple workflows that feel natural',
                    'Support from someone who\'s been there'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Social Proof Block */}
          <div className="bg-[#1E3A5F] rounded-2xl p-8 md:p-12 text-center">
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {[
                { value: '10+', label: 'Years Experience' },
                { value: '700+', label: 'Tenants Managed' },
                { value: '20+', label: 'Staff Supervised' },
              ].map((stat, i) => (
                <div key={i} className="px-6 py-4 bg-white/10 rounded-xl">
                  <div className="text-3xl font-bold text-amber-400 mb-1">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
            
            <blockquote className="text-xl text-white/90 italic mb-6 max-w-2xl mx-auto">
              "Finally, someone built property management software who actually understands the panic of a 2 AM emergency leak. 
              The AI features don't feel gimmicky — they feel like having a really good assistant who never sleeps."
            </blockquote>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                L
              </div>
              <div className="text-left">
                <div className="text-white font-semibold">LandlordBot Team</div>
                <div className="text-white/60 text-sm">Property Management Assistant <span className="text-amber-400">• Serving NYC Landlords</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai-features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-full mb-4">
              <BrainCircuit className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">AI-Powered Features</span>
            </div>
            
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">Let AI handle the tedious stuff</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI learns your preferences and handles repetitive property management automatically. 
              You stay in control — the AI just makes it effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {aiFeatures.map((feature, i) => (
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
                    
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs text-gray-500">Example:</span>
                        <span className="text-xs text-gray-700 font-medium">{feature.demo}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">How it works</h2>
            <p className="text-gray-600">From setup to AI-powered management in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add your properties',
                description: 'Enter basic info or upload documents. AI extracts unit details, lease terms, and tenant info automatically.',
                icon: Building2
              },
              {
                step: '02',
                title: 'AI learns your style',
                description: 'The AI observes your decisions and preferences. Within days, it starts making smart suggestions tailored to you.',
                icon: Brain
              },
              {
                step: '03',
                title: 'Automate the tedious',
                description: 'Set up autopilot for routine tasks. Get proactive alerts. Handle exceptions with one click or a simple command.',
                icon: Zap
              }
            ].map((step, i) => (
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

      {/* Compliance Risk Grid */}
      <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full mb-4">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-700 font-medium">6 Tracked Compliance Risks</span>
            </div>
            
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">What you're required to track</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Miss any of these and you're exposing yourself to fines, lawsuits, or lost rental income. 
              <strong>LandlordBot's AI tracks them all.</strong>
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

      {/* Social Proof with AI Hours Saved */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#1E3A5F]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '8.5', label: 'Hours saved / week with AI' },
              { value: '94%', label: 'AI prediction accuracy' },
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">More than compliance</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything you need to run your rental business — with AI superpowers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Bot, title: 'AI Command Center', desc: 'Natural language commands. Just say what you want.' },
              { icon: FileText, title: 'Smart Lease Tracking', desc: 'AI predicts renewal issues and drafts offers.' },
              { icon: Zap, title: 'Auto Rent Collection', desc: 'Smart reminders, auto-late fees, payment tracking.' },
              { icon: Building2, title: 'Unlimited Units', desc: 'One unit or one hundred. Same price: free.' },
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-gray-50 rounded-xl border border-gray-100">
                <feature.icon className="w-8 h-8 text-amber-500 mb-4" />
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
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Bot className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">Ready to work smarter? Get your AI property manager.</h2>
          <p className="text-gray-600 mb-8">
            Join NYC landlords who save 8+ hours per week with AI automation.
          </p>
          
          <button
            onClick={handleTryFree}
            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl transition-colors inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-sm text-gray-500 mt-4">Built by NYC landlords, for NYC landlords. Free forever.</p>        
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <img
                  src="/brand/landlordbot-logo.svg"
                  alt="LandlordBot AI"
                  className="w-6 h-6"
                />
              </div>
              <span className="font-bold text-[#1E3A5F]">LandlordBot</span>
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">AI</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-[#1E3A5F]">Privacy</a>
              <a href="/terms" className="hover:text-[#1E3A5F]">Terms</a>
              <a href="mailto:concierge@landlordbot.app" className="hover:text-[#1E3A5F]">Contact</a>
            </div>
            
            <p className="text-sm text-gray-400">© 2026 LandlordBot. Built in NYC with AI.</p>
          </div>        
        </div>
      </footer>
    </div>
  );
}

export default LandingSmart;

