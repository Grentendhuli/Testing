import { useState, useCallback, useRef, useEffect } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// Google Places types
declare global {
  namespace google {
    namespace maps {
      namespace places {
        interface AutocompleteOptions {
          types?: string[];
          componentRestrictions?: { country: string | string[] };
          fields?: string[];
        }
        interface Autocomplete {
          addListener(event: string, handler: () => void): void;
          getPlace(): {
            formatted_address?: string;
            address_components?: Array<{
              long_name: string;
              short_name: string;
              types: string[];
            }>;
          };
        }
      }
    }
  }
  
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete?: new (
            inputField: HTMLInputElement,
            opts?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete;
        };
      };
    };
  }
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (address: {
    fullAddress: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  error?: string;
  /**
   * Use Google Places API instead of Nominatim
   * Requires VITE_GOOGLE_MAPS_API_KEY to be set
   */
  useGooglePlaces?: boolean;
}

/**
 * AddressAutocomplete - A component that provides address autocomplete
 * 
 * By default uses Nominatim (OpenStreetMap) - free, no API key required
 * Set useGooglePlaces=true and provide VITE_GOOGLE_MAPS_API_KEY for Google Places
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Enter property address...',
  className = '',
  id,
  name,
  disabled = false,
  error,
  useGooglePlaces = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [googlePlacesLoaded, setGooglePlacesLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const googleAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');

  const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

  // Load Google Places API script
  useEffect(() => {
    if (!useGooglePlaces || !GOOGLE_MAPS_API_KEY || googlePlacesLoaded) return;

    // Check if script already exists
    if (document.querySelector('script[data-google-maps]')) {
      setGooglePlacesLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    
    (window as any).initGooglePlaces = () => {
      setGooglePlacesLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Google Places API');
      setGooglePlacesLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      delete (window as any).initGooglePlaces;
    };
  }, [useGooglePlaces, GOOGLE_MAPS_API_KEY, googlePlacesLoaded]);

  // Initialize Google Autocomplete
  useEffect(() => {
    if (
      !useGooglePlaces ||
      !googlePlacesLoaded ||
      !inputRef.current ||
      !window.google?.maps?.places?.Autocomplete
    ) {
      return;
    }

    // Initialize Google Places Autocomplete
    googleAutocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['address'],
        componentRestrictions: { country: 'us' },
        fields: ['address_components', 'formatted_address'],
      }
    );

    // Listen for place selection
    googleAutocompleteRef.current.addListener('place_changed', () => {
      const place = googleAutocompleteRef.current?.getPlace();
      if (place?.address_components) {
        const streetNumber = place.address_components.find((c) =>
          c.types.includes('street_number')
        )?.long_name;
        const route = place.address_components.find((c) =>
          c.types.includes('route')
        )?.long_name;
        const city = place.address_components.find((c) =>
          c.types.includes('locality') || c.types.includes('sublocality')
        )?.long_name;
        const state = place.address_components.find((c) =>
          c.types.includes('administrative_area_level_1')
        )?.short_name;
        const zipCode = place.address_components.find((c) =>
          c.types.includes('postal_code')
        )?.long_name;

        const street = `${streetNumber || ''} ${route || ''}`.trim();
        const fullAddress = place.formatted_address || '';

        onChange(fullAddress);

        if (onSelect) {
          onSelect({
            fullAddress,
            street,
            city: city || '',
            state: state || '',
            zipCode: zipCode || '',
          });
        }
      }
    });

    return () => {
      // Google Places doesn't provide a clean way to destroy the instance
      // The autocomplete will be cleaned up when the input is removed from DOM
    };
  }, [googlePlacesLoaded, useGooglePlaces, onChange, onSelect]);

  // Fetch address suggestions from Nominatim (fallback)
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      abortControllerRef.current?.abort();
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    lastQueryRef.current = query;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      // Using Nominatim (OpenStreetMap) - free, no API key required
      // Limiting to US addresses for better results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+USA&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en-US',
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error('Failed to fetch suggestions');

      const data = await response.json();
      if (lastQueryRef.current === query) {
        setSuggestions(data);
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      console.error('Error fetching address suggestions:', err);
      setSuggestions([]);
    } finally {
      if (lastQueryRef.current === query) {
        setIsLoading(false);
      }
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    },
    [fetchSuggestions]
  );

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // If using Google Places, don't show our custom dropdown
    if (useGooglePlaces && googlePlacesLoaded) {
      return;
    }

    setShowSuggestions(true);
    debouncedSearch(newValue);
  };

  // Handle suggestion selection (Nominatim)
  const handleSelect = (suggestion: AddressSuggestion) => {
    const address = suggestion.address;
    const street = `${address.house_number || ''} ${address.road || ''}`.trim();
    const city = address.city || address.town || address.village || '';
    const state = address.state || '';
    const zipCode = address.postcode || '';

    // Format the full address
    const fullAddress = `${street}, ${city}, ${state} ${zipCode}`
      .replace(/,\s*,/g, ',')
      .trim();

    onChange(fullAddress);

    if (onSelect) {
      onSelect({
        fullAddress,
        street,
        city,
        state,
        zipCode,
      });
    }

    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (useGooglePlaces && googlePlacesLoaded) return; // Let Google handle this

    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Clear input
  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (useGooglePlaces && googlePlacesLoaded) return;
            if (value.length >= 3) {
              setShowSuggestions(true);
              fetchSuggestions(value);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="street-address"
          className={`
            w-full px-3 py-2 pr-10 
            bg-slate-50 dark:bg-slate-700 
            border rounded-lg 
            text-slate-800 dark:text-slate-100 
            placeholder-slate-400
            focus:outline-none focus:ring-2 focus:ring-amber-500/50 
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'}
            ${className}
          `}
        />

        {/* Loading indicator or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear address"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            <MapPin className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Error message */}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {/* Suggestions dropdown (Nominatim only) */}
      {!useGooglePlaces && showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.lat + suggestion.lon}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0
                ${index === highlightedIndex ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}
              `}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700 dark:text-slate-200">
                  {suggestion.display_name}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AddressAutocomplete;
