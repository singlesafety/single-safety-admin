"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Building, 
  Phone, 
  MapPin, 
  Calendar,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { SafeZone, CreateSafeZoneData, UpdateSafeZoneData, MapPosition } from "@/lib/types/safezone";
import { createSafeZoneWithGeocoding, updateSafeZoneWithGeocoding } from "@/lib/supabase/safezones";
import { getAdminAreaClient } from "@/lib/api/sgis-client";
import { AddressSearch } from "@/components/address-search";

interface SafeZoneDialogProps {
  open: boolean;
  onClose: () => void;
  safeZone?: SafeZone | null;
  mode: 'view' | 'edit' | 'create';
  initialPosition?: MapPosition | null;
}

export function SafeZoneDialog({ 
  open, 
  onClose, 
  safeZone, 
  mode,
  initialPosition 
}: SafeZoneDialogProps) {
  const [formData, setFormData] = useState({
    building_name: "",
    contact: "",
    address: "",
    detail_address: "",
    lat: "",
    lng: "",
    level: "1",
    sido_nm: "",
    sgg_nm: "",
    adm_nm: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (safeZone && mode !== 'create') {
      setFormData({
        building_name: safeZone.building_name || "",
        contact: safeZone.contact || "",
        address: safeZone.address || "",
        detail_address: safeZone.detail_address || "",
        lat: safeZone.lat?.toString() || "",
        lng: safeZone.lng?.toString() || "",
        level: safeZone.level?.toString() || "",
        sido_nm: safeZone.sido_nm || "",
        sgg_nm: safeZone.sgg_nm || "",
        adm_nm: safeZone.adm_nm || "",
      });
    } else if (mode === 'create') {
      setFormData({
        building_name: "",
        contact: "",
        address: "",
        detail_address: "",
        lat: initialPosition?.lat.toString() || "",
        lng: initialPosition?.lng.toString() || "",
        level: "1",
        sido_nm: "",
        sgg_nm: "",
        adm_nm: "",
      });
    }
    setErrors({});
  }, [safeZone, mode, open, initialPosition]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.building_name.trim()) {
      newErrors.building_name = "건물명을 입력해주세요.";
    }

    const lat = parseFloat(formData.lat);
    if (!formData.lat.trim() || isNaN(lat) || lat < -90 || lat > 90) {
      newErrors.lat = "올바른 위도를 입력해주세요 (-90 ~ 90).";
    }

    const lng = parseFloat(formData.lng);
    if (!formData.lng.trim() || isNaN(lng) || lng < -180 || lng > 180) {
      newErrors.lng = "올바른 경도를 입력해주세요 (-180 ~ 180).";
    }

    const level = parseInt(formData.level);
    if (!formData.level.trim() || isNaN(level) || level < 1 || level > 3) {
      newErrors.level = "레벨을 입력해주세요 (1 ~ 3).";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'view') {
      onClose();
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const safeZoneData = {
        building_name: formData.building_name.trim(),
        contact: formData.contact.trim() || undefined,
        address: formData.address.trim() || undefined,
        detail_address: formData.detail_address.trim() || undefined,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        level: formData.level.trim() ? parseInt(formData.level.trim()) : undefined,
        sido_nm: formData.sido_nm.trim() || undefined,
        sgg_nm: formData.sgg_nm.trim() || undefined,
        adm_nm: formData.adm_nm.trim() || undefined,
      };

      if (mode === 'edit' && safeZone) {
        const updateData: UpdateSafeZoneData = {
          id: safeZone.id,
          ...safeZoneData,
        };
        await updateSafeZoneWithGeocoding(updateData);
      } else if (mode === 'create') {
        const createData: CreateSafeZoneData = safeZoneData as CreateSafeZoneData;
        await createSafeZoneWithGeocoding(createData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save safezone:', error);
      setErrors({ general: '세이프 존 저장에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddressSelect = async (position: MapPosition, address: string, buildingName?: string) => {
    setFormData(prev => ({
      ...prev,
      building_name: buildingName || prev.building_name,
      address: address,
      lat: position.lat.toString(),
      lng: position.lng.toString()
    }));
    
    // SGIS API로 행정구역 정보 자동 채우기
    try {
      const adminAreaResult = await getAdminAreaClient(address);
      if (adminAreaResult) {
        setFormData(prev => ({
          ...prev,
          sido_nm: adminAreaResult.sido_nm,
          sgg_nm: adminAreaResult.sgg_nm,
          adm_nm: adminAreaResult.adm_nm
        }));
      }
    } catch (error) {
      console.warn('Failed to fetch administrative info:', error);
    }
    
    // 주소 관련 에러 클리어
    setErrors(prev => ({
      ...prev,
      building_name: "",
      address: "",
      lat: "",
      lng: ""
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getTitle = () => {
    switch (mode) {
      case 'view': return '세이프 존 상세보기';
      case 'edit': return '세이프 존 수정';
      case 'create': return '세이프 존 등록';
      default: return '세이프 존';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'view': return '세이프 존 정보를 확인하세요.';
      case 'edit': return '세이프 존 정보를 수정하세요.';
      case 'create': return '새로운 세이프 존을 등록하세요.';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[800px] xl:max-w-[1000px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* 주소 검색 및 입력 */}
          {mode !== 'view' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="address-search" className="text-base font-semibold text-blue-900 dark:text-blue-100">주소 정보</Label>
              </div>
              
              <div>
                <AddressSearch
                  onLocationSelect={handleAddressSelect}
                  placeholder="주소를 검색하여 건물명과 위치를 자동으로 입력하세요..."
                />
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  주소를 검색하면 건물명과 좌표가 자동으로 입력됩니다
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="address">기본 주소</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={handleChange("address")}
                    placeholder="주소가 자동으로 입력됩니다"
                    className="bg-blue-50 dark:bg-blue-950/30 dark:text-blue-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="detail_address">상세주소</Label>
                  <Input
                    id="detail_address"
                    value={formData.detail_address}
                    onChange={handleChange("detail_address")}
                    placeholder="동, 호수, 층수 등"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 주소 정보 (보기 모드) */}
          {mode === 'view' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">주소 정보</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 기본 주소 */}
                <div className="space-y-2">
                  <Label>기본 주소</Label>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-200">{safeZone?.address || '주소 없음'}</span>
                  </div>
                </div>
                
                {/* 상세주소 */}
                <div className="space-y-2">
                  <Label>상세주소</Label>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm dark:text-gray-200">{safeZone?.detail_address || '상세주소 없음'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 메인 콘텐츠 - 3열 레이아웃 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* 첫 번째 열: 기본 정보 */}
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">기본 정보</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="building_name">건물명</Label>
                    {mode === 'view' ? (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="dark:text-gray-200">{safeZone?.building_name || '정보 없음'}</span>
                      </div>
                    ) : (
                      <Input
                        id="building_name"
                        value={formData.building_name}
                        onChange={handleChange("building_name")}
                        placeholder="건물명을 입력하세요"
                        className={errors.building_name ? "border-red-500" : ""}
                      />
                    )}
                    {errors.building_name && (
                      <p className="text-sm text-red-500">{errors.building_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact">연락처</Label>
                    {mode === 'view' ? (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <span className="dark:text-gray-200">{safeZone?.contact || '연락처 없음'}</span>
                      </div>
                    ) : (
                      <Input
                        id="contact"
                        value={formData.contact}
                        onChange={handleChange("contact")}
                        placeholder="연락처를 입력하세요..."
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">레벨</Label>
                    {mode === 'view' ? (
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 flex items-center gap-2">
                        <span className="text-sm font-medium dark:text-gray-200">Level {safeZone?.level || '정보 없음'}</span>
                      </div>
                    ) : (
                      <Input
                        id="level"
                        type="number"
                        min="1"
                        max="3"
                        value={formData.level}
                        onChange={handleChange("level")}
                        placeholder="레벨을 입력하세요 (1-3)"
                        className={errors.level ? "border-red-500" : ""}
                      />
                    )}
                    {errors.level && (
                      <p className="text-sm text-red-500">{errors.level}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 두 번째 열: 좌표 정보 */}
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-base font-semibold text-green-900 dark:text-green-100">좌표 정보</h3>
                </div>
                
                <div className="space-y-4">
                  {mode !== 'view' && (
                    <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded border border-green-300 dark:border-green-700 mb-4">
                      <p className="text-xs text-green-700 dark:text-green-300">
                        주소 검색 시 GPS 좌표가 자동으로 입력됩니다
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="lat">위도</Label>
                      {mode === 'view' ? (
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 text-sm font-mono dark:text-gray-200">
                          {safeZone?.lat?.toFixed(6) || '정보 없음'}
                        </div>
                      ) : (
                        <Input
                          id="lat"
                          type="number"
                          step="any"
                          value={formData.lat}
                          onChange={handleChange("lat")}
                          placeholder="자동으로 입력됩니다..."
                          className={`${errors.lat ? "border-red-500" : ""} bg-green-50 dark:bg-green-950/30 font-mono text-sm dark:text-gray-200`}
                        />
                      )}
                      {errors.lat && (
                        <p className="text-sm text-red-500">{errors.lat}</p>
                      )}
                      {mode !== 'view' && (
                        <p className="text-xs text-green-700 dark:text-green-300">자동 설정됨</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lng">경도</Label>
                      {mode === 'view' ? (
                        <div className="p-3 bg-white dark:bg-gray-800 rounded border dark:border-gray-600 text-sm font-mono dark:text-gray-200">
                          {safeZone?.lng?.toFixed(6) || '정보 없음'}
                        </div>
                      ) : (
                        <Input
                          id="lng"
                          type="number"
                          step="any"
                          value={formData.lng}
                          onChange={handleChange("lng")}
                          placeholder="자동으로 입력됩니다..."
                          className={`${errors.lng ? "border-red-500" : ""} bg-green-50 dark:bg-green-950/30 font-mono text-sm dark:text-gray-200`}
                        />
                      )}
                      {errors.lng && (
                        <p className="text-sm text-red-500">{errors.lng}</p>
                      )}
                      {mode !== 'view' && (
                        <p className="text-xs text-green-700 dark:text-green-300">자동 설정됨</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 세 번째 열: 행정구역 정보 */}
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">행정구역</h3>
                </div>
                
                <div className="space-y-3">
                  {mode === 'view' ? (
                    <>
                      <div className="p-3 bg-white dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">시도</div>
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {safeZone?.sido_nm || '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">시군구</div>
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {safeZone?.sgg_nm || '-'}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">행정동</div>
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {safeZone?.adm_nm || '-'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-white dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">시도</div>
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {formData.sido_nm || '자동입력'}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">시군구</div>
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {formData.sgg_nm || '자동입력'}
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-indigo-900/30 rounded border border-indigo-300 dark:border-indigo-700">
                        <div className="text-xs text-indigo-700 dark:text-indigo-300 mb-1">행정동</div>
                        <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                          {formData.adm_nm || '자동입력'}
                        </div>
                      </div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                        주소 검색 시 자동으로 입력됩니다
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{errors.general}</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {mode === 'view' ? '닫기' : '취소'}
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {mode === 'edit' ? '수정' : '등록'}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}