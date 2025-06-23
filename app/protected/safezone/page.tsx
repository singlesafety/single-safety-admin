"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Building, 
  Phone, 
  Map,
  List,
  Shield,
  Calendar
} from "lucide-react";
import { SafeZone, SafeZoneStats, MapPosition } from "@/lib/types/safezone";
import { 
  getSafeZones, 
  deleteSafeZone, 
  searchSafeZones, 
  getSafeZoneStats 
} from "@/lib/supabase/safezones";
import { GoogleMap } from "@/components/google-map";
import { SafeZoneDialog } from "@/components/safezone-dialog";

export default function SafeZonesPage() {
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [allSafeZones, setAllSafeZones] = useState<SafeZone[]>([]);
  const [stats, setStats] = useState<SafeZoneStats>({
    total_safezones: 0,
    recent_additions: 0,
    coverage_areas: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [selectedSafeZone, setSelectedSafeZone] = useState<SafeZone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');
  const [addMode, setAddMode] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<MapPosition | null>(null);

  useEffect(() => {
    loadSafeZones();
    loadStats();
  }, []);

  const loadSafeZones = async () => {
    try {
      setLoading(true);
      const data = await getSafeZones();
      setAllSafeZones(data);
      setSafeZones(data);
    } catch (error) {
      console.error('Failed to load safezones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getSafeZoneStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchSafeZones(query);
        setSafeZones(results);
      } catch (error) {
        console.error('Failed to search safezones:', error);
      }
    } else {
      setSafeZones(allSafeZones);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('정말로 이 세이프 존을 삭제하시겠습니까?')) {
      try {
        await deleteSafeZone(id);
        loadSafeZones();
        loadStats();
        if (selectedSafeZone?.id === id) {
          setSelectedSafeZone(null);
        }
      } catch (error) {
        console.error('Failed to delete safezone:', error);
      }
    }
  };

  const handleView = (safeZone: SafeZone) => {
    setSelectedSafeZone(safeZone);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (safeZone: SafeZone) => {
    setSelectedSafeZone(safeZone);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedSafeZone(null);
    setDialogMode('create');
    setNewMarkerPosition(null);
    setAddMode(true);
    setViewMode('map');
  };

  const handleMapClick = (position: MapPosition) => {
    if (addMode) {
      setNewMarkerPosition(position);
      setDialogMode('create');
      setIsDialogOpen(true);
      setAddMode(false);
    }
  };

  const handleMarkerClick = (safeZone: SafeZone) => {
    setSelectedSafeZone(safeZone);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSafeZone(null);
    setNewMarkerPosition(null);
    setAddMode(false);
    loadSafeZones();
    loadStats();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">세이프 존 관리</h2>
          <p className="text-muted-foreground">
            Single Safety 제품이 설치된 세이프 존을 관리하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="건물명, 연락처, 주소로 검색..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <List className="mr-2 h-4 w-4" />
              목록
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-l-none"
            >
              <Map className="mr-2 h-4 w-4" />
              지도
            </Button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            세이프 존 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 세이프 존</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_safezones}</div>
            <p className="text-xs text-muted-foreground">등록된 세이프 존</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">최근 추가</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recent_additions}</div>
            <p className="text-xs text-muted-foreground">지난 30일</p>
          </CardContent>
        </Card>
      </div>

      {/* 메인 콘텐츠 */}
      {viewMode === 'map' ? (
        <Card>
          <CardHeader>
            <CardTitle>세이프 존 지도</CardTitle>
            {addMode && (
              <p className="text-sm text-muted-foreground">
                지도를 클릭하여 새 세이프 존 위치를 선택하세요.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <GoogleMap
              safeZones={safeZones}
              onMarkerClick={handleMarkerClick}
              onMapClick={handleMapClick}
              selectedSafeZone={selectedSafeZone}
              showAddMode={addMode}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>세이프 존 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">로딩 중...</div>
              </div>
            ) : safeZones.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Shield className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">등록된 세이프 존이 없습니다.</p>
                <Button onClick={handleAdd} className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  첫 번째 세이프 존 추가
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {safeZones.map((safeZone) => (
                  <Card key={safeZone.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <Building className="h-4 w-4" />
                              {safeZone.building_name || '세이프 존'}
                            </h3>
                            <Badge variant="outline">
                              활성
                            </Badge>
                          </div>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {safeZone.contact && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {safeZone.contact}
                              </div>
                            )}
                            {safeZone.address && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {safeZone.address}
                              </div>
                            )}
                            {safeZone.lat && safeZone.lng && (
                              <div className="text-xs">
                                좌표: {safeZone.lat.toFixed(6)}, {safeZone.lng.toFixed(6)}
                              </div>
                            )}
                            {safeZone.level && (
                              <div className="text-xs">
                                레벨: {safeZone.level}
                              </div>
                            )}
                            <div className="text-xs">
                              등록일: {formatDate(safeZone.created_at)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleView(safeZone)}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            보기
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(safeZone)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            수정
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(safeZone.id)}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SafeZoneDialog 
        open={isDialogOpen}
        onClose={handleDialogClose}
        safeZone={selectedSafeZone}
        mode={dialogMode}
        initialPosition={newMarkerPosition}
      />
    </div>
  );
}