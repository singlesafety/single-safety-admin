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
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Google Maps API 로드 확인
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        autocompleteService.current = new google.maps.places.AutocompleteService();
        geocoder.current = new google.maps.Geocoder();
        setIsGoogleLoaded(true);
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

  const searchAddresses = async (searchQuery: string) => {
    if (!searchQuery.trim() || !isGoogleLoaded || !autocompleteService.current) return;

    setIsLoading(true);
    try {
      const request = {
        input: searchQuery,
        componentRestrictions: { country: 'kr' }, // 한국으로 제한
        types: ['establishment', 'geocode'] // 장소와 주소
      };

      autocompleteService.current.getPlacePredictions(
        request,
        async (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const searchResults: SearchResult[] = [];
            
            // 각 예측 결과에 대해 좌표 가져오기
            for (const prediction of predictions.slice(0, 5)) { // 최대 5개 결과
              try {
                const result = await getCoordinatesFromPlaceId(prediction.place_id!);
                if (result) {
                  searchResults.push({
                    address: prediction.description,
                    position: result,
                    placeId: prediction.place_id!
                  });
                }
              } catch (error) {
                console.error('Error getting coordinates:', error);
              }
            }
            
            setResults(searchResults);
            setShowResults(true);
          } else {
            setResults([]);
            setShowResults(false);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Address search error:', error);
      setIsLoading(false);
    }
  };

  const getCoordinatesFromPlaceId = (placeId: string): Promise<MapPosition | null> => {
    return new Promise((resolve) => {
      if (!geocoder.current) {
        resolve(null);
        return;
      }

      geocoder.current.geocode(
        { placeId: placeId },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.length > 2) {
      const debounceTimer = setTimeout(() => {
        searchAddresses(value);
      }, 300);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery(result.address);
    setShowResults(false);
    onLocationSelect(result.position, result.address);
  };

  const handleSearch = () => {
    if (query.trim()) {
      searchAddresses(query);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
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
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10"
            disabled={!isGoogleLoaded}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button 
          onClick={handleSearch}
          variant="outline"
          disabled={!query.trim() || !isGoogleLoaded || isLoading}
        >
          <Search className="h-4 w-4" />
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
                <span className="text-sm">{result.address}</span>
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