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
  Settings
} from "lucide-react";
import { SafeZone, CreateSafeZoneData, UpdateSafeZoneData, MapPosition } from "@/lib/types/safezone";
import { createSafeZone, updateSafeZone } from "@/lib/supabase/safezones";
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
    lat: "",
    lng: "",
    level: "1",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canEditLatLng, setCanEditLatLng] = useState(false);

  useEffect(() => {
    if (safeZone && mode !== 'create') {
      setFormData({
        building_name: safeZone.building_name || "",
        contact: safeZone.contact || "",
        address: safeZone.address || "",
        lat: safeZone.lat?.toString() || "",
        lng: safeZone.lng?.toString() || "",
        level: safeZone.level?.toString() || "",
      });
    } else if (mode === 'create') {
      setFormData({
        building_name: "",
        contact: "",
        address: "",
        lat: initialPosition?.lat.toString() || "",
        lng: initialPosition?.lng.toString() || "",
        level: "",
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
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        level: formData.level.trim() ? parseInt(formData.level.trim()) : undefined,
      };

      if (mode === 'edit' && safeZone) {
        const updateData: UpdateSafeZoneData = {
          id: safeZone.id,
          ...safeZoneData,
        };
        await updateSafeZone(updateData);
      } else if (mode === 'create') {
        const createData: CreateSafeZoneData = safeZoneData as CreateSafeZoneData;
        await createSafeZone(createData);
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

  const handleAddressSelect = (position: MapPosition, address: string, buildingName?: string) => {
    setFormData(prev => ({
      ...prev,
      building_name: buildingName || prev.building_name, // 건물명이 있으면 자동 입력
      address: address,
      lat: position.lat.toString(),
      lng: position.lng.toString()
    }));
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
      case 'create': return '새 세이프 존 등록';
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 주소 검색 (최상단) */}
          {mode !== 'view' && (
            <div className="space-y-2">
              <Label htmlFor="address-search">주소 검색</Label>
              <AddressSearch
                onLocationSelect={handleAddressSelect}
                placeholder="주소를 검색하여 건물명과 위치를 자동으로 입력하세요..."
              />
              <p className="text-xs text-muted-foreground">
                주소를 검색하면 건물명과 좌표가 자동으로 입력됩니다
              </p>
            </div>
          )}

          {/* 기본 정보 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="building_name">건물명 *</Label>
              {mode === 'view' ? (
                <div className="p-2 bg-muted rounded flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  {safeZone?.building_name || '정보 없음'}
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
                <div className="p-2 bg-muted rounded flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {safeZone?.contact || '연락처 없음'}
                </div>
              ) : (
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={handleChange("contact")}
                  placeholder="연락처를 입력하세요 (선택사항)"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">주소</Label>
              {mode === 'view' ? (
                <div className="p-2 bg-muted rounded flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {safeZone?.address || '주소 없음'}
                </div>
              ) : (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleChange("address")}
                  placeholder="주소가 자동으로 입력됩니다 (또는 직접 입력)"
                  className="bg-muted/50"
                />
              )}
            </div>

            {/* 좌표 수정 설정 */}
            {mode !== 'view' && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label htmlFor="can-edit-latlng" className="text-sm font-medium">위도/경도 직접 수정</Label>
                    <p className="text-xs text-muted-foreground">주소 검색 대신 위도/경도를 직접 입력할 수 있습니다</p>
                  </div>
                </div>
                <input
                  id="can-edit-latlng"
                  type="checkbox"
                  checked={canEditLatLng}
                  onChange={(e) => setCanEditLatLng(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            )}

            {/* 좌표 정보 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">위도 *</Label>
                {mode === 'view' ? (
                  <div className="p-2 bg-muted rounded text-sm">
                    {safeZone?.lat?.toFixed(6) || '정보 없음'}
                  </div>
                ) : (
                  <Input
                    id="lat"
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={handleChange("lat")}
                    placeholder="위도"
                    disabled={!canEditLatLng}
                    className={`${errors.lat ? "border-red-500" : ""} ${!canEditLatLng ? "bg-muted" : ""}`}
                  />
                )}
                {errors.lat && (
                  <p className="text-sm text-red-500">{errors.lat}</p>
                )}
                {mode !== 'view' && !canEditLatLng && (
                  <p className="text-xs text-muted-foreground">주소 검색을 통해 자동으로 설정됩니다</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lng">경도 *</Label>
                {mode === 'view' ? (
                  <div className="p-2 bg-muted rounded text-sm">
                    {safeZone?.lng?.toFixed(6) || '정보 없음'}
                  </div>
                ) : (
                  <Input
                    id="lng"
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={handleChange("lng")}
                    placeholder="경도"
                    disabled={!canEditLatLng}
                    className={`${errors.lng ? "border-red-500" : ""} ${!canEditLatLng ? "bg-muted" : ""}`}
                  />
                )}
                {errors.lng && (
                  <p className="text-sm text-red-500">{errors.lng}</p>
                )}
                {mode !== 'view' && !canEditLatLng && (
                  <p className="text-xs text-muted-foreground">주소 검색을 통해 자동으로 설정됩니다</p>
                )}
              </div>
            </div>

            {/* 레벨 정보 */}
            <div className="space-y-2">
              <Label htmlFor="level">레벨 *</Label>
              {mode === 'view' ? (
                <div className="p-2 bg-muted rounded text-sm">
                  {safeZone?.level || '레벨 정보 없음'}
                </div>
              ) : (
                <Input
                  id="level"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.level}
                  onChange={handleChange("level")}
                  placeholder="레벨을 입력하세요 (선택사항)"
                />
              )}
            </div>

            {/* 등록일 (보기 모드일 때만) */}
            {mode === 'view' && safeZone && (
              <div className="space-y-2">
                <Label>등록일</Label>
                <div className="p-2 bg-muted rounded flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {formatDate(safeZone.created_at)}
                </div>
              </div>
            )}
          </div>

          {errors.general && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-700">{errors.general}</p>
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