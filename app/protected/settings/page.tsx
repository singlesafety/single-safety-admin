"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import CalendarStatusManager from "@/components/calendar-status-manager";
import { SETTING_KEYS } from "@/lib/types/settings";
import { 
  updateBooleanSetting, 
  getBooleanSetting 
} from "@/lib/supabase/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    [SETTING_KEYS.REQUIRE_AUTH]: false,
    [SETTING_KEYS.SAFE_ZONE_VIEWER]: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // 각 설정을 개별적으로 로드
      const requireAuth = await getBooleanSetting(SETTING_KEYS.REQUIRE_AUTH, false);
      const safeZoneViewer = await getBooleanSetting(SETTING_KEYS.SAFE_ZONE_VIEWER, false);

      setSettings({
        [SETTING_KEYS.REQUIRE_AUTH]: requireAuth,
        [SETTING_KEYS.SAFE_ZONE_VIEWER]: safeZoneViewer,
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      setError('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingKey: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [settingKey]: value
    }));
    setSaveStatus('idle');
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      setError(null);

      // 모든 설정을 순차적으로 저장
      await updateBooleanSetting(
        SETTING_KEYS.REQUIRE_AUTH, 
        settings[SETTING_KEYS.REQUIRE_AUTH],
        '본인인증 활성화 여부'
      );

      await updateBooleanSetting(
        SETTING_KEYS.SAFE_ZONE_VIEWER, 
        settings[SETTING_KEYS.SAFE_ZONE_VIEWER],
        '지역별 세이프 존 뷰어 활성화 여부'
      );

      setSaveStatus('success');
      
      // 3초 후 성공 메시지 초기화
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);

    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('설정 저장에 실패했습니다.');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">설정</h2>
          <p className="text-muted-foreground">
            싱글 세이프티 애플리케이션의 설정을 관리하세요.
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              설정을 불러오는 중...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">설정</h2>
        <p className="text-muted-foreground">
          싱글 세이프티 애플리케이션의 설정을 관리하세요.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Application Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="require-auth"
                checked={settings[SETTING_KEYS.REQUIRE_AUTH]}
                onCheckedChange={(checked) => 
                  handleSettingChange(SETTING_KEYS.REQUIRE_AUTH, checked as boolean)
                }
              />
              <Label htmlFor="require-auth">본인인증 활성화</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="safe-zone-viewer"
                checked={settings[SETTING_KEYS.SAFE_ZONE_VIEWER]}
                onCheckedChange={(checked) => 
                  handleSettingChange(SETTING_KEYS.SAFE_ZONE_VIEWER, checked as boolean)
                }
              />
              <Label htmlFor="safe-zone-viewer">지역별 세이프 존 뷰어 활성화</Label>
            </div>
          </CardContent>
        </Card>

        <CalendarStatusManager />

        <div className="flex justify-end gap-2">
          <Button 
            onClick={saveSettings}
            disabled={saving}
            className={`${
              saveStatus === 'success' 
                ? 'bg-green-600 hover:bg-green-700' 
                : saveStatus === 'error'
                ? 'bg-red-600 hover:bg-red-700'
                : ''
            }`}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saveStatus === 'success' ? (
              <CheckCircle className="mr-2 h-4 w-4" />
            ) : saveStatus === 'error' ? (
              <AlertCircle className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving 
              ? '저장 중...' 
              : saveStatus === 'success' 
              ? '저장 완료' 
              : saveStatus === 'error'
              ? '저장 실패'
              : '변경사항 저장'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}