export interface Product {
  id: string;
  name: string;
  price: number;
  price_description: string | null;
  image_path: string;
}

export interface CreateProductData {
  name: string;
  price: number;
  price_description?: string;
  image_path: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}