export { sgisClient, sgisTokenManager } from './client';
export { checkSGISTokenStatus, refreshSGISTokenIfNeeded } from './utils';
export { geocodeAddress, reverseGeocode, searchAddressWithDetails } from './geocoding';
export type { 
  SGISAuthRequest, 
  SGISAuthResponse, 
  SGISTokenInfo, 
  SGISError,
  SGISGeocodeRequest,
  SGISGeocodeResponse,
  SGISGeocodeResultData,
  GeocodeResult
} from '@/lib/types/sgis';