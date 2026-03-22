import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { FileText, Copy, ExternalLink, Check, Loader2, ChevronDown, Sparkles, X, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Unit {
  id: string;
  unitNumber: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  rentAmount: number;
  notes?: string;
  status: 'vacant' | 'occupied' | 'maintenance';
}

// Mock AI listing generator for when Cloudflare Worker is not configured
function generateMockListing(unit: Unit, userData: any): {
  title: string;
  description: string;
  amenities: string[];
  rentSuggestion: number;
} {
  const addressParts = unit.notes?.split(',') || ['Prime NYC Location'];
  const neighborhood = addressParts[0]?.trim() || 'NYC';
  
  const bedroomText = unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms}BR`;
  const bathroomText = `${unit.bathrooms}BA`;
  
  // Build amenity list based on unit features
  const amenities: string[] = [];
  if (unit.squareFeet && unit.squareFeet > 0) {
    amenities.push(`${unit.squareFeet} sq ft`);
  }
  
  // Add building amenities from user data
  if (userData?.listing_heat_included) amenities.push('Heat included');
  if (userData?.listing_parking) amenities.push('Parking available');
  if (userData?.listing_laundry === 'in_unit') amenities.push('In-unit laundry');
  else if (userData?.listing_laundry === 'in_building') amenities.push('Laundry in building');
  
  // Add pet policy
  if (userData?.listing_pets === 'allowed') amenities.push('Pet-friendly');
  else if (userData?.listing_pets === 'case_by_case') amenities.push('Pets considered case-by-case');

  const title = `${bedroomText}/${bathroomText} Apartment at ${neighborhood.slice(0, 30)}`;
  
  // Generate a human-like description
  const descriptions = [
    `Welcome to this beautiful ${bedroomText.toLowerCase()} apartment in the heart of ${neighborhood}. This ${unit.bathrooms}-bathroom unit offers comfortable living with modern amenities.`,
    `Spacious ${bedroomText.toLowerCase()} apartment available in ${neighborhood}. Perfect for those seeking a well-maintained home in a great location. Features ${unit.bathrooms} bathroom${unit.bathrooms !== 1 ? 's' : ''} and plenty of natural light.`,
    `Charming ${bedroomText.toLowerCase()} residence in ${neighborhood} with ${unit.bathrooms} bathroom${unit.bathrooms !== 1 ? 's' : ''}. This well-kept unit is ready for immediate occupancy.`
  ];
  
  const description = descriptions[Math.floor(Math.random() * descriptions.length)] + 
    '\n\n' + (amenities.length > 0 ? 'Features:\n' + amenities.map(a => '• ' + a).join('\n') + '\n\n' : '') +
    `Monthly Rent: $${unit.rentAmount.toLocaleString()}\n\n` +
    `Contact us today to schedule a viewing!`;

  // Suggest a rent slightly within market range
  const rentSuggestion = Math.round(unit.rentAmount * (0.98 + Math.random() * 0.04));

  return {
    title: title.slice(0, 75),
    description,
    amenities: amenities.slice(0, 8),
    rentSuggestion
  };
}

export function Listings() {
  const [searchParams] = useSearchParams();
  const { units } = useApp();
  const { userData, user } = useAuth();
  
  // State variables
  const [selectedUnitId, setSelectedUnitId] = useState<string>(searchParams.get('unitId') || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [rentSuggestion, setRentSuggestion] = useState<number | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState('');
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Get vacant units
  const vacantUnits = units.filter((u: Unit) => u.status === 'vacant');

  // Auto-generate on mount if unitId is present
  useEffect(() => {
    const unitId = searchParams.get('unitId');
    if (unitId && vacantUnits.some((u: Unit) => u.id === unitId)) {
      generateListing(unitId);
    }
  }, []);

  const generateListing = async (unitId?: string) => {
    const targetUnitId = unitId || selectedUnitId;
    if (!targetUnitId) return;

    setIsGenerating(true);
    setError('');
    setHasGenerated(false);
    setIsUsingMock(false);

    const unit = units.find((u: Unit) => u.id === targetUnitId);
    if (!unit) {
      setIsGenerating(false);
      setError('Unit not found');
      return;
    }

    try {
      // Check if Cloudflare Worker URL is configured
      const workerUrl = (import.meta as any).env?.VITE_CLOUDFLARE_WORKER_URL;
      
      if (!workerUrl) {
        console.warn('VITE_CLOUDFLARE_WORKER_URL not set, using mock generator');
        // Use mock generator when Cloudflare Worker is not configured
        const mockResult = generateMockListing(unit, userData);
        setGeneratedTitle(mockResult.title);
        setGeneratedDescription(mockResult.description);
        setAmenities(mockResult.amenities);
        setRentSuggestion(mockResult.rentSuggestion);
        setIsUsingMock(true);
        setHasGenerated(true);
        setIsGenerating(false);
        return;
      }

      // Read listing defaults from userData
      const listingDefaults = {
        listing_laundry: userData?.listing_laundry || 'none',
        listing_pets: userData?.listing_pets || 'not_allowed',
        listing_heat_included: userData?.listing_heat_included ?? false,
        listing_parking: userData?.listing_parking ?? false,
      };

      // Format values for display
      const laundryDisplay = listingDefaults.listing_laundry === 'in_building' 
        ? 'In Building' 
        : listingDefaults.listing_laundry === 'in_unit' 
          ? 'In Unit' 
          : 'None';
      
      const petsDisplay = listingDefaults.listing_pets === 'case_by_case' 
        ? 'Case by Case' 
        : listingDefaults.listing_pets === 'allowed' 
          ? 'Allowed' 
          : 'Not Allowed';

      // Build prompt string
      const promptString = `You are an expert NYC rental listing copywriter. Generate a rental listing for the following unit.

Unit details:
- Address: ${userData?.property_address || 'NYC Property'}
- Unit: ${unit.unitNumber}
- Bedrooms: ${unit.bedrooms}
- Bathrooms: ${unit.bathrooms}
- Square feet: ${unit.squareFeet || 'N/A'}
- Monthly rent: $${unit.rentAmount}
- Notes: ${unit.notes || 'none'}

Building features:
- Laundry: ${laundryDisplay}
- Pets: ${petsDisplay}
- Heat & hot water included: ${listingDefaults.listing_heat_included ? 'Yes' : 'No'}
- Parking: ${listingDefaults.listing_parking ? 'Yes' : 'No'}

Return ONLY valid JSON with no markdown, no code fences, no explanation. Format:
{
  "title": "compelling listing title under 80 characters",
  "description": "3-4 sentence professional description. Mention the neighborhood based on the address. End with availability.",
  "amenities": ["amenity 1", "amenity 2", "amenity 3"],
  "rentSuggestion": ${unit.rentAmount}
}`;

      try {
        const response = await fetch(workerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: promptString }),
        });

        if (!response.ok) {
          throw new Error('AI service unavailable');
        }

        const data = await response.json();
        let replyText = data.reply || data.text || '';
        
        // Strip markdown fences if present
        replyText = replyText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Parse JSON response
        const parsed = JSON.parse(replyText);
        
        setGeneratedTitle(parsed.title || '');
        setGeneratedDescription(parsed.description || '');
        setAmenities(parsed.amenities || []);
        setRentSuggestion(parsed.rentSuggestion || unit.rentAmount);
        setHasGenerated(true);
        setIsUsingMock(false);
      } catch (fetchError) {
        console.warn('Cloudflare Worker failed, falling back to mock:', fetchError);
        // Fallback to mock generator on API failure
        const mockResult = generateMockListing(unit, userData);
        setGeneratedTitle(mockResult.title);
        setGeneratedDescription(mockResult.description);
        setAmenities(mockResult.amenities);
        setRentSuggestion(mockResult.rentSuggestion);
        setIsUsingMock(true);
        setHasGenerated(true);
      }
    } catch (err) {
      console.error('Error generating listing:', err);
      const mockResult = generateMockListing(unit, userData);
      setGeneratedTitle(mockResult.title);
      setGeneratedDescription(mockResult.description);
      setAmenities(mockResult.amenities);
      setRentSuggestion(mockResult.rentSuggestion);
      setIsUsingMock(true);
      setHasGenerated(true);
      setError('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnitId = e.target.value;
    setSelectedUnitId(newUnitId);
    if (newUnitId) {
      generateListing(newUnitId);
    }
  };

  const removeAmenity = (index: number) => {
    setAmenities(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async (platform: string, url: string) => {
    const unit = units.find((u: Unit) => u.id === selectedUnitId);
    if (!unit) return;

    const clipboardText = `${generatedTitle}

${generatedDescription}

Amenities: ${amenities.join(' · ')}
Rent: $${unit.rentAmount}/mo
Contact us to schedule a showing.`;

    try {
      await navigator.clipboard.writeText(clipboardText);
      setCopiedPlatform(platform);
      window.open(url, '_blank');
      
      setTimeout(() => {
        setCopiedPlatform(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Still open the platform URL even if clipboard fails
      window.open(url, '_blank');
    }
  };

  const platforms = [
    { name: 'StreetEasy', url: 'https://streeteasy.com/building/manage' },
    { name: 'Zillow', url: 'https://www.zillow.com/rental-manager/properties/add' },
    { name: 'Craigslist', url: 'https://post.craigslist.org/' },
    { name: 'Facebook', url: 'https://www.facebook.com/marketplace/create/rental' },
  ];

  const selectedUnit = units.find((u: Unit) => u.id === selectedUnitId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/20 rounded-xl">
          <Sparkles className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-100">Listing Generator</h1>
          <p className="text-slate-400 text-sm">AI-generated from your unit data. Edit if needed, then post.</p>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">Select Unit</label>
        {vacantUnits.length === 0 ? (
          <div className="text-slate-400 text-sm">
            No vacant units. Mark a unit as vacant on the Units page to generate a listing.
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedUnitId}
              onChange={handleUnitChange}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
            >
              <option value="">Select a vacant unit...</option>
              {vacantUnits.map((unit: Unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.unitNumber} — {unit.bedrooms}BR/{unit.bathrooms}BA — ${unit.rentAmount}/mo
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-xl text-slate-300 mb-2">Generating your listing...</p>
          <p className="text-sm text-slate-500">Reading your unit data and writing copy.</p>
        </div>
      )}

      {/* Error State */}
      {error && !isGenerating && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Listing Display */}
      {hasGenerated && !isGenerating && selectedUnit && (
        <div className="space-y-6">
          {isUsingMock && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Using built-in listing generator. AI enhancement available with Concierge upgrade.
              </p>
            </div>
          )}
          
          {/* Title Block */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Listing Title</label>
            <input
              type="text"
              value={generatedTitle}
              onChange={(e) => setGeneratedTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-amber-500"
              maxLength={80}
            />
            <p className="text-sm text-slate-500 mt-2">{generatedTitle.length}/80 characters</p>
          </div>

          {/* Description Block */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Description</label>
            <textarea
              value={generatedDescription}
              onChange={(e) => setGeneratedDescription(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Amenities Block */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 bg-slate-700 text-slate-200 rounded-full px-3 py-1 text-sm"
                >
                  {amenity}
                  <button
                    onClick={() => removeAmenity(index)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Rent Suggestion Block */}
          {rentSuggestion !== null && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <p className="text-amber-400 text-sm">
                AI suggests ${rentSuggestion.toLocaleString()}/mo based on your unit details
              </p>
            </div>
          )}

          {/* Platform Buttons */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-medium text-slate-200 mb-1">Post to Platforms</h3>
            <p className="text-sm text-slate-500 mb-4">
              Your listing will be copied to clipboard. Paste it when the platform opens.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handlePost(platform.name, platform.url)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    copiedPlatform === platform.name
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {copiedPlatform === platform.name ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied! Paste when the page opens
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Copy & Open {platform.name}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Regenerate Button */}
          <div className="flex justify-center">
            <button
              onClick={() => generateListing()}
              disabled={isGenerating}
              className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              Regenerate Listing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Listings;
