export interface Product {
  id: string;
  name: string;
  presentation?: string;
  brand: string;
  description: string;
  price: number;
  category?: string;
  imageUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
