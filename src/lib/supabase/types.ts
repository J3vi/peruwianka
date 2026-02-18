export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  created_at: string
}

export interface Brand {
  id: number
  name: string
  slug: string
  created_at: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  price_estimated: number
  weight: number
  image_url: string
  category_id: number
  brand_id: number
  is_active: boolean
  has_variants: boolean
  stock_qty?: number
  created_at: string

  discount_percent: number | null
  discount_until?: string | null
  updated_at?: string
  category?: Category
  brand?: Brand
  product_variants?: ProductVariant[]
  // Campos opcionales para items en carrito con variantes
  variant_id?: number
  variant_label?: string

}


export interface ProductVariant {
  id: number
  product_id: number
  label: string
  amount: number
  unit: string
  price: number
  is_default: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}


export interface Order {
  id: string
  user_id: string | null
  full_name: string
  phone: string
  city: string
  address: string
  comment: string | null
  items: any // jsonb
  total_estimated: number
  shipping_cost: number
  status: string
  created_at: string
}

export interface Profile {
  id: string
  role: string
  created_at: string
}

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasMore: boolean
}
