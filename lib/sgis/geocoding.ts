import { sgisClient } from './client';
import { SGISGeocodeResponse, SGISGeocodeResultData, GeocodeResult } from '@/lib/types/sgis';

// UTM-K (EPSG:5179) 좌표를 WGS84 (경위도)로 변환하는 함수
function utmkToWgs84(x: number, y: number): { lat: number; lng: number } {
  // UTM-K to WGS84 변환 (근사값)
  // 실제 운영에서는 proj4js 라이브러리 사용 권장
  const lat0 = 38.0;
  const lon0 = 127.5;
  const k0 = 0.9996;
  const false_easting = 1000000;
  const false_northing = 2000000;

  // 간단한 변환 공식 (근사값)
  const dx = x - false_easting;
  const dy = y - false_northing;
  
  const lng = lon0 + (dx / (k0 * 111320));
  const lat = lat0 + (dy / (k0 * 110540));

  return { lat, lng };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const url = 'https://sgisapi.kostat.go.kr/OpenAPI3/addr/geocode.json';
    
    const response = await sgisClient.makeAuthenticatedRequest<SGISGeocodeResponse>(
      url,
      {
        address: address,
        pagenum: '0',
        resultcount: '1'
      },
      { method: 'GET' }
    );

    if (!response.result?.resultdata || response.result.resultdata.length === 0) {
      return null;
    }

    const data: SGISGeocodeResultData = response.result.resultdata[0];
    
    // UTM-K 좌표를 WGS84로 변환
    const utmX = parseFloat(data.X);
    const utmY = parseFloat(data.Y);
    const { lat, lng } = utmkToWgs84(utmX, utmY);

    // 주소 포맷팅
    let formatted_address = '';
    if (data.sido_nm) formatted_address += data.sido_nm + ' ';
    if (data.sgg_nm) formatted_address += data.sgg_nm + ' ';
    if (data.adm_nm) formatted_address += data.adm_nm + ' ';
    if (data.road_nm) {
      formatted_address += data.road_nm;
      if (data.road_nm_main_no) {
        formatted_address += ' ' + data.road_nm_main_no;
        if (data.road_nm_sub_no && data.road_nm_sub_no !== '0') {
          formatted_address += '-' + data.road_nm_sub_no;
        }
      }
    } else if (data.leg_nm) {
      formatted_address += data.leg_nm;
      if (data.jibun_main_no) {
        formatted_address += ' ' + data.jibun_main_no;
        if (data.jibun_sub_no && data.jibun_sub_no !== '0') {
          formatted_address += '-' + data.jibun_sub_no;
        }
      }
    }

    return {
      lat,
      lng,
      sido_nm: data.sido_nm,
      sgg_nm: data.sgg_nm,
      adm_nm: data.adm_nm,
      formatted_address: formatted_address.trim(),
      addr_type: data.addr_type
    };

  } catch (error) {
    console.error('SGIS geocoding error:', error);
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  // 역지오코딩은 현재 SGIS API에서 직접 지원하지 않으므로
  // 필요한 경우 다른 API를 사용하거나 주변 주소 검색으로 대체
  console.warn('Reverse geocoding not implemented for SGIS API');
  return null;
}

// 주소 검색 결과에서 가장 정확한 매칭을 찾는 함수
export async function searchAddressWithDetails(
  address: string, 
  maxResults: number = 5
): Promise<GeocodeResult[]> {
  try {
    const url = 'https://sgisapi.kostat.go.kr/OpenAPI3/addr/geocode.json';
    
    const response = await sgisClient.makeAuthenticatedRequest<SGISGeocodeResponse>(
      url,
      {
        address: address,
        pagenum: '0',
        resultcount: maxResults.toString()
      },
      { method: 'GET' }
    );

    if (!response.result?.resultdata) {
      return [];
    }

    const results: GeocodeResult[] = [];

    for (const data of response.result.resultdata) {
      const utmX = parseFloat(data.X);
      const utmY = parseFloat(data.Y);
      const { lat, lng } = utmkToWgs84(utmX, utmY);

      // 주소 포맷팅
      let formatted_address = '';
      if (data.sido_nm) formatted_address += data.sido_nm + ' ';
      if (data.sgg_nm) formatted_address += data.sgg_nm + ' ';
      if (data.adm_nm) formatted_address += data.adm_nm + ' ';
      if (data.road_nm) {
        formatted_address += data.road_nm;
        if (data.road_nm_main_no) {
          formatted_address += ' ' + data.road_nm_main_no;
          if (data.road_nm_sub_no && data.road_nm_sub_no !== '0') {
            formatted_address += '-' + data.road_nm_sub_no;
          }
        }
      } else if (data.leg_nm) {
        formatted_address += data.leg_nm;
        if (data.jibun_main_no) {
          formatted_address += ' ' + data.jibun_main_no;
          if (data.jibun_sub_no && data.jibun_sub_no !== '0') {
            formatted_address += '-' + data.jibun_sub_no;
          }
        }
      }

      results.push({
        lat,
        lng,
        sido_nm: data.sido_nm,
        sgg_nm: data.sgg_nm,
        adm_nm: data.adm_nm,
        formatted_address: formatted_address.trim(),
        addr_type: data.addr_type
      });
    }

    return results;

  } catch (error) {
    console.error('SGIS address search error:', error);
    return [];
  }
}