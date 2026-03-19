import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, MessageSquare, User, Home, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useApp } from '../context/AppContext';
import { generateText } from '../services/gemini';
import type { Lead } from '../types';

interface SmartLeadResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSend: (message: string) => void;
}

interface GeneratedResponse {
  message: string;
  tone: string;
  confidence: number;
  reasoning: string;
}

export function SmartLeadResponseModal({
  isOpen,
  onClose,
  lead,
  onSend,
}: SmartLeadResponseModalProps) {
  const { userData } = useAuth();
  const { units } = useApp();
  const [generatedResponse, setGeneratedResponse] = useState<GeneratedResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Find available units that match lead preferences
  const getMatchingUnits = () => {
    if (!lead) return [];
    
    return units.filter(unit => {
      if (unit.status !== 'vacant') return false;
      
      // Check bedroom match if specified
      if (lead.bedrooms && unit.bedrooms !== lead.bedrooms) return false;
      
      // Check budget if specified
      if (lead.budget && unit.rentAmount > lead.budget * 1.1) return false; // 10% flexibility
      
      return true;
    }).slice(0, 3); // Top 3 matches
  };

  const generateResponse = async () => {
    if (!lead) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const matchingUnits = getMatchingUnits();
      const tone = userData?.subscription_tier === 'concierge' ? 'warm' : 'friendly';
      
      const prompt = `Draft a response to a rental inquiry from a potential tenant.

Lead Information:
- Name: ${lead.name}
- Inquiry: ${lead.notes || 'Interested in renting'}
- Budget: ${lead.budget ? `$${lead.budget}` : 'Not specified'}
- Bedrooms needed: ${lead.bedrooms || 'Not specified'}
- Move-in date: ${lead.moveInDate || 'Not specified'}

Available Matching Units:
${matchingUnits.length > 0 
  ? matchingUnits.map(u => `- Unit ${u.unitNumber}: ${u.bedrooms}br/${u.bathrooms}ba, $${u.rentAmount}/mo, ${u.squareFeet || 'N/A'} sq ft`).join('\n')
  : '- No exact matches currently available'}

Property Address: ${userData?.property_address || 'NYC Property'}

Landlord Preferences:
- Tone: ${tone}

Requirements:
1. Be ${tone} and welcoming
2. Thank them for their interest
3. Address their specific questions if mentioned
4. Mention available units that match their needs
5. Offer 2-3 viewing time options (weekday evening or weekend)
6. Include clear next steps
7. Keep it under 400 characters
8. Don't be pushy or salesy

Return ONLY the message text, no quotes, no explanation.`;

      const result = await generateText(prompt, {
        temperature: 0.7,
        maxOutputTokens: 300,
      });

      if (result.success && result.data?.success && result.data.data) {
        setGeneratedResponse({
          message: result.data.data.trim(),
          tone: tone,
          confidence: matchingUnits.length > 0 ? 90 : 70,
          reasoning: matchingUnits.length > 0 
            ? `${matchingUnits.length} matching units found — response includes specific recommendations`
            : 'No exact matches — response offers alternatives or waitlist option',
        });
      } else {
        // Fallback
        const fallbackMessage = matchingUnits.length > 0
          ? `Hi ${lead.name}, thanks for your interest! We have ${matchingUnits.length} unit(s) that might work for you. Would you like to schedule a viewing this week? Let me know what times work best.`
          : `Hi ${lead.name}, thanks for your interest! I don't have any units that match exactly right now, but I'd be happy to add you to our waitlist and contact you when something opens up.`;
          
        setGeneratedResponse({
          message: fallbackMessage,
          tone: tone,
          confidence: 60,
          reasoning: 'AI generation failed — using fallback template',
        });
      }
    } catch (err) {
      setError('Failed to generate response. Using fallback.');
      setGeneratedResponse({
        message: `Hi ${lead.name}, thanks for reaching out! I'd love to show you the property. What days/times work for a viewing this week?`,
        tone: 'friendly',
        confidence: 60,
        reasoning: 'Error occurred — using fallback template',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedResponse?.message) {
      navigator.clipboard.writeText(generatedResponse.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = () => {
    if (generatedResponse?.message) {
      onSend(generatedResponse.message);
      onClose();
    }
  };

  if (!isOpen || !lead) return null;

  const matchingUnits = getMatchingUnits();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                AI Lead Response
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personalized reply for {lead.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Lead Context */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Lead Details
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {lead.budget && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">Budget:</span>
                  <span className="font-medium">${lead.budget.toLocaleString()}</span>
                </div>
              )}
              {lead.bedrooms && (
                <div className="flex items-center gap-2">
                  <Home className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">Bedrooms:</span>
                  <span className="font-medium">{lead.bedrooms}</span>
                </div>
              )}
              {lead.moveInDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span className="text-slate-500 dark:text-slate-400">Move-in:</span>
                  <span className="font-medium">{new Date(lead.moveInDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {/* Matching Units */}
            {matchingUnits.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                  ✓ {matchingUnits.length} matching unit(s) available
                </p>
                <div className="space-y-1">
                  {matchingUnits.map(unit => (
                    <div key={unit.id} className="text-xs text-slate-600 dark:text-slate-300">
                      Unit {unit.unitNumber}: {unit.bedrooms}br/{unit.bathrooms}ba · ${unit.rentAmount}/mo
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          {!generatedResponse && !isGenerating && (
            <button
              onClick={generateResponse}
              className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Response
            </button>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Analyzing lead preferences and drafting personalized response...
              </p>
            </div>
          )}

          {/* Generated Response */}
          {generatedResponse && (
            <div className="space-y-4">
              {/* Message Preview */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Generated Response
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {generatedResponse.message.length} chars
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {generatedResponse.message}
                </p>
              </div>

              {/* AI Reasoning */}
              <div className="flex items-start gap-3 text-sm">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {generatedResponse.reasoning}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Tone: {generatedResponse.tone}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Confidence: {generatedResponse.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <span>⚠</span> {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={generateResponse}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
                >
                  Copy & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
