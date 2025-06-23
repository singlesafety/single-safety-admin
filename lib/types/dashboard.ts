export interface DashboardStats {
  applications: {
    total: number;
    monthly: number;
    revenue: number;
  };
  safezones: {
    total: number;
    recent: number;
  };
  products: {
    total: number;
    averagePrice: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'application' | 'safezone' | 'product';
  title: string;
  description: string;
  timestamp: string;
  icon: 'FileCheck' | 'MapPin' | 'Package';
}