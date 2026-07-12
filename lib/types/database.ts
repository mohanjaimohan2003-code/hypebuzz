export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "draft" | "published" | "archived";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  amazon_asin: string | null;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  primary_image_url: string | null;
  specifications: Json;
  status: ProductStatus;
  is_featured: boolean;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
};

export type Merchant = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductOffer = {
  id: string;
  product_id: string;
  merchant_id: string;
  affiliate_url: string;
  current_price: number;
  original_price: number | null;
  currency: string;
  availability: string | null;
  coupon_note: string | null;
  is_active: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductWithOffers = Product & {
  brand: Brand | null;
  category: Category | null;
  product_offers: Array<ProductOffer & { merchant: Merchant }>;
};

export type AdminUser = {
  user_id: string;
  role: "admin";
  is_active: boolean;
  created_at: string;
};
type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type GeneratedFields = "id" | "created_at" | "updated_at";
type GeneratedRow = Record<GeneratedFields, unknown>;
type InsertShape<Row extends GeneratedRow> = Omit<Row, GeneratedFields> &
  Partial<Pick<Row, GeneratedFields>>;
type UpdateShape<Row extends GeneratedRow> = Partial<
  Omit<Row, "id" | "created_at">
>;

export type Database = {
  public: {
    Tables: {
      categories: TableDefinition<Category, InsertShape<Category>, UpdateShape<Category>>;
      brands: TableDefinition<Brand, InsertShape<Brand>, UpdateShape<Brand>>;
      products: TableDefinition<Product, InsertShape<Product>, UpdateShape<Product>>;
      merchants: TableDefinition<Merchant, InsertShape<Merchant>, UpdateShape<Merchant>>;
      product_offers: TableDefinition<
        ProductOffer,
        InsertShape<ProductOffer>,
        UpdateShape<ProductOffer>
      >;
      admin_users: TableDefinition<
        AdminUser,
        Omit<AdminUser, "created_at"> & { created_at?: string },
        Partial<Pick<AdminUser, "role" | "is_active">>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
