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
  created_at: string
  category?: Category
  brand?: Brand
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
