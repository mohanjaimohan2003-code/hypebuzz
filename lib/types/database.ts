export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "draft" | "published" | "archived";
export type BlogPostStatus = "draft" | "published" | "archived";
export type KnowledgeHubStatus = "draft" | "published";

export type KnowledgeHubItem = {
  id: string; title: string; slug: string; description: string; category: string;
  tags: string[]; author_name: string | null; pdf_url: string; pdf_storage_path: string;
  thumbnail_url: string | null; thumbnail_storage_path: string | null; pdf_size_bytes: number;
  status: KnowledgeHubStatus; published_at: string | null; created_at: string; updated_at: string;
};
export type ProductImage = { id: string; product_id: string; image_url: string; storage_path: string | null; source_type: "upload" | "external"; alt_text: string | null; sort_order: number; is_primary: boolean; created_at: string };

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
      knowledge_hub_items: TableDefinition<KnowledgeHubItem, InsertShape<KnowledgeHubItem>, UpdateShape<KnowledgeHubItem>>;
      product_images: TableDefinition<ProductImage, Omit<ProductImage, "created_at"> & { created_at?: string }, Partial<Omit<ProductImage, "id" | "product_id" | "created_at">>>;
    };
    Views: Record<string, never>;
    Functions: {
      save_product_with_offer: {
        Args: {
          p_product_id: string | null; p_name: string; p_slug: string;
          p_short_description: string | null; p_category_id: string;
          p_primary_image_url: string | null; p_is_featured: boolean;
          p_is_trending: boolean; p_status: "draft" | "published";
          p_offer_id: string | null; p_merchant_id: string | null;
          p_affiliate_url: string | null; p_current_price: number | null;
          p_original_price: number | null; p_currency: string | null;
          p_availability: string | null; p_offer_is_active: boolean | null;
        };
        Returns: string;
      };
      get_affiliate_click_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
      delete_failed_product: { Args: { p_product_id: string }; Returns: undefined };
      replace_product_images: { Args: { p_product_id: string; p_images: Json }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
