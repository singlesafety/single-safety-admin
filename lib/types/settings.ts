export interface Setting {
  id: number;
  setting_name: string;
  setting_value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSettingData {
  setting_name: string;
  setting_value: string;
  description?: string;
}

export interface UpdateSettingData {
  setting_name: string;
  setting_value: string;
  description?: string;
}

export interface SettingsMap {
  [key: string]: string;
}

// 애플리케이션에서 사용하는 설정 키들
export const SETTING_KEYS = {
  REQUIRE_AUTH: 'require_auth',
  SAFE_ZONE_VIEWER: 'safe_zone_viewer'
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];