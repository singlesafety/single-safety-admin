import { createClient } from "./client";
import { 
  Application, 
  ApplicationWithProducts, 
  CreateApplicationData, 
  UpdateApplicationData,
  ApplicationStats 
} from "@/lib/types/application";

export async function getApplications(): Promise<ApplicationWithProducts[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('application')
    .select(`
      *,
      application_products (
        *,
        products (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch applications: ${error.message}`);
  }

  // Calculate totals for each application
  const applicationsWithTotals = (data || []).map(app => {
    const total_amount = app.application_products?.reduce((sum, ap) => {
      if (ap.products && ap.quantity) {
        return sum + (ap.products.price * ap.quantity);
      }
      return sum;
    }, 0) || 0;

    const total_quantity = app.application_products?.reduce((sum, ap) => {
      return sum + (ap.quantity || 0);
    }, 0) || 0;

    return {
      ...app,
      total_amount,
      total_quantity
    };
  });

  return applicationsWithTotals;
}

export async function getApplication(id: number): Promise<ApplicationWithProducts | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('application')
    .select(`
      *,
      application_products (
        *,
        products (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch application: ${error.message}`);
  }

  // Calculate totals
  const total_amount = data.application_products?.reduce((sum, ap) => {
    if (ap.products && ap.quantity) {
      return sum + (ap.products.price * ap.quantity);
    }
    return sum;
  }, 0) || 0;

  const total_quantity = data.application_products?.reduce((sum, ap) => {
    return sum + (ap.quantity || 0);
  }, 0) || 0;

  return {
    ...data,
    total_amount,
    total_quantity
  };
}

export async function createApplication(applicationData: CreateApplicationData): Promise<Application> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('application')
    .insert([applicationData])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create application: ${error.message}`);
  }

  return data;
}

export async function createApplicationWithProducts(
  applicationData: CreateApplicationData,
  products: {[productId: string]: number}
): Promise<ApplicationWithProducts> {
  const supabase = createClient();
  
  // Create application first
  const { data: application, error: appError } = await supabase
    .from('application')
    .insert([applicationData])
    .select()
    .single();

  if (appError) {
    throw new Error(`Failed to create application: ${appError.message}`);
  }

  // Create application products
  if (Object.keys(products).length > 0) {
    const applicationProducts = Object.entries(products).map(([productId, quantity]) => ({
      application_id: application.id,
      product_id: productId,
      quantity: quantity,
    }));

    const { error: productsError } = await supabase
      .from('application_products')
      .insert(applicationProducts);

    if (productsError) {
      throw new Error(`Failed to create application products: ${productsError.message}`);
    }
  }

  // Return the complete application with products
  return getApplication(application.id) as Promise<ApplicationWithProducts>;
}

export async function updateApplicationProducts(
  applicationId: number,
  products: {[productId: string]: number}
): Promise<void> {
  const supabase = createClient();
  
  // Delete existing application products
  const { error: deleteError } = await supabase
    .from('application_products')
    .delete()
    .eq('application_id', applicationId);

  if (deleteError) {
    throw new Error(`Failed to delete existing application products: ${deleteError.message}`);
  }

  // Insert new application products
  if (Object.keys(products).length > 0) {
    const applicationProducts = Object.entries(products).map(([productId, quantity]) => ({
      application_id: applicationId,
      product_id: productId,
      quantity: quantity,
    }));

    const { error: insertError } = await supabase
      .from('application_products')
      .insert(applicationProducts);

    if (insertError) {
      throw new Error(`Failed to create application products: ${insertError.message}`);
    }
  }
}

export async function updateApplication(applicationData: UpdateApplicationData): Promise<Application> {
  const supabase = createClient();
  const { id, ...updateData } = applicationData;
  
  const { data, error } = await supabase
    .from('application')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update application: ${error.message}`);
  }

  return data;
}

export async function deleteApplication(id: number): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('application')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}

export async function searchApplications(query: string): Promise<ApplicationWithProducts[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('application')
    .select(`
      *,
      application_products (
        *,
        products (*)
      )
    `)
    .or(`building_name.ilike.%${query}%,contact.ilike.%${query}%,address.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to search applications: ${error.message}`);
  }

  // Calculate totals for each application
  const applicationsWithTotals = (data || []).map(app => {
    const total_amount = app.application_products?.reduce((sum, ap) => {
      if (ap.products && ap.quantity) {
        return sum + (ap.products.price * ap.quantity);
      }
      return sum;
    }, 0) || 0;

    const total_quantity = app.application_products?.reduce((sum, ap) => {
      return sum + (ap.quantity || 0);
    }, 0) || 0;

    return {
      ...app,
      total_amount,
      total_quantity
    };
  });

  return applicationsWithTotals;
}

export async function getApplicationStats(): Promise<ApplicationStats> {
  const supabase = createClient();
  
  // Get total applications
  const { count: totalCount, error: totalError } = await supabase
    .from('application')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    throw new Error(`Failed to get total applications: ${totalError.message}`);
  }

  // Get this month's applications
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyCount, error: monthlyError } = await supabase
    .from('application')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  if (monthlyError) {
    throw new Error(`Failed to get monthly applications: ${monthlyError.message}`);
  }

  // Get applications with products for revenue calculation
  const { data: applicationsData, error: revenueError } = await supabase
    .from('application')
    .select(`
      application_products (
        quantity,
        products (price)
      )
    `);

  if (revenueError) {
    throw new Error(`Failed to get revenue data: ${revenueError.message}`);
  }

  // Calculate total revenue
  const totalRevenue = (applicationsData || []).reduce((sum, app) => {
    const appRevenue = app.application_products?.reduce((appSum, ap) => {
      if (ap.products && ap.quantity) {
        return appSum + (ap.products.price * ap.quantity);
      }
      return appSum;
    }, 0) || 0;
    return sum + appRevenue;
  }, 0);

  return {
    total_applications: totalCount || 0,
    monthly_applications: monthlyCount || 0,
    pending_applications: 0, // This would need a status field in the application table
    total_revenue: totalRevenue
  };
}