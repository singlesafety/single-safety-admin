"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  FileCheck, 
  MapPin,
  Package,
  DollarSign,
  Activity,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { getApplicationStats } from "@/lib/supabase/applications";
import { getSafeZoneStats } from "@/lib/supabase/safezones";
import { getProductStats } from "@/lib/supabase/products";
import { ApplicationStats } from "@/lib/types/application";
import { SafeZoneStats } from "@/lib/types/safezone";
import { ProductStats } from "@/lib/types/product";

export default function DashboardPage() {
  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total_applications: 0,
    monthly_applications: 0,
    pending_applications: 0,
    total_revenue: 0
  });
  const [safeZoneStats, setSafeZoneStats] = useState<SafeZoneStats>({
    total_safezones: 0,
    recent_additions: 0,
    coverage_areas: 0
  });
  const [productStats, setProductStats] = useState<ProductStats>({
    total_products: 0,
    average_price: 0,
    recent_additions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 병렬로 모든 통계 데이터 로드
      const [appStats, safeStats, prodStats] = await Promise.all([
        getApplicationStats(),
        getSafeZoneStats(),
        getProductStats()
      ]);
      
      setApplicationStats(appStats);
      setSafeZoneStats(safeStats);
      setProductStats(prodStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">대시보드 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Single Safety 대시보드</h2>
        <p className="text-muted-foreground">
          Single Safety 시스템의 전체 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* 통계 카드 섹션 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">전체 신청서</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(applicationStats.total_applications)}</div>
            <p className="text-xs text-muted-foreground">
              이번 달: {formatNumber(applicationStats.monthly_applications)}건
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(applicationStats.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              신청서 기반 매출 집계
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">세이프 존</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(safeZoneStats.total_safezones)}</div>
            <p className="text-xs text-muted-foreground">
              최근 30일: {formatNumber(safeZoneStats.recent_additions)}개 추가
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">등록된 제품</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(productStats.total_products)}</div>
            <p className="text-xs text-muted-foreground">
              평균 가격: {formatCurrency(productStats.average_price)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 빠른 액션 섹션 */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/protected/applications">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <FileCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">신청서 관리</p>
                    <p className="text-xs text-muted-foreground">신청서 현황 확인 및 관리</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </div>
              </Button>
            </Link>

            <Link href="/protected/safezone">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <MapPin className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">세이프 존 관리</p>
                    <p className="text-xs text-muted-foreground">세이프 존 위치 및 정보 관리</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </div>
              </Button>
            </Link>

            <Link href="/protected/products">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">제품 관리</p>
                    <p className="text-xs text-muted-foreground">제품 정보 및 가격 관리</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </div>
              </Button>
            </Link>

            <Link href="/protected/settings">
              <Button variant="ghost" className="w-full justify-start h-auto p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                    <Shield className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">설정</p>
                    <p className="text-xs text-muted-foreground">시스템 설정 관리</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 ml-auto" />
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>최근 활동</CardTitle>
            <Button variant="outline" size="sm" onClick={loadDashboardData}>
              <Activity className="h-4 w-4 mr-2" />
              새로고침
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 실제 데이터 기반 최근 활동 */}
            <div className="space-y-3">
              {applicationStats.monthly_applications > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-500">
                    <FileCheck className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">이번 달 신청서 {formatNumber(applicationStats.monthly_applications)}건 접수</p>
                    <p className="text-xs text-muted-foreground">
                      총 매출: {formatCurrency(applicationStats.total_revenue)}
                    </p>
                  </div>
                  <Link href="/protected/applications">
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}

              {safeZoneStats.total_safezones > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 dark:bg-green-500">
                    <MapPin className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">총 {formatNumber(safeZoneStats.total_safezones)}개의 세이프 존 운영 중</p>
                    <p className="text-xs text-muted-foreground">
                      최근 30일간 {formatNumber(safeZoneStats.recent_additions)}개 추가
                    </p>
                  </div>
                  <Link href="/protected/safezone">
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}

              {productStats.total_products > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 dark:bg-purple-500">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{formatNumber(productStats.total_products)}개 제품 등록</p>
                    <p className="text-xs text-muted-foreground">
                      평균 가격: {formatCurrency(productStats.average_price)}
                    </p>
                  </div>
                  <Link href="/protected/products">
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}