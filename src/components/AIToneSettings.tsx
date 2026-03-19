import { useState, useEffect } from 'react';
import { Bot, MessageSquare, User, Building2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/features/auth';
import { supabase } from '@/lib/supabase';

export type AITone = 'professional' | 'friendly' | 'firm' | 'casual';

interface AIToneSettingsProps {
  variant?: 'card' | 'inline';
}

const toneOptions = [
  {
    id: 'professional' as AITone,
    label: 'Professional',
    description: 'Formal, courteous, and business-like communication',
    example: 'Thank you for your inquiry. I will review your request and respond within 24 hours.',
    icon: Building2,
    color: 'bg-blue-500',
  },
  {
    id: 'friendly' as AITone,
    label: 'Friendly',
    description: 'Warm, approachable, and personable tone',
    example: 'Thanks for reaching out! I\'ll look into this for you and get back to you soon.',
    icon: MessageSquare,
    color: 'bg-emerald-500',
  },
  {
    id: 'firm' as AITone,
    label: 'Firm',
    description: 'Direct, assertive, and authoritative when needed',
    example: 'This matter requires immediate attention. Please address this by the specified deadline.',
    icon: User,
    color: 'bg-amber-500',
  },
  {
    id: 'casual' as AITone,
    label: 'Casual',
    description: 'Relaxed, conversational, and informal',
    example: 'Hey! Got your message. I\'ll check on this and let you know what\'s up.',
    icon: Bot,
    color: 'bg-purple-500',
  },
];

export function AIToneSettings({ variant = 'card' }: AIToneSettingsProps) {
  const { userData } = useAuth();
  const [selectedTone, setSelectedTone] = useState<AITone>('professional');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load saved tone preference
  useEffect(() => {
    const loadTone = async () => {
      if (!userData?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('ai_tone')
          .eq('user_id', userData.id)
          .single() as { data: { ai_tone: string | null } | null; error: any };

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading AI tone:', error);
          return;
        }

        if (data?.ai_tone) {
          setSelectedTone(data.ai_tone as AITone);
        }
      } catch (err) {
        console.error('Error loading AI tone:', err);
      }
    };

    loadTone();
  }, [userData]);

  const handleToneChange = async (tone: AITone) => {
    setSelectedTone(tone);
    
    if (!userData?.id) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const settingsData = {
        user_id: userData.id,
        ai_tone: tone,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData as any, {
          onConflict: 'user_id',
        });

      if (error) {
        // If table doesn't exist, just save to localStorage as fallback
        if (error.code === '42P01') {
          localStorage.setItem(`ai-tone-${userData.id}`, tone);
        } else {
          throw error;
        }
      }

      setSaveMessage('Settings saved');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (err) {
      console.error('Error saving AI tone:', err);
      setSaveMessage('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedToneOption = toneOptions.find(t => t.id === selectedTone);

  if (variant === 'inline') {
    return (
      <div className="space-y-4">
        {/* Landlord Context Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Important:</strong> The AI is configured to speak <em>to you as the landlord</em>, not to tenants. 
              When responding to tenant inquiries, the AI will adopt your selected tone while maintaining professionalism.
            </p>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="grid grid-cols-2 gap-3">
          {toneOptions.map((tone) => (
            <button
              key={tone.id}
              onClick={() => handleToneChange(tone.id)}
              className={`p-3 rounded-lg border-2 text-left transition-all ${
                selectedTone === tone.id
                  ? `border-${tone.color.replace('bg-', '')} bg-${tone.color.replace('bg-', '')}/10`
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 ${tone.color} rounded-full flex items-center justify-center`}>
                  <tone.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className={`font-medium text-sm ${
                  selectedTone === tone.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {tone.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tone.description}
              </p>
            </button>
          ))}
        </div>

        {/* Example Preview */}
        {selectedToneOption && (
          <motion.div
            key={selectedTone}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Example response style:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{selectedToneOption.example}"</p>
          </motion.div>
        )}

        {/* Save Status */}
        {saveMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`text-xs ${
              saveMessage === 'Settings saved' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {saveMessage}
          </motion.p>
        )}
      </div>
    );
  }

  // Card variant
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Bot className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="font-medium text-slate-900 dark:text-slate-100">AI Personality & Tone</h2>
          <p className="text-sm text-slate-500">Customize how the AI communicates</p>
        </div>
      </div>

      {/* Landlord Context Notice */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-300 text-sm mb-1">
              Speaking to You as the Landlord
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The AI is configured to speak <strong>to you as the property owner/manager</strong>, not directly to tenants. 
              When the AI drafts responses for tenant inquiries, it will adopt your selected tone while maintaining 
              appropriate professionalism for property management communications.
            </p>
          </div>
        </div>
      </div>

      {/* Tone Selection */}
      <div className="space-y-3">
        {toneOptions.map((tone) => (
          <button
            key={tone.id}
            onClick={() => handleToneChange(tone.id)}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedTone === tone.id
                ? `border-${tone.color.replace('bg-', '')} bg-${tone.color.replace('bg-', '')}/5`
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${tone.color} rounded-lg flex items-center justify-center shrink-0`}>
                <tone.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    selectedTone === tone.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {tone.label}
                  </span>
                  {selectedTone === tone.id && (
                    <span className="text-xs text-emerald-500 font-medium">Selected</span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {tone.description}
                </p>
                
                {selectedTone === tone.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                  >
                    <p className="text-xs text-slate-400 mb-1">Example:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{tone.example}"</p>
                  </motion.div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Save Status */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 p-3 rounded-lg text-center text-sm ${
            saveMessage === 'Settings saved' 
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}
        >
          {saveMessage}
        </motion.div>
      )}
    </div>
  );
}

export default AIToneSettings;
