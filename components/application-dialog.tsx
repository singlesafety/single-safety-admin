"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Package, 
  User,
  Plus,
  Minus,
  ShoppingCart
} from "lucide-react";
import { ApplicationWithProducts, CreateApplicationData, UpdateApplicationData } from "@/lib/types/application";
import { createApplicationWithProducts, updateApplication, updateApplicationProducts } from "@/lib/supabase/applications";
import { Product } from "@/lib/types/product";
import { getProducts } from "@/lib/supabase/products";

interface ApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  application?: ApplicationWithProducts | null;
  mode: 'view' | 'edit' | 'create';
}

export function ApplicationDialog({ open, onClose, application, mode }: ApplicationDialogProps) {
  const [formData, setFormData] = useState({
    building_name: "",
    contact: "",
    address: "",
    detail_address: "",
    installation_date: "",
    applicant_type: "tenant",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{[productId: string]: number}>({});

  useEffect(() => {
    if (application && mode !== 'create') {
      setFormData({
        building_name: application.building_name,
        contact: application.contact,
        address: application.address,
        detail_address: application.detail_address || "",
        installation_date: application.installation_date.split('T')[0], // Format for date input
        applicant_type: application.applicant_type || "tenant",
      });
    } else {
      setFormData({
        building_name: "",
        contact: "",
        address: "",
        detail_address: "",
        installation_date: "",
        applicant_type: "tenant",
      });
    }
    setErrors({});
    
    // Initialize selected products from application data
    if (application && application.application_products) {
      const productQuantities: {[productId: string]: number} = {};
      application.application_products.forEach(ap => {
        if (ap.product_id && ap.quantity) {
          productQuantities[ap.product_id] = ap.quantity;
        }
      });
      setSelectedProducts(productQuantities);
    } else {
      setSelectedProducts({});
    }
  }, [application, mode, open]);

  useEffect(() => {
    if (open && (mode === 'create' || mode === 'edit')) {
      loadProducts();
    }
  }, [open, mode]);

  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(prev => {
      if (quantity <= 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [productId]: _unused, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: quantity };
    });
  };

  const incrementProduct = (productId: string) => {
    const currentQuantity = selectedProducts[productId] || 0;
    updateProductQuantity(productId, currentQuantity + 1);
  };

  const decrementProduct = (productId: string) => {
    const currentQuantity = selectedProducts[productId] || 0;
    if (currentQuantity > 0) {
      updateProductQuantity(productId, currentQuantity - 1);
    }
  };

  const getTotalAmount = () => {
    return Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getTotalQuantity = () => {
    return Object.values(selectedProducts).reduce((total, quantity) => total + quantity, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.building_name.trim()) {
      newErrors.building_name = "건물명을 입력해주세요.";
    }

    if (!formData.contact.trim()) {
      newErrors.contact = "연락처를 입력해주세요.";
    }

    if (!formData.address.trim()) {
      newErrors.address = "주소를 입력해주세요.";
    }

    if (!formData.installation_date.trim()) {
      newErrors.installation_date = "설치 예정일을 입력해주세요.";
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
      const applicationData = {
        building_name: formData.building_name.trim(),
        contact: formData.contact.trim(),
        address: formData.address.trim(),
        detail_address: formData.detail_address.trim() || undefined,
        installation_date: new Date(formData.installation_date).toISOString(),
        applicant_type: formData.applicant_type,
      };

      if (mode === 'edit' && application) {
        const updateData: UpdateApplicationData = {
          id: application.id,
          ...applicationData,
        };
        await updateApplication(updateData);
        
        // Update application products
        await updateApplicationProducts(application.id, selectedProducts);
      } else if (mode === 'create') {
        const createData: CreateApplicationData = applicationData;
        await createApplicationWithProducts(createData, selectedProducts);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save application:', error);
      setErrors({ general: '신청서 저장에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getApplicantTypeLabel = (type: string) => {
    return type === 'tenant' ? '임차인' : '건물주';
  };

  const getTitle = () => {
    switch (mode) {
      case 'view': return '신청서 상세보기';
      case 'edit': return '신청서 수정';
      case 'create': return '새 신청서 등록';
      default: return '신청서';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'view': return '신청서 정보와 신청된 제품을 확인하세요.';
      case 'edit': return '신청서 정보를 수정하세요.';
      case 'create': return '새로운 신청서를 등록하세요.';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              기본 정보
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building_name">건물명 *</Label>
                {mode === 'view' ? (
                  <div className="p-2 bg-muted rounded">{application?.building_name}</div>
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
                <Label htmlFor="contact">연락처 *</Label>
                {mode === 'view' ? (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {application?.contact}
                  </div>
                ) : (
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={handleChange("contact")}
                    placeholder="연락처를 입력하세요"
                    className={errors.contact ? "border-red-500" : ""}
                  />
                )}
                {errors.contact && (
                  <p className="text-sm text-red-500">{errors.contact}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">주소 *</Label>
              {mode === 'view' ? (
                <div className="p-2 bg-muted rounded flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {application?.address}
                </div>
              ) : (
                <Input
                  id="address"
                  value={formData.address}
                  onChange={handleChange("address")}
                  placeholder="주소를 입력하세요"
                  className={errors.address ? "border-red-500" : ""}
                />
              )}
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail_address">상세 주소</Label>
              {mode === 'view' ? (
                <div className="p-2 bg-muted rounded">
                  {application?.detail_address || '상세 주소 없음'}
                </div>
              ) : (
                <Input
                  id="detail_address"
                  value={formData.detail_address}
                  onChange={handleChange("detail_address")}
                  placeholder="상세 주소를 입력하세요 (선택사항)"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installation_date">설치 예정일 *</Label>
                {mode === 'view' ? (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {application && formatDate(application.installation_date)}
                  </div>
                ) : (
                  <Input
                    id="installation_date"
                    type="date"
                    value={formData.installation_date}
                    onChange={handleChange("installation_date")}
                    className={errors.installation_date ? "border-red-500" : ""}
                  />
                )}
                {errors.installation_date && (
                  <p className="text-sm text-red-500">{errors.installation_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="applicant_type">신청자 구분</Label>
                {mode === 'view' ? (
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <Badge variant="outline">
                      {application && getApplicantTypeLabel(application.applicant_type || 'tenant')}
                    </Badge>
                  </div>
                ) : (
                  <select
                    id="applicant_type"
                    value={formData.applicant_type}
                    onChange={handleChange("applicant_type")}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="tenant">임차인</option>
                    <option value="owner">건물주</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* 신청 제품 정보 (보기 모드일 때만) */}
          {mode === 'view' && application?.application_products && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                신청 제품 ({application.total_quantity}개)
              </h3>
              
              <div className="space-y-3">
                {application.application_products.map((ap) => (
                  <div key={ap.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{ap.products?.name || '알 수 없는 제품'}</p>
                          <p className="text-sm text-muted-foreground">
                            수량: {ap.quantity}개 | 단가: ₩{ap.products?.price.toLocaleString() || '0'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          ₩{ap.products ? (ap.products.price * (ap.quantity || 0)).toLocaleString() : '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">총 금액</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₩{application.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 제품 선택 섹션 (생성/편집 모드일 때만) */}
          {(mode === 'create' || mode === 'edit') && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                제품 선택
              </h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {products.map((product) => {
                  const quantity = selectedProducts[product.id] || 0;
                  return (
                    <div key={product.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                ₩{product.price.toLocaleString()}
                                {product.price_description && ` - ${product.price_description}`}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => decrementProduct(product.id)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="w-8 text-center font-medium">
                            {quantity}
                          </span>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => incrementProduct(product.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          
                          {quantity > 0 && (
                            <span className="ml-2 font-medium text-green-600">
                              ₩{(product.price * quantity).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {getTotalQuantity() > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">
                      총 수량: {getTotalQuantity()}개
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      ₩{getTotalAmount().toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {errors.general && (
            <p className="text-sm text-red-500">{errors.general}</p>
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
                {loading ? "저장 중..." : mode === 'edit' ? "수정" : "등록"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}