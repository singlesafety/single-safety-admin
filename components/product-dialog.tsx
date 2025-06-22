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
import { Product, CreateProductData, UpdateProductData } from "@/lib/types/product";
import { createProduct, updateProduct } from "@/lib/supabase/products";

interface ProductDialogProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductDialog({ open, onClose, product }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    price_description: "",
    image_path: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: product.price.toString(),
        price_description: product.price_description || "",
        image_path: product.image_path,
      });
    } else {
      setFormData({
        name: "",
        price: "",
        price_description: "",
        image_path: "",
      });
    }
    setErrors({});
  }, [product, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "제품명을 입력해주세요.";
    }

    const price = parseInt(formData.price);
    if (!formData.price.trim() || isNaN(price) || price <= 0) {
      newErrors.price = "올바른 가격을 입력해주세요.";
    }

    if (!formData.image_path.trim()) {
      newErrors.image_path = "이미지 경로를 입력해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const productData = {
        name: formData.name.trim(),
        price: parseInt(formData.price),
        price_description: formData.price_description.trim() || null,
        image_path: formData.image_path.trim(),
      };

      if (product) {
        const updateData: UpdateProductData = {
          id: product.id,
          ...productData,
        };
        await updateProduct(updateData);
      } else {
        const createData: CreateProductData = productData;
        await createProduct(createData);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      setErrors({ general: '제품 저장에 실패했습니다.' });
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {product ? "제품 수정" : "제품 추가"}
          </DialogTitle>
          <DialogDescription>
            {product 
              ? "제품 정보를 수정하세요." 
              : "새로운 제품을 등록하세요."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">제품명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleChange("name")}
              placeholder="제품명을 입력하세요"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">가격 (원) *</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={handleChange("price")}
              placeholder="가격을 입력하세요"
              min="0"
              className={errors.price ? "border-red-500" : ""}
            />
            {errors.price && (
              <p className="text-sm text-red-500">{errors.price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_description">가격 설명</Label>
            <Input
              id="price_description"
              value={formData.price_description}
              onChange={handleChange("price_description")}
              placeholder="가격에 대한 설명 (선택사항)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_path">이미지 경로 *</Label>
            <Input
              id="image_path"
              value={formData.image_path}
              onChange={handleChange("image_path")}
              placeholder="이미지 URL을 입력하세요"
              className={errors.image_path ? "border-red-500" : ""}
            />
            {errors.image_path && (
              <p className="text-sm text-red-500">{errors.image_path}</p>
            )}
          </div>

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
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : product ? "수정" : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}