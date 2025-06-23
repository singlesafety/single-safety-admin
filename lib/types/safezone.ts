export interface SafeZone {
  id: number;
  created_at: string;
  building_name: string | null;
  contact: string | null;
  address: string | null;
  detail_address: string | null;
  lat: number | null;
  lng: number | null;
  level: number | null;
  sido_nm: string | null;
  sgg_nm: string | null;
  adm_nm: string | null;
}

export interface CreateSafeZoneData {
  building_name: string;
  contact?: string;
  address?: string;
  detail_address?: string;
  lat: number;
  lng: number;
  level?: number;
  sido_nm?: string;
  sgg_nm?: string;
  adm_nm?: string;
}

export interface UpdateSafeZoneData extends Partial<CreateSafeZoneData> {
  id: number;
}

export interface SafeZoneStats {
  total_safezones: number;
  recent_additions: number;
  coverage_areas: number;
}

export interface MapPosition {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MarkerData extends SafeZone {
  position: MapPosition;
}