import { useState } from 'react';
import { Sparkles, Wrench, DollarSign, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useApp } from '../context/AppContext';
import { generateText } from '../services/gemini';
import type { MaintenanceRequest } from '../types';

interface SmartCostEstimateProps {
  request: MaintenanceRequest | null;
  onClose: () => void;
}

interface CostEstimate {
  minCost: number;
  maxCost: number;
  confidence: number;
  category: string;
  reasoning: string;
  factors: string[];
  urgency: 'routine' | 'soon' | 'urgent';
  recommendedVendors: string[];
}

export function SmartCostEstimate({ request, onClose }: SmartCostEstimateProps) {
  const { userData } = useAuth();
  const { maintenanceRequests } = useApp();
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get historical costs for similar issues
  const getHistoricalData = () => {
    if (!request) return { avgCost: 0, count: 0 };
    
    const similarRequests = maintenanceRequests.filter(r => 
      r.category === request.category && 
      r.status === 'completed' &&
      r.actualCost
    );
    
    if (similarRequests.length === 0) return { avgCost: 0, count: 0 };
    
    const totalCost = similarRequests.reduce((sum, r) => sum + (r.actualCost || 0), 0);
    return {
      avgCost: Math.round(totalCost / similarRequests.length),
      count: similarRequests.length,
    };
  };

  const analyzeCost = async () => {
    if (!request) return;
    
    setIsAnalyzing(true);
    setError(null);

    try {
      const historical = getHistoricalData();
      
      const prompt = `Analyze this maintenance request and provide a cost estimate.

Request Details:
- Title: ${request.title}
- Description: ${request.description}
- Category: ${request.category || 'general'}
- Priority: ${request.priority}
- Unit: ${request.unitNumber}

Historical Data:
- Similar completed requests: ${historical.count}
- Average cost for similar: ${historical.avgCost > 0 ? `$${historical.avgCost}` : 'No data'}

Provide a JSON response with this exact structure:
{
  "minCost": number (minimum estimated cost),
  "maxCost": number (maximum estimated cost),
  "confidence": number (0-100, based on data quality),
  "category": string (trade category: plumbing, electrical, hvac, appliance, structural, general),
  "reasoning": string (brief explanation of estimate),
  "factors": string[] (2-3 factors affecting cost),
  "urgency": "routine" | "soon" | "urgent",
  "recommendedVendors": string[] (2-3 vendor types, e.g., ["Licensed Plumber", "Handyman"])
}

Rules:
- Be realistic about NYC/Long Island pricing
- Include materials + labor
- Consider urgency in pricing
- If limited info, use wider range and lower confidence`;

      const result = await generateText(prompt, {
        temperature: 0.3,
        maxOutputTokens: 400,
      });

      if (result.success && result.data?.success && result.data.data) {
        try {
          // Try to parse JSON from response
          const jsonMatch = result.data.data.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
          
          if (parsed && parsed.minCost && parsed.maxCost) {
            setEstimate({
              minCost: parsed.minCost,
              maxCost: parsed.maxCost,
              confidence: parsed.confidence || 70,
              category: parsed.category || request.category || 'general',
              reasoning: parsed.reasoning || 'Based on typical pricing for this type of repair',
              factors: parsed.factors || ['Labor costs', 'Materials needed'],
              urgency: parsed.urgency || 'routine',
              recommendedVendors: parsed.recommendedVendors || ['General Contractor'],
            });
          } else {
            throw new Error('Invalid response format');
          }
        } catch (parseError) {
          // Fallback estimate
          setEstimate(getFallbackEstimate(request, historical));
        }
      } else {
        setEstimate(getFallbackEstimate(request, historical));
      }
    } catch (err) {
      setError('AI analysis failed. Using fallback estimate.');
      setEstimate(getFallbackEstimate(request, getHistoricalData()));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFallbackEstimate = (req: MaintenanceRequest, historical: { avgCost: number; count: number }): CostEstimate => {
    // Base estimates by category
    const baseEstimates: Record<string, { min: number; max: number }> = {
      plumbing: { min: 150, max: 500 },
      electrical: { min: 200, max: 600 },
      hvac: { min: 300, max: 800 },
      appliance: { min: 100, max: 400 },
      structural: { min: 500, max: 2000 },
      general: { min: 100, max: 300 },
    };
    
    const base = baseEstimates[req.category || 'general'] || baseEstimates.general;
    
    // Adjust for urgency
    const urgencyMultiplier = req.priority === 'emergency' ? 1.5 : req.priority === 'urgent' ? 1.25 : 1;
    
    return {
      minCost: Math.round(base.min * urgencyMultiplier),
      maxCost: Math.round(base.max * urgencyMultiplier),
      confidence: historical.count > 0 ? 75 : 60,
      category: req.category || 'general',
      reasoning: historical.count > 0 
        ? `Based on ${historical.count} similar completed requests averaging $${historical.avgCost}`
        : 'Based on typical market rates for this type of repair',
      factors: [
        req.priority === 'emergency' ? 'Emergency/after-hours rates' : 'Standard business hours',
        'Materials and parts',
        'Labor time estimate',
      ],
      urgency: req.priority === 'emergency' ? 'urgent' : req.priority === 'urgent' ? 'soon' : 'routine',
      recommendedVendors: getVendorRecommendations(req.category),
    };
  };

  const getVendorRecommendations = (category?: string): string[] => {
    const vendors: Record<string, string[]> = {
      plumbing: ['Licensed Plumber', 'Emergency Plumbing Service'],
      electrical: ['Licensed Electrician', 'Electrical Contractor'],
      hvac: ['HVAC Technician', 'Climate Control Specialist'],
      appliance: ['Appliance Repair Tech', 'Handyman'],
      structural: ['General Contractor', 'Structural Engineer'],
      general: ['Handyman', 'General Contractor'],
    };
    return vendors[category || 'general'] || vendors.general;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'soon': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return AlertTriangle;
      case 'soon': return Clock;
      default: return CheckCircle;
    }
  };

  if (!request) return null;

  const UrgencyIcon = getUrgencyIcon(estimate?.urgency || 'routine');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                AI Cost Estimate
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Smart pricing analysis
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
          {/* Request Summary */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">{request.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{request.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-slate-500">Unit: {request.unitNumber}</span>
                  <span className="text-slate-300">•</span>
                  <span className={`capitalize ${
                    request.priority === 'emergency' ? 'text-red-500' : 
                    request.priority === 'urgent' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {request.priority} priority
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          {!estimate && !isAnalyzing && (
            <button
              onClick={analyzeCost}
              className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Analyze Cost with AI
            </button>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Analyzing similar repairs and market rates...
              </p>
            </div>
          )}

          {/* Cost Estimate Result */}
          {estimate && (
            <div className="space-y-5">
              {/* Cost Range */}
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Estimated Cost
                  </span>
                </div>
                <div className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  ${estimate.minCost.toLocaleString()} - ${estimate.maxCost.toLocaleString()}
                </div>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(estimate.urgency)}`}>
                    <UrgencyIcon className="w-3 h-3" />
                    <span className="capitalize">{estimate.urgency} timeline</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    <TrendingUp className="w-3 h-3" />
                    {estimate.confidence}% confidence
                  </div>
                </div>
              </div>

              {/* Category & Reasoning */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Category:</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                    {estimate.category}
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                  {estimate.reasoning}
                </p>
              </div>

              {/* Cost Factors */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cost Factors:</p>
                <ul className="space-y-1">
                  {estimate.factors.map((factor, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Vendor Recommendations */}
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recommended Vendors:</p>
                <div className="flex flex-wrap gap-2">
                  {estimate.recommendedVendors.map((vendor, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-lg"
                    >
                      {vendor}
                    </span>
                  ))}
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
                  onClick={analyzeCost}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Reanalyze
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
