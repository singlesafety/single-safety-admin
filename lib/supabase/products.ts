import { createClient } from "./client";
import { Product, CreateProductData, UpdateProductData, ProductStats } from "@/lib/types/product";

export async function getProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  return data || [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data;
}

export async function createProduct(productData: CreateProductData): Promise<Product> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .insert([{
      id: crypto.randomUUID(),
      ...productData,
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
}

export async function updateProduct(productData: UpdateProductData): Promise<Product> {
  const supabase = createClient();
  const { id, ...updateData } = productData;
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name');

  if (error) {
    throw new Error(`Failed to search products: ${error.message}`);
  }

  return data || [];
}

export async function getProductStats(): Promise<ProductStats> {
  const supabase = createClient();
  
  // Get total products count
  const { count: totalCount, error: totalError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(`Failed to get total products: ${totalError.message}`);
  }

  // Get all products for price calculation
  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .select('price');

  if (productsError) {
    throw new Error(`Failed to get products data: ${productsError.message}`);
  }

  // Calculate average price
  const averagePrice = productsData && productsData.length > 0 
    ? productsData.reduce((sum: number, product: any) => sum + product.price, 0) / productsData.length
    : 0;

  // Get recent additions (last 30 days) - Note: products table doesn't have created_at, so we'll return 0
  const recentAdditions = 0;

  return {
    total_products: totalCount || 0,
    average_price: Math.round(averagePrice),
    recent_additions: recentAdditions
  };
}