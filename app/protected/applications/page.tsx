"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Search, 
  Trash2, 
  Building, 
  Phone, 
  MapPin,
  Calendar,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  CalendarDays
} from "lucide-react";
import { ApplicationWithProducts, ApplicationStats } from "@/lib/types/application";
import { getApplications, deleteApplication, getApplicationStats } from "@/lib/supabase/applications";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithProducts[]>([]);
  const [stats, setStats] = useState<ApplicationStats>({
    total_applications: 0,
    monthly_applications: 0,
    pending_applications: 0,
    total_revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApplications, setExpandedApplications] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    applicantType: "",
    minAmount: "",
    maxAmount: "",
    installationDateFrom: "",
    installationDateTo: ""
  });
  const [allApplications, setAllApplications] = useState<ApplicationWithProducts[]>([]);

  useEffect(() => {
    loadApplications();
    loadStats();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setAllApplications(data);
      setApplications(data);
    } catch (error) {
      console.error('Failed to load applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getApplicationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    applyFilters(query, filters);
  };

  const applyFilters = (searchQuery: string, filterValues: typeof filters) => {
    let filtered = [...allApplications];

    // 검색어 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.building_name.toLowerCase().includes(query) ||
        app.contact.toLowerCase().includes(query) ||
        app.address.toLowerCase().includes(query)
      );
    }

    // 신청일 필터링
    if (filterValues.dateFrom) {
      const fromDate = new Date(filterValues.dateFrom);
      filtered = filtered.filter(app => new Date(app.created_at) >= fromDate);
    }
    if (filterValues.dateTo) {
      const toDate = new Date(filterValues.dateTo);
      toDate.setHours(23, 59, 59, 999); // 해당 날짜 끝까지
      filtered = filtered.filter(app => new Date(app.created_at) <= toDate);
    }

    // 설치일 필터링
    if (filterValues.installationDateFrom) {
      const fromDate = new Date(filterValues.installationDateFrom);
      filtered = filtered.filter(app => new Date(app.installation_date) >= fromDate);
    }
    if (filterValues.installationDateTo) {
      const toDate = new Date(filterValues.installationDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(app => new Date(app.installation_date) <= toDate);
    }

    // 신청자 타입 필터링
    if (filterValues.applicantType) {
      filtered = filtered.filter(app => {
        const appType = app.applicant_type;
        // DB에서 'tenent'로 저장된 경우도 'tenant'로 처리
        const normalizedAppType = appType === 'tenent' ? 'tenant' : appType;
        const matches = normalizedAppType === filterValues.applicantType;
        
        // 디버깅용 로그 (개발 중에만 사용)
        if (process.env.NODE_ENV === 'development') {
          console.log(`App: ${app.building_name}, Type: "${appType}" -> "${normalizedAppType}", Filter: "${filterValues.applicantType}", Matches: ${matches}`);
        }
        
        return matches;
      });
    }

    // 금액 필터링
    if (filterValues.minAmount) {
      const minAmount = parseInt(filterValues.minAmount);
      filtered = filtered.filter(app => (app.total_amount || 0) >= minAmount);
    }
    if (filterValues.maxAmount) {
      const maxAmount = parseInt(filterValues.maxAmount);
      filtered = filtered.filter(app => (app.total_amount || 0) <= maxAmount);
    }

    setApplications(filtered);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    applyFilters(searchQuery, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      dateFrom: "",
      dateTo: "",
      applicantType: "",
      minAmount: "",
      maxAmount: "",
      installationDateFrom: "",
      installationDateTo: ""
    };
    setFilters(clearedFilters);
    applyFilters(searchQuery, clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const handleDelete = async (id: number) => {
    if (confirm('정말로 이 신청서를 삭제하시겠습니까?')) {
      try {
        await deleteApplication(id);
        loadApplications();
        loadStats();
      } catch (error) {
        console.error('Failed to delete application:', error);
      }
    }
  };

  const toggleExpanded = (applicationId: number) => {
    const newExpanded = new Set(expandedApplications);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedApplications(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getApplicantTypeLabel = (type: string | null) => {
    switch (type) {
      case 'tenant':
        return '임차인';
      case 'owner':
        return '건물주';
      default:
        return '임차인';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">신청 관리</h2>
          <p className="text-muted-foreground">
            Single Safety 제품 신청서를 관리하고 처리하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="건물명, 연락처로 검색..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="mr-2 h-4 w-4" />
            필터
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3 w-3" />
              초기화
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 신청</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_applications}</div>
            <p className="text-xs text-muted-foreground">누적 신청 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 신청</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthly_applications}</div>
            <p className="text-xs text-muted-foreground">이번 달 신청 수</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{stats.total_revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">전체 매출액</p>
          </CardContent>
        </Card>
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              필터 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 신청일 범위 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-3 w-3" />
                  신청일 시작
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">신청일 종료</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>

              {/* 설치일 범위 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  설치일 시작
                </label>
                <Input
                  type="date"
                  value={filters.installationDateFrom}
                  onChange={(e) => handleFilterChange("installationDateFrom", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">설치일 종료</label>
                <Input
                  type="date"
                  value={filters.installationDateTo}
                  onChange={(e) => handleFilterChange("installationDateTo", e.target.value)}
                />
              </div>

              {/* 신청자 타입 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">신청자 구분</label>
                <select
                  value={filters.applicantType}
                  onChange={(e) => handleFilterChange("applicantType", e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                >
                  <option value="">전체</option>
                  <option value="tenant">임차인</option>
                  <option value="owner">건물주</option>
                </select>
              </div>

              {/* 금액 범위 */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  최소 금액
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">최대 금액</label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                />
              </div>

              {/* 빈 공간과 액션 버튼 */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  <X className="mr-2 h-3 w-3" />
                  모든 필터 초기화
                </Button>
              </div>
            </div>

            {/* 필터 결과 표시 */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  전체 {allApplications.length}개 중 {applications.length}개 표시
                </span>
                {hasActiveFilters && (
                  <span className="text-blue-600">필터 적용됨</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>신청서 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">로딩 중...</div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <FileCheck className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">등록된 신청서가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => {
                const isExpanded = expandedApplications.has(application.id);
                return (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {application.building_name}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {application.contact}
                                </span>
                                <Badge variant="outline">
                                  {getApplicantTypeLabel(application.applicant_type)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {application.address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              설치일: {formatDate(application.installation_date)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                신청일: {formatDate(application.created_at)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                제품 {application.total_quantity}개
                              </span>
                              <div className="flex items-center gap-2">
                                {application.has_discount && (
                                  <>
                                    <span className="text-sm text-muted-foreground line-through">
                                      ₩{application.original_amount?.toLocaleString()}
                                    </span>
                                    <Badge variant="destructive" className="text-xs">
                                      할인 적용됨
                                    </Badge>
                                  </>
                                )}
                                <span className="text-lg font-bold text-green-600">
                                  ₩{application.total_amount?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(application.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="mr-1 h-3 w-3" />
                                    접기
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="mr-1 h-3 w-3" />
                                    상세보기
                                  </>
                                )}
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(application.id)}
                              >
                                <Trash2 className="mr-1 h-3 w-3" />
                                삭제
                              </Button>
                            </div>
                          </div>

                          {isExpanded && application.application_products && (
                            <div className="mt-4 pt-4 border-t">
                              <h4 className="font-medium mb-3">신청 제품 목록</h4>
                              <div className="space-y-2">
                                {application.application_products.map((ap) => {
                                  const isOwner = application.applicant_type === 'owner';
                                  const isSinglePackage = ap.product_id === 'single_package';
                                  const hasProductDiscount = isOwner && isSinglePackage && application.has_discount;
                                  const originalPrice = ap.products ? ap.products.price * (ap.quantity || 0) : 0;
                                  const discountedPrice = hasProductDiscount ? originalPrice * 0.7 : originalPrice;
                                  
                                  return (
                                    <div key={ap.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                      <div className="flex items-center gap-3">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                          <p className="font-medium flex items-center gap-2">
                                            {ap.products?.name || '알 수 없는 제품'}
                                            {hasProductDiscount && (
                                              <Badge variant="destructive" className="text-xs">30% 할인</Badge>
                                            )}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            수량: {ap.quantity}개
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {hasProductDiscount ? (
                                          <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground line-through">
                                              ₩{originalPrice.toLocaleString()}
                                            </p>
                                            <p className="font-medium">
                                              ₩{discountedPrice.toLocaleString()}
                                            </p>
                                          </div>
                                        ) : (
                                          <p className="font-medium">
                                            ₩{originalPrice.toLocaleString()}
                                          </p>
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                          단가: ₩{ap.products?.price.toLocaleString() || '0'}
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}