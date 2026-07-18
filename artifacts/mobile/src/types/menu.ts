export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  /** Price in the display currency unit (e.g. 12.50 for $12.50) */
  price: number;
  categoryId: string;
  isAvailable: boolean;
  isPublished: boolean;
  isVegetarian?: boolean;
  imageUrl?: string;
}
