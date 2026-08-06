import { apiFetch } from '@/src/api/client';
import type {
  MenuCategoryInput,
  MenuCategoryResponse,
  MenuGalleryResponse,
  MenuItemInput,
  MenuItem,
  MenuItemResponse,
  MenuMutationResponse,
  MenuResponse,
} from '@/src/types/menu';

const MENU_PATH = '/api/mobile/v1/menu';

function menuPath(operation: string, params: Record<string, string | undefined> = {}) {
  // The versioned Vercel rewrite injects action=mobileMenu server-side.
  // Keep the public mobile contract limited to operation and its resource query.
  const query = new URLSearchParams({ operation });
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, value);
  });
  return `${MENU_PATH}?${query.toString()}`;
}

function bodyWithRestaurant(restaurantUid: string, body: Record<string, unknown> = {}) {
  return JSON.stringify({ restaurantUid, ...body });
}

export const menuApi = {
  getMenu(
    restaurantUid: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      categoryId?: string;
      includeArchived?: boolean;
    } = {},
  ) {
    const query = {
      restaurantUid,
      page: options.page?.toString(),
      limit: options.limit?.toString(),
      search: options.search || undefined,
      categoryId: options.categoryId,
      includeArchived: options.includeArchived ? 'true' : undefined,
    };
    return apiFetch<MenuResponse>(menuPath('getMenu', query));
  },

  getItem(restaurantUid: string, itemId: string) {
    return apiFetch<MenuItemResponse>(
      menuPath('getItem', { restaurantUid, itemId }),
    );
  },

  createItem(restaurantUid: string, item: MenuItemInput) {
    return apiFetch<MenuItemResponse>(menuPath('createItem'), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid, { item }),
    });
  },

  updateItem(restaurantUid: string, itemId: string, item: Partial<MenuItemInput>) {
    return apiFetch<MenuItemResponse>(menuPath('updateItem', { itemId }), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid, { item }),
    });
  },

  deleteItem(restaurantUid: string, itemId: string) {
    return apiFetch<MenuMutationResponse>(menuPath('deleteItem', { itemId }), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid),
    });
  },

  archiveItem(restaurantUid: string, itemId: string, archived = true) {
    return apiFetch<MenuItemResponse>(
      menuPath(archived ? 'archiveItem' : 'unarchiveItem', { itemId }),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid),
      },
    );
  },

  duplicateItem(
    restaurantUid: string,
    itemId: string,
    overrides: Partial<MenuItemInput> = {},
  ) {
    return apiFetch<MenuItemResponse>(menuPath('duplicateItem', { itemId }), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid, { overrides }),
    });
  },

  setAvailability(restaurantUid: string, itemId: string, available: boolean) {
    return apiFetch<MenuItemResponse>(
      menuPath('setAvailability', { itemId }),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid, { available }),
      },
    );
  },

  reorderItems(
    restaurantUid: string,
    items: { id: string; position: number }[],
  ) {
    return apiFetch<{ apiVersion: 'v1'; items: MenuItem[] }>(
      menuPath('reorderItems'),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid, { items }),
      },
    );
  },

  createCategory(restaurantUid: string, category: MenuCategoryInput) {
    return apiFetch<MenuCategoryResponse>(menuPath('createCategory'), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid, { category }),
    });
  },

  updateCategory(
    restaurantUid: string,
    categoryId: string,
    category: Partial<MenuCategoryInput>,
  ) {
    return apiFetch<MenuCategoryResponse>(
      menuPath('updateCategory', { categoryId }),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid, { category }),
      },
    );
  },

  reorderCategories(
    restaurantUid: string,
    categories: { id: string; position: number }[],
  ) {
    return apiFetch<{ apiVersion: 'v1'; categories: unknown[] }>(
      menuPath('reorderCategories'),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid, { categories }),
      },
    );
  },

  deleteCategory(restaurantUid: string, categoryId: string) {
    return apiFetch<MenuMutationResponse>(
      menuPath('deleteCategory', { categoryId }),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid),
      },
    );
  },

  addGallery(
    restaurantUid: string,
    itemId: string,
    dataUrl: string,
    options: { altText?: string; position?: number } = {},
  ) {
    return apiFetch<MenuGalleryResponse>(menuPath('addGallery', { itemId }), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid, {
        dataUrl,
        altText: options.altText,
        position: options.position,
      }),
    });
  },

  replaceImage(
    restaurantUid: string,
    itemId: string,
    dataUrl: string,
    imageShape?: string,
  ) {
    return apiFetch<MenuItemResponse>(menuPath('replaceImage', { itemId }), {
      method: 'POST',
      body: bodyWithRestaurant(restaurantUid, { dataUrl, imageShape }),
    });
  },

  deleteGallery(restaurantUid: string, galleryId: string) {
    return apiFetch<MenuMutationResponse>(
      menuPath('deleteGallery', { galleryId }),
      {
        method: 'POST',
        body: bodyWithRestaurant(restaurantUid),
      },
    );
  },
};