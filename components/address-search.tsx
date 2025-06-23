"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Loader2 } from "lucide-react";
import { MapPosition } from "@/lib/types/safezone";

interface AddressSearchProps {
  onLocationSelect: (position: MapPosition, address: string) => void;
  placeholder?: string;
  className?: string;
}

interface SearchResult {
  name: string;
  address: string;
  position: MapPosition;
  placeId: string;
}

export function AddressSearch({ 
  onLocationSelect, 
  placeholder = "주소를 입력하세요...",
  className = ""
}: AddressSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Google Maps API 로드 확인
  useEffect(() => {
    const checkGoogleMaps = async () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        try {
          const { AutocompleteSessionToken } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
          sessionToken.current = new AutocompleteSessionToken();
          setIsGoogleLoaded(true);
        } catch (error) {
          console.error('Error loading Google Maps Places library:', error);
          setTimeout(checkGoogleMaps, 1000);
        }
      } else {
        // Google Maps가 로드되지 않았으면 1초 후 다시 확인
        setTimeout(checkGoogleMaps, 1000);
      }
    };

    checkGoogleMaps();
  }, []);

  // 외부 클릭 시 결과 숨김
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const searchAddresses = async (searchQuery: string) => {
    if (!searchQuery.trim() || !isGoogleLoaded || !sessionToken.current) return;

    setIsLoading(true);
    try {
      const { AutocompleteSuggestion } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
      
      const request: google.maps.places.AutocompleteRequest = {
        input: searchQuery,
        sessionToken: sessionToken.current,
        locationBias: {
          // Bias towards South Korea
          center: { lat: 37.5665, lng: 126.9780 }, // Seoul coordinates
          radius: 50000 // 100km radius
        },
        region: 'kr', // 한국으로 제한
        language: 'ko' // 한국어 결과
      };

      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      const searchResults: SearchResult[] = [];
      
      for (const suggestion of suggestions.slice(0, 5)) { // 최대 5개 결과
        const placePrediction = suggestion.placePrediction;
        if (placePrediction) {
          // Convert PlacePrediction to Place to get coordinates
          const place = placePrediction.toPlace();
          await place.fetchFields({ fields: ['location', 'formattedAddress', 'displayName'] });
          
          if (place.location && place.formattedAddress) {
            searchResults.push({
              name: place.displayName || '',
              address: place.formattedAddress,
              position: {
                lat: place.location.lat(),
                lng: place.location.lng()
              },
              placeId: place.id || ''
            });
          }
        }
      }
      
      setResults(searchResults);
      setShowResults(searchResults.length > 0);
    } catch (error) {
      console.error('Address search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // 이전 타이머 클리어
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (value.length > 2) {
      setIsLoading(true);
      debounceTimer.current = setTimeout(() => {
        searchAddresses(value);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
      setIsLoading(false);
    }
  };

  const handleResultClick = async (result: SearchResult) => {
    setQuery(result.address);
    setShowResults(false);
    onLocationSelect(result.position, result.address);
    
    // Create new session token for next search
    if (isGoogleLoaded) {
      try {
        const { AutocompleteSessionToken } = await google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        sessionToken.current = new AutocompleteSessionToken();
      } catch (error) {
        console.error('Error creating new session token:', error);
      }
    }
  };

  const handleSearch = () => {
    if (query.trim()) {
      searchAddresses(query);
    }
  };


  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
            placeholder={placeholder}
            className="pl-10"
            disabled={!isGoogleLoaded}
          />
        </div>
        <Button 
          onClick={handleSearch}
          variant="outline"
          disabled={!query.trim() || !isGoogleLoaded || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 검색 결과 드롭다운 */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.placeId}-${index}`}
              className="w-full text-left px-4 py-3 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0 transition-colors"
              onClick={() => handleResultClick(result)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-sm">{`${result.address} (${result.name})`}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 검색 결과가 없을 때 */}
      {showResults && results.length === 0 && !isLoading && query.length > 2 && (
        <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50 p-4">
          <div className="text-sm text-muted-foreground text-center">
            검색 결과가 없습니다.
          </div>
        </div>
      )}

      {/* Google Maps 로딩 중 */}
      {!isGoogleLoaded && (
        <div className="absolute top-full mt-1 w-full bg-background border border-border rounded-md shadow-lg z-50 p-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Google Maps 로딩 중...
          </div>
        </div>
      )}
    </div>
  );
}