export interface SGISAuthRequest {
  consumer_key: string;
  consumer_secret: string;
}

export interface SGISAuthResponse {
  result: {
    accessToken: string;
    accessTimeout: string;
  };
}

export interface SGISTokenInfo {
  accessToken: string;
  expiresAt: Date;
}

export interface SGISError {
  errMsg: string;
  errCd: string;
}

export interface SGISGeocodeRequest {
  accessToken: string;
  address: string;
  pagenum?: number;
  resultcount?: number;
}

export interface SGISGeocodeResultData {
  sido_nm: string;
  sido_cd: string;
  sgg_nm: string;
  sgg_cd: string;
  adm_nm: string;
  adm_cd: string;
  leg_nm?: string;
  leg_cd?: string;
  ri_nm?: string;
  ri_cd?: string;
  road_nm?: string;
  road_cd?: string;
  road_nm_main_no?: string;
  road_nm_sub_no?: string;
  bd_main_nm?: string;
  bd_sub_nm?: string;
  jibun_main_no?: string;
  jibun_sub_no?: string;
  X: string; // UTM-K X좌표
  Y: string; // UTM-K Y좌표
  addr_type: string;
}

export interface SGISGeocodeResponse {
  result: {
    totalcount: string;
    pagenum: string;
    returncount: string;
    matching: string;
    resultdata: SGISGeocodeResultData[];
  };
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  sido_nm: string;
  sgg_nm: string;
  adm_nm: string;
  formatted_address: string;
  addr_type: string;
}

export interface AdminAreaResult {
  sido_nm: string;
  sgg_nm: string;
  adm_nm: string;
  formatted_address: string;
  addr_type: string;
}