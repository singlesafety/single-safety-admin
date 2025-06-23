import { Product } from "./product";

export interface Application {
  id: number;
  building_name: string;
  contact: string;
  address: string;
  detail_address: string | null;
  installation_date: string;
  created_at: string;
  applicant_type: string | null;
}

export interface ApplicationProduct {
  id: number;
  created_at: string;
  application_id: number | null;
  product_id: string | null;
  quantity: number | null;
}

export interface ApplicationWithProducts extends Application {
  application_products: (ApplicationProduct & {
    products: Product | null;
  })[];
  total_amount?: number;
  total_quantity?: number;
}

export interface CreateApplicationData {
  building_name: string;
  contact: string;
  address: string;
  detail_address?: string;
  installation_date: string;
  applicant_type?: string;
}

export interface UpdateApplicationData extends Partial<CreateApplicationData> {
  id: number;
}

export interface ApplicationStatus {
  id: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  updated_at: string;
}

export interface ApplicationStats {
  total_applications: number;
  monthly_applications: number;
  pending_applications: number;
  total_revenue: number;
}