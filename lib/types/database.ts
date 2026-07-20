export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "draft" | "published" | "archived";
export type BlogPostStatus = "draft" | "published" | "archived";

export type BlogCategory = {
  id: string; name: string; slug: string; description: string | null;
  created_at: string; updated_at: string;
};

export type BlogPost = {
  id: string; title: string; slug: string; excerpt: string | null; content: string | null;
  cover_image_url: string | null; author_name: string | null; category_id: string | null;
  status: BlogPostStatus; featured: boolean; seo_title: string | null;
  seo_description: string | null; published_at: string | null; created_at: string; updated_at: string;
};

export type BlogTag = {
  id: string; name: string; slug: string; created_at: string; updated_at: string;
};

export type BlogPostTag = { post_id: string; tag_id: string };

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
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
  affiliate_network: string;
  affiliate_tracking_parameter: string | null;
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

export type AffiliateClick = {
  id: string;
  offer_id: string | null;
  product_id: string | null;
  merchant_id: string | null;
  clicked_at: string;
  referrer: string | null;
  user_agent: string | null;
  device_type: "mobile" | "tablet" | "desktop" | "unknown" | null;
  source_page: string | null;
  session_id: string | null;
  ip_hash: string | null;
  created_at: string;
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
      affiliate_clicks: TableDefinition<
        AffiliateClick,
        Omit<AffiliateClick, "id" | "clicked_at" | "created_at"> & {
          id?: string;
          clicked_at?: string;
          created_at?: string;
        },
        Partial<Omit<AffiliateClick, "id" | "created_at">>
      >;
      blog_categories: TableDefinition<BlogCategory, InsertShape<BlogCategory>, UpdateShape<BlogCategory>>;
      blog_posts: TableDefinition<BlogPost, InsertShape<BlogPost>, UpdateShape<BlogPost>>;
      blog_tags: TableDefinition<BlogTag, InsertShape<BlogTag>, UpdateShape<BlogTag>>;
      blog_post_tags: TableDefinition<
        BlogPostTag,
        BlogPostTag,
        Partial<BlogPostTag>
      >;
    };
    Views: Record<string, never>;
    Functions: {
      search_products: {
        Args: {
          p_query?: string | null;
          p_category_slug?: string | null;
          p_brand_slug?: string | null;
          p_merchant_slug?: string | null;
          p_min_price?: number | null;
          p_max_price?: number | null;
          p_min_discount?: number | null;
          p_availability?: string | null;
          p_best_price_only?: boolean;
          p_sort?: string;
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          name: string;
          slug: string;
          primary_image_url: string | null;
          brand_name: string | null;
          best_price: number;
          currency: string;
          store_count: number;
          biggest_discount: number | null;
        }>;
      };
      search_category_products: {
        Args: {
          p_category_slug: string;
          p_query?: string | null;
          p_brand_slug?: string | null;
          p_merchant_slug?: string | null;
          p_min_price?: number | null;
          p_max_price?: number | null;
          p_min_discount?: number | null;
          p_availability?: string | null;
          p_best_price_only?: boolean;
          p_featured?: boolean;
          p_trending?: boolean;
          p_sort?: string;
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          name: string;
          slug: string;
          primary_image_url: string | null;
          brand_name: string | null;
          best_price: number;
          currency: string;
          store_count: number;
          biggest_discount: number | null;
          total_count: number;
        }>;
      };
      get_affiliate_click_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
