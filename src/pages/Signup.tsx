import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { analytics } from '../utils/analytics';
import { Mail, User, Phone, Home, CheckCircle, AlertCircle, Lock, Eye, EyeOff, MapPin, Shield, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { LogoMark } from '@/components/LogoMark';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Microsoft Icon Component
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23">
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#00a4ef" d="M12 1h10v10H12z" />
    <path fill="#7fba00" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

// Building Illustration SVG
const BuildingIllustration = () => (
  <svg viewBox="0 0 400 300" className="w-full h-auto max-w-[280px] mx-auto">
    {/* Three buildings */}
    {/* Left building - smaller */}
    <rect x="40" y="140" width="70" height="120" fill="#2D5A87" rx="4" />
    <rect x="50" y="155" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="70" y="155" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="90" y="155" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="50" y="180" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="70" y="180" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="90" y="180" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="50" y="205" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="70" y="205" width="12" height="15" fill="#4A7DB5" rx="1" />
    <rect x="90" y="205" width="12" height="15" fill="#4A7DB5" rx="1" />
    
    {/* Center building - tallest */}
    <rect x="130" y="80" width="90" height="180" fill="#1E3A5F" rx="4" />
    <rect x="145" y="100" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="170" y="100" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="195" y="100" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="145" y="135" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="170" y="135" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="195" y="135" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="145" y="170" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="170" y="170" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="195" y="170" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="145" y="205" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="170" y="205" width="15" height="20" fill="#3D5A80" rx="2" />
    <rect x="195" y="205" width="15" height="20" fill="#3D5A80" rx="2" />
    
    {/* Gold location pin above center building */}
    <g transform="translate(175, 35)">
      <path
        d="M0 35c-8-8-15-18-15-27 0-15 12-27 27-27s27 12 27 27c0 9-7 19-15 27-7 7-12 12-12 12s-5-5-12-12z"
        fill="#F59E0B"
      />
      <circle cx="0" cy="8" r="8" fill="#FCD34D" />
      <circle cx="0" cy="8" r="4" fill="#F59E0B" />
    </g>
    
    {/* Right building - medium */}
    <rect x="240" y="110" width="80" height="150" fill="#2D5A87" rx="4" />
    <rect x="253" y="125" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="273" y="125" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="293" y="125" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="253" y="153" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="273" y="153" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="293" y="153" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="253" y="181" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="273" y="181" width="14" height="18" fill="#4A7DB5" rx="1" />
    <rect x="293" y="181" width="14" height="18" fill="#4A7DB5" rx="1" />
    
    {/* Ground line */}
    <rect x="20" y="260" width="360" height="8" fill="#3D5A80" rx="4" />
  </svg>
);

// Feature bullet for left panel
const FeatureBullet = ({ icon: Icon, text }: { icon: typeof CheckCircle; text: string }) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
      <Icon className="w-4 h-4 text-[#F59E0B]" />
    </div>
    <span className="text-sm text-white/90">{text}</span>
  </div>
);

// Step Indicator
const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {steps.map((label, index) => {
      const stepNumber = index + 1;
      const isActive = stepNumber === currentStep;
      const isCompleted = stepNumber < currentStep;
      
      return (
        <div key={stepNumber} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isActive
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                stepNumber
              )}
            </div>
            <span
              className={`text-xs mt-1 ${
                isActive ? 'text-[#1E3A5F] dark:text-[#4A7DB5] font-medium' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 ${
                stepNumber < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          )}
        </div>
      );
    })}
  </div>
);

// Green checkmark badge
const GreenCheckBadge = ({ text }: { text: string }) => (
  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full">
    <CheckCircle className="w-4 h-4 text-emerald-500" />
    <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{text}</span>
  </div>
);

export function Signup() {
  const navigate = useNavigate();
  const { signInWithGoogle, signInWithMicrosoft, isAuthenticated, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Extended form data with new step order
  const [formData, setFormData] = useState({
    propertyAddress: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const stepLabels = ['Property', 'Account', 'Profile'];

  // Track page view and signup funnel start
  useEffect(() => {
    analytics.trackPageView('/signup', 'Signup Page');
    analytics.trackEvent('signup_started', { step: 1, method: 'email' });
    analytics.trackFunnelStep('signup', 1, 'landing_view');
  }, []);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setError('');
    setMessage('');
  };

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  const validatePropertyAddress = (address: string): boolean => {
    return address.length >= 10;
  };

  // Step 1 validation - Property Address
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.propertyAddress) {
      errors.propertyAddress = 'Property address is required';
    } else if (!validatePropertyAddress(formData.propertyAddress)) {
      errors.propertyAddress = 'Please enter a complete address (at least 10 characters)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 2 validation - Email + Password
  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 3 validation - First/Last/Phone
  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.phoneNumber) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number (at least 10 digits)';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
    setFieldErrors({});
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep3()) {
      return;
    }

    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            property_address: formData.propertyAddress,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Create user profile in users table - removed bot_phone_number
        const { error: insertError } = await (supabase as any)
          .from('users')
          .upsert(
            {
              id: authData.user.id,
              email: formData.email,
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone_number: formData.phoneNumber,
              property_address: formData.propertyAddress,
              subscription_tier: 'free',
              subscription_status: 'active',
              max_units: -1,
              storage_used: 0,
              storage_limit: 1073741824,
            },
            { onConflict: 'id' }
          );

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }

        // Create initial unit from property address
        try {
          const { error: unitError } = await (supabase as any)
            .from('units')
            .insert({
              user_id: authData.user.id,
              address: formData.propertyAddress,
              unit_number: '1',
              status: 'vacant',
              rent_amount: 0,
              bedrooms: 0,
              bathrooms: 0,
              square_feet: 0,
            });

          if (unitError) {
            console.error('Error creating initial unit:', unitError);
          } else {
            console.log('Initial unit created successfully');
          }
        } catch (unitErr) {
          console.error('Exception creating initial unit:', unitErr);
        }

        analytics.trackEvent('signup_complete', {
          method: 'email',
          email_domain: formData.email.split('@')[1],
          has_property_address: !!formData.propertyAddress,
          has_phone: !!formData.phoneNumber,
        });
        analytics.identifyUser(authData.user.id, {
          email: formData.email,
          subscription_tier: 'free',
          subscription_status: 'active',
          signup_method: 'email',
        });
        analytics.trackFunnelStep('signup', 3, 'user_created');

        setMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setMessage('');
    setIsGoogleLoading(true);
    analytics.trackEvent('signup_started', { method: 'google' });

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      analytics.trackEvent('signup_failed', { method: 'google', error: err.message });
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError('');
    setMessage('');
    setIsMicrosoftLoading(true);
    analytics.trackEvent('signup_started', { method: 'microsoft' });

    try {
      await signInWithMicrosoft();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Microsoft');
      analytics.trackEvent('signup_failed', { method: 'microsoft', error: err.message });
      setIsMicrosoftLoading(false);
    }
  };

  const HelperText = ({ children }: { children: React.ReactNode }) => (
    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{children}</p>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex">
      {/* Left Panel - Dark Navy */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-[#1E3A5F] flex-col justify-between p-8 xl:p-12">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 text-white">
            <LogoMark size={44} showWordmark={true} />
          </div>

          {/* Headline */}
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-6 leading-tight">
            Smart property management
            <br />
            <span className="text-[#F59E0B]">made simple</span>
          </h2>
        </div>

        {/* Building Illustration */}
        <div className="flex-1 flex items-center justify-center">
          <BuildingIllustration />
        </div>

        {/* Feature Bullets */}
        <div className="space-y-4">
          <FeatureBullet
            icon={Sparkles}
            text="AI-powered tenant communication"
          />
          <FeatureBullet icon={Shield} text="Automated rent reminders" />
          <FeatureBullet icon={CheckCircle} text="Free forever, no credit card" />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Create your account</h1>
            <p className="text-slate-500 dark:text-slate-400">
              Join thousands of landlords managing their properties
            </p>
            {/* Sign In Button for existing users */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">Already registered?</span>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={step} steps={stepLabels} />

          {/* Step 1: Property Address */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* OAuth Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                >
                  <GoogleIcon />
                  {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
                </button>

                <button
                  onClick={handleMicrosoftSignIn}
                  disabled={isMicrosoftLoading}
                  className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
                >
                  <MicrosoftIcon />
                  {isMicrosoftLoading ? 'Connecting...' : 'Continue with Microsoft'}
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    or sign up with email
                  </span>
                </div>
              </div>

              {/* Address Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
                className="space-y-4"
              >
                {/* Property Address Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Property Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      name="address"
                      autoComplete="street-address address-line1"
                      defaultValue={formData.propertyAddress}
                      onBlur={(e) => handleChange('propertyAddress', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                        fieldErrors.propertyAddress
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="96 Meserole St, Brooklyn, NY 11206"
                    />
                  </div>
                  {fieldErrors.propertyAddress ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {fieldErrors.propertyAddress}
                    </p>
                  ) : (
                    <HelperText>
                      Enter your building's street address
                    </HelperText>
                  )}
                </div>

                {/* Blue Info Box - Why address first */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        Why address first?
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                        Your property address helps our AI understand local
                        regulations and provide personalized recommendations for
                        your area.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg transition-colors"
                >
                  Continue
                </button>
              </form>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-[#1E3A5F] dark:text-[#4A7DB5] hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Email/Password */}
          {step === 2 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNextStep();
                }}
                className="space-y-4"
              >
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      defaultValue={formData.email}
                      onBlur={(e) => handleChange('email', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                        fieldErrors.email
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      defaultValue={formData.password}
                      onBlur={(e) => handleChange('password', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                        fieldErrors.password
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {fieldErrors.password}
                    </p>
                  ) : (
                    <HelperText>Minimum 8 characters</HelperText>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      defaultValue={formData.confirmPassword}
                      onBlur={(e) => handleChange('confirmPassword', e.target.value)}
                      className={`w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                        fieldErrors.confirmPassword
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#1E3A5F] hover:bg-[#152942] text-white font-semibold rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </form>

              {/* Sign in link for Step 2 */}
              <div className="text-center mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-[#1E3A5F] dark:text-[#4A7DB5] hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Step 3: First/Last/Phone + Address Preview */}
          {step === 3 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm">
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {message && (
                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">{message}</p>
                </div>
              )}

              {/* Read-only Address Preview Card */}
              <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#1E3A5F]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4 text-[#1E3A5F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      Property Address
                    </p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 truncate">
                      {formData.propertyAddress}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm text-[#1E3A5F] dark:text-[#4A7DB5] hover:underline font-medium whitespace-nowrap"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                {/* First and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="given-name"
                        autoComplete="given-name"
                        defaultValue={formData.firstName}
                        onBlur={(e) => handleChange('firstName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                          fieldErrors.firstName
                            ? 'border-red-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder="John"
                      />
                    </div>
                    {fieldErrors.firstName && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="family-name"
                        autoComplete="family-name"
                        defaultValue={formData.lastName}
                        onBlur={(e) => handleChange('lastName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                          fieldErrors.lastName
                            ? 'border-red-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                        placeholder="Smith"
                      />
                    </div>
                    {fieldErrors.lastName && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="tel"
                      name="tel"
                      autoComplete="tel"
                      defaultValue={formData.phoneNumber}
                      onBlur={(e) => handleChange('phoneNumber', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-colors ${
                        fieldErrors.phoneNumber
                          ? 'border-red-500'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  {fieldErrors.phoneNumber ? (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {fieldErrors.phoneNumber}
                    </p>
                  ) : (
                    <HelperText>
                      We'll use this for emergency alerts from your tenant bot
                    </HelperText>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-[#1E3A5F] hover:bg-[#152942] disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </form>

              {/* Sign in link for Step 3 */}
              <div className="text-center mt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-[#1E3A5F] dark:text-[#4A7DB5] hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Bottom Green Checkmark Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <GreenCheckBadge text="Free Forever" />
            <GreenCheckBadge text="Unlimited Units" />
            <GreenCheckBadge text="AI Assistant" />
          </div>
        </div>
      </div>
    </div>
  );
}
