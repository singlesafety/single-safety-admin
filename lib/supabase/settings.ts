import { createClient } from "./client";
import { Setting, CreateSettingData, UpdateSettingData, SettingsMap } from "@/lib/types/settings";

export async function getSettings(): Promise<Setting[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('setting_name');

  if (error) {
    throw new Error(`Failed to fetch settings: ${error.message}`);
  }

  return data || [];
}

export async function getSettingsMap(): Promise<SettingsMap> {
  const settings = await getSettings();
  const settingsMap: SettingsMap = {};
  
  settings.forEach(setting => {
    settingsMap[setting.setting_name] = setting.setting_value;
  });
  
  return settingsMap;
}

export async function getSetting(settingName: string): Promise<Setting | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('setting_name', settingName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch setting: ${error.message}`);
  }

  return data;
}

export async function createSetting(settingData: CreateSettingData): Promise<Setting> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('settings')
    .insert([{
      ...settingData,
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create setting: ${error.message}`);
  }

  return data;
}

export async function updateSetting(settingName: string, settingValue: string, description?: string): Promise<Setting> {
  const supabase = createClient();
  
  const updateData: any = {
    setting_value: settingValue,
    updated_at: new Date().toISOString()
  };
  
  if (description !== undefined) {
    updateData.description = description;
  }

  const { data, error } = await supabase
    .from('settings')
    .update(updateData)
    .eq('setting_name', settingName)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update setting: ${error.message}`);
  }

  return data;
}

export async function upsertSetting(settingData: UpdateSettingData): Promise<Setting> {
  const supabase = createClient();
  
  // 먼저 설정이 존재하는지 확인
  const existingSetting = await getSetting(settingData.setting_name);
  
  if (existingSetting) {
    // 업데이트
    return await updateSetting(
      settingData.setting_name, 
      settingData.setting_value, 
      settingData.description
    );
  } else {
    // 생성
    return await createSetting(settingData);
  }
}

export async function deleteSetting(settingName: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('settings')
    .delete()
    .eq('setting_name', settingName);

  if (error) {
    throw new Error(`Failed to delete setting: ${error.message}`);
  }
}

// 특정 설정값을 boolean으로 가져오기
export async function getBooleanSetting(settingName: string, defaultValue: boolean = false): Promise<boolean> {
  try {
    const setting = await getSetting(settingName);
    if (!setting) return defaultValue;
    
    const value = setting.setting_value.toLowerCase();
    return value === 'true' || value === '1' || value === 'yes';
  } catch (error) {
    console.error(`Error getting boolean setting ${settingName}:`, error);
    return defaultValue;
  }
}

// boolean 설정값 업데이트
export async function updateBooleanSetting(settingName: string, value: boolean, description?: string): Promise<Setting> {
  return await upsertSetting({
    setting_name: settingName,
    setting_value: value ? 'true' : 'false',
    description
  });
}