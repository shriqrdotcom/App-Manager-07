export type MenuRole = 'owner' | 'admin' | 'staff';

export type MenuGalleryImage = {
  id: string;
  url: string;
  altText: string | null;
  position: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  emoji: string;
  position: number;
};

export type MenuVariant = Record<string, unknown>;
export type MenuAddOn = Record<string, unknown>;

export type MenuItem = {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string | null;
  image: { url: string; shape: string } | null;
  gallery: MenuGalleryImage[];
  available: boolean;
  foodType: string;
  vegetarian: boolean;
  tags: string[];
  addOns: MenuAddOn[];
  variants: MenuVariant[];
  taxRate: number;
  preparationTimeMinutes: number | null;
  visibility: string;
  isPublished: boolean;
  isArchived: boolean;
  position: number;
  version: number;
  updatedAt: string | null;
};

export type MobileRestaurant = {
  uid: string;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  description: string | null;
  phone: string | null;
  location: string | null;
  currency: string | null;
  accentColor: string | null;
  digitalServiceBell: boolean;
};

export type MenuPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type MenuResponse = {
  apiVersion: 'v1';
  restaurant: MobileRestaurant;
  role: MenuRole;
  permissions: string[];
  categories: MenuCategory[];
  items: MenuItem[];
  pagination: MenuPagination;
};

export type MenuItemResponse = {
  apiVersion: 'v1';
  restaurant: MobileRestaurant;
  role: MenuRole;
  item: MenuItem;
};

export type MenuCategoryResponse = {
  apiVersion: 'v1';
  category: MenuCategory;
};

export type MenuGalleryResponse = {
  apiVersion: 'v1';
  gallery: MenuGalleryImage;
};

export type MenuMutationResponse = {
  apiVersion: 'v1';
  deleted?: boolean;
  itemId?: string;
  categoryId?: string;
  galleryId?: string;
};

export type MenuItemInput = {
  categoryId?: string | null;
  name: string;
  description?: string | null;
  price?: number;
  image?: string | null;
  imageShape?: string;
  available?: boolean;
  veg?: boolean;
  tags?: string[];
  addOns?: MenuAddOn[];
  variants?: MenuVariant[];
  isPublished?: boolean;
  isArchived?: boolean;
  position?: number;
  taxRate?: number;
  preparationTimeMinutes?: number | null;
  foodType?: string;
  visibility?: string;
};

export type MenuCategoryInput = {
  name: string;
  emoji?: string;
  position?: number;
};