export type UserRole = 'admin' | 'operator';
export type MilkShift = 'morning' | 'evening';
export type MilkType = 'cow' | 'buffalo';
export type QuantityUnit = 'litre';
export type BillStatus = 'draft' | 'finalized';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DairySettings {
  id: string;
  dairy_name: string;
  timezone: string;
  morning_start: string;
  morning_end: string;
  evening_start: string;
  evening_end: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string | null;
}

export interface Farmer {
  id: string;
  name: string;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectionRateRule {
  id: string;
  milk_type: MilkType;
  quantity_unit: QuantityUnit;
  fat_min: number;
  fat_max: number;
  rate_per_unit: number;
  valid_from: string;
  valid_to?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface SaleRateVersion {
  id: string;
  milk_type: MilkType;
  rate_per_litre: number;
  valid_from: string;
  valid_to?: string | null;
  created_at: string;
  created_by?: string | null;
}

export interface MilkCollection {
  id: string;
  farmer_id: string;
  business_date: string;
  shift: MilkShift;
  milk_type: MilkType;
  quantity: number;
  quantity_unit: QuantityUnit;
  fat_percent: number;
  rate_rule_id: string;
  applied_rate: number;
  amount: number;
  created_by: string;
  created_at: string;
  farmer?: {
    name: string;
    phone?: string | null;
  };
}

export interface MilkSale {
  id: string;
  customer_id: string;
  business_date: string;
  shift: MilkShift;
  milk_type: MilkType;
  quantity_litres: number;
  sale_rate_id: string;
  applied_rate: number;
  amount: number;
  created_by: string;
  created_at: string;
  customer?: {
    name: string;
    phone?: string | null;
  };
}

export interface FarmerWeeklyBill {
  id: string;
  farmer_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: BillStatus;
  created_at: string;
  created_by: string;
  finalized_at?: string | null;
  finalized_by?: string | null;
  farmer?: {
    name: string;
    phone?: string | null;
  };
  items?: {
    bill_id: string;
    collection_id: string;
    collection?: MilkCollection;
  }[];
}

export interface CustomerWeeklyBill {
  id: string;
  customer_id: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  status: BillStatus;
  created_at: string;
  created_by: string;
  finalized_at?: string | null;
  finalized_by?: string | null;
  customer?: {
    name: string;
    phone?: string | null;
  };
  items?: {
    bill_id: string;
    sale_id: string;
    sale?: MilkSale;
  }[];
}

export interface ShiftInfo {
  shift: MilkShift;
  business_date: string;
  is_active: boolean;
  local_time: string;
  timezone: string;
  morning_window: string;
  evening_window: string;
}

export interface ShiftCollectionMetric {
  cow_litres: number;
  cow_amount: number;
  buffalo_litres: number;
  buffalo_amount: number;
  total_litres: number;
  total_amount: number;
  tx_count: number;
}

export interface ShiftSalesMetric {
  cow_litres: number;
  cow_amount: number;
  buffalo_litres: number;
  buffalo_amount: number;
  total_litres: number;
  total_amount: number;
  tx_count: number;
}

export interface MilkStockTypeDetail {
  collected_litres: number;
  sold_litres: number;
  available_litres: number;
  day_balance_litres: number;
  morning_collected_litres: number;
  morning_sold_litres: number;
  morning_balance_litres: number;
  evening_collected_litres: number;
  evening_sold_litres: number;
  evening_balance_litres: number;
  total_collected_equiv_litres?: number;
  morning_collected_equiv_litres?: number;
  evening_collected_equiv_litres?: number;
}

export interface MilkStockOverall {
  total_collected_litres: number;
  total_sold_litres: number;
  total_available_litres: number;
  day_balance_litres: number;
  total_collected_equiv_litres?: number;
}

export interface MilkStockData {
  business_date: string;
  cow: MilkStockTypeDetail;
  buffalo: MilkStockTypeDetail;
  overall: MilkStockOverall;
}

export interface DashboardMetrics {
  business_date: string;
  current_shift: MilkShift;
  is_shift_active: boolean;
  stock?: MilkStockData;
  collection: {
    morning: ShiftCollectionMetric;
    evening: ShiftCollectionMetric;
    day_total: {
      total_litres: number;
      total_amount: number;
      tx_count: number;
    };
  };
  sales: {
    morning: ShiftSalesMetric;
    evening: ShiftSalesMetric;
    day_total: {
      total_litres: number;
      total_amount: number;
      tx_count: number;
    };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  code?: string;
  message?: string;
}
