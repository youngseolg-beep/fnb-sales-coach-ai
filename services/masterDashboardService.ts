import { supabase } from "./supabaseClient";
export type MasterSalesRow = {
  id?: string | number;
  date: string;
  store_id: number | null;
  total_sales?: number | null;
  orders?: number | null;
  visit_count?: number | null;
  sold_items?: number | null;
  payload?: any;
  created_at?: string;
  updated_at?: string;
};

export async function loadAllStoresRange(
  startDate: string,
  endDate: string
): Promise<MasterSalesRow[]> {
  const { data, error } = await supabase
    .from('sales_daily')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('store_id', { ascending: true });

  if (error) {
    console.error('loadAllStoresRange error:', error);
    throw error;
  }

  return (data as MasterSalesRow[]) || [];
}

export async function loadAllStoresByDate(targetDate: string): Promise<MasterSalesRow[]> {
  const { data, error } = await supabase
    .from('sales_daily')
    .select('*')
    .eq('date', targetDate)
    .order('store_id', { ascending: true });

  if (error) {
    console.error('loadAllStoresByDate error:', error);
    throw error;
  }

  return (data as MasterSalesRow[]) || [];
}

export async function loadStoreRange(
  storeId: number,
  startDate: string,
  endDate: string
): Promise<MasterSalesRow[]> {
  const { data, error } = await supabase
    .from('sales_daily')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('loadStoreRange error:', error);
    throw error;
  }

  return (data as MasterSalesRow[]) || [];
}
