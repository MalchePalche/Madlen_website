export type Gender = "male" | "female" | "unisex";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

/** A single selectable colour shown as a swatch dot on product cards. */
export interface ProductColor {
  name: string; // Bulgarian colour name, e.g. "Черно"
  hex: string; // swatch colour, e.g. "#0d0d0d"
}

export interface Product {
  id: string;
  slug: string;
  name_bg: string;
  name_en: string;
  price_bgn: number;
  /** Optional strike-through original price for sale items. */
  compare_at_bgn?: number | null;
  category: string; // category slug, see CATEGORIES
  gender: Gender;
  images: string[]; // [0] primary, [1] hover-swap secondary
  sizes: string[]; // e.g. ["XS","S","M","L","XL"]
  /** Subset of `sizes` that are currently unavailable (rendered disabled on the PDP). */
  out_of_stock_sizes?: string[];
  colors: ProductColor[];
  is_new: boolean;
  stock: number;
  description_bg?: string;
  material_bg?: string;
  created_at: string;
}

export interface CartItem {
  productId: string;
  slug: string;
  name_bg: string;
  price_bgn: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

export interface DeliveryAddress {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  postcode: string;
  note?: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  items: CartItem[];
  total_bgn: number;
  delivery_address: DeliveryAddress;
  status: OrderStatus;
  payment_method: "cod";
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_address: DeliveryAddress | null;
  is_admin: boolean;
  created_at: string;
}
