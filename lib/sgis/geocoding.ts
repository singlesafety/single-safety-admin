import { sgisClient } from './client';
import { SGISGeocodeResponse, SGISGeocodeResultData, AdminAreaResult } from '@/lib/types/sgis';


export async function getAdminArea(address: string): Promise<AdminAreaResult | null> {
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

export async function reverseGeocode(lat: number, lng: number): Promise<AdminAreaResult | null> {
  // 역지오코딩은 현재 SGIS API에서 직접 지원하지 않으므로
  // 필요한 경우 다른 API를 사용하거나 주변 주소 검색으로 대체
  console.warn('Reverse geocoding not implemented for SGIS API');
  return null;
}

// 주소 검색 결과에서 가장 정확한 매칭을 찾는 함수
export async function searchAdminAreas(
  address: string, 
  maxResults: number = 5
): Promise<AdminAreaResult[]> {
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

    const results: AdminAreaResult[] = [];

    for (const data of response.result.resultdata) {
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