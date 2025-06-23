import { createClient } from "./client";
import { SafeZone, CreateSafeZoneData, UpdateSafeZoneData, SafeZoneStats } from "@/lib/types/safezone";
import { geocodeAddress } from "@/lib/sgis";

export async function getSafeZones(): Promise<SafeZone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('safezone')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch safezones: ${error.message}`);
  }

  return data || [];
}

export async function getSafeZone(id: number): Promise<SafeZone | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('safezone')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch safezone: ${error.message}`);
  }

  return data;
}

export async function createSafeZone(safeZoneData: CreateSafeZoneData): Promise<SafeZone> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('safezone')
    .insert([safeZoneData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create safezone: ${error.message}`);
  }

  return data;
}

export async function updateSafeZone(safeZoneData: UpdateSafeZoneData): Promise<SafeZone> {
  const supabase = createClient();
  const { id, ...updateData } = safeZoneData;
  
  const { data, error } = await supabase
    .from('safezone')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update safezone: ${error.message}`);
  }

  return data;
}

export async function deleteSafeZone(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('safezone')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete safezone: ${error.message}`);
  }
}

export async function searchSafeZones(query: string): Promise<SafeZone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('safezone')
    .select('*')
    .or(`building_name.ilike.%${query}%,contact.ilike.%${query}%,address.ilike.%${query}%,detail_address.ilike.%${query}%,sido_nm.ilike.%${query}%,sgg_nm.ilike.%${query}%,adm_nm.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to search safezones: ${error.message}`);
  }

  return data || [];
}

export async function getSafeZoneStats(): Promise<SafeZoneStats> {
  const supabase = createClient();
  
  // Get total safezones
  const { count: totalCount, error: totalError } = await supabase
    .from('safezone')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(`Failed to get total safezones: ${totalError.message}`);
  }

  // Get recent additions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentCount, error: recentError } = await supabase
    .from('safezone')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (recentError) {
    throw new Error(`Failed to get recent safezones: ${recentError.message}`);
  }

  // For coverage areas, we'll count unique addresses (simplified)
  const { data: addressData, error: addressError } = await supabase
    .from('safezone')
    .select('address')
    .not('address', 'is', null);

  if (addressError) {
    throw new Error(`Failed to get coverage areas: ${addressError.message}`);
  }

  // Count unique addresses (simplified coverage calculation)
  const uniqueAddresses = new Set(
    (addressData || [])
      .map(item => item.address)
      .filter(addr => addr && addr.trim())
      .map(addr => addr!.split(' ').slice(0, 2).join(' ')) // Take first 2 words as area
  );

  return {
    total_safezones: totalCount || 0,
    recent_additions: recentCount || 0,
    coverage_areas: uniqueAddresses.size
  };
}

export async function getSafeZonesInBounds(
  north: number,
  south: number,
  east: number,
  west: number
): Promise<SafeZone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('safezone')
    .select('*')
    .gte('lat', south)
    .lte('lat', north)
    .gte('lng', west)
    .lte('lng', east)
    .not('lat', 'is', null)
    .not('lng', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch safezones in bounds: ${error.message}`);
  }

  return data || [];
}

export async function createSafeZoneWithGeocoding(safeZoneData: CreateSafeZoneData): Promise<SafeZone> {
  const supabase = createClient();
  
  // 주소가 있는 경우 SGIS API로 행정구역 정보 보완
  let enhancedData = { ...safeZoneData };
  
  if (safeZoneData.address && !safeZoneData.sido_nm) {
    try {
      const geocodeResult = await geocodeAddress(safeZoneData.address);
      if (geocodeResult) {
        enhancedData = {
          ...enhancedData,
          sido_nm: geocodeResult.sido_nm,
          sgg_nm: geocodeResult.sgg_nm,
          adm_nm: geocodeResult.adm_nm,
        };
      }
    } catch (error) {
      console.warn('Failed to geocode address, proceeding without administrative info:', error);
    }
  }

  const { data, error } = await supabase
    .from('safezone')
    .insert([enhancedData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create safezone: ${error.message}`);
  }

  return data;
}

export async function updateSafeZoneWithGeocoding(safeZoneData: UpdateSafeZoneData): Promise<SafeZone> {
  const supabase = createClient();
  const { id, ...updateData } = safeZoneData;
  
  // 주소가 변경된 경우 SGIS API로 행정구역 정보 업데이트
  let enhancedData = { ...updateData };
  
  if (updateData.address) {
    try {
      const geocodeResult = await geocodeAddress(updateData.address);
      if (geocodeResult) {
        enhancedData = {
          ...enhancedData,
          sido_nm: geocodeResult.sido_nm,
          sgg_nm: geocodeResult.sgg_nm,
          adm_nm: geocodeResult.adm_nm,
        };
      }
    } catch (error) {
      console.warn('Failed to geocode address, proceeding with existing data:', error);
    }
  }
  
  const { data, error } = await supabase
    .from('safezone')
    .update(enhancedData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update safezone: ${error.message}`);
  }

  return data;
}