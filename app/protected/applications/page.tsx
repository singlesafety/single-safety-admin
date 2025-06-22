"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Plus, 
  Search, 
  Eye, 
  Trash2, 
  Building, 
  Phone, 
  MapPin,
  Calendar,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { ApplicationWithProducts, ApplicationStats } from "@/lib/types/application";
import { getApplications, deleteApplication, searchApplications, getApplicationStats } from "@/lib/supabase/applications";
import { ApplicationDialog } from "@/components/application-dialog";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithProducts | null>(null);
  const [dialogMode, setDialogMode] = useState<'view' | 'edit' | 'create'>('view');

  useEffect(() => {
    loadApplications();
    loadStats();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
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
    if (query.trim()) {
      try {
        const results = await searchApplications(query);
        setApplications(results);
      } catch (error) {
        console.error('Failed to search applications:', error);
      }
    } else {
      loadApplications();
    }
  };

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

  const handleView = (application: ApplicationWithProducts) => {
    setSelectedApplication(application);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleEdit = (application: ApplicationWithProducts) => {
    setSelectedApplication(application);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedApplication(null);
    setDialogMode('create');
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedApplication(null);
    loadApplications();
    loadStats();
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">처리 대기</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_applications}</div>
            <p className="text-xs text-muted-foreground">처리 대기 중</p>
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
                              <span className="text-lg font-bold text-green-600">
                                ₩{application.total_amount?.toLocaleString()}
                              </span>
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
                                {application.application_products.map((ap) => (
                                  <div key={ap.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <p className="font-medium">{ap.products?.name || '알 수 없는 제품'}</p>
                                        <p className="text-sm text-muted-foreground">
                                          수량: {ap.quantity}개
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">
                                        ₩{ap.products ? (ap.products.price * (ap.quantity || 0)).toLocaleString() : '0'}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        단가: ₩{ap.products?.price.toLocaleString() || '0'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
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

      <ApplicationDialog 
        open={isDialogOpen}
        onClose={handleDialogClose}
        application={selectedApplication}
        mode={dialogMode}
      />
    </div>
  );
}