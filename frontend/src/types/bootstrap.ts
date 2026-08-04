export type RestaurantRole = 'owner' | 'admin' | 'staff';

export type RestaurantPermission = string;

export interface BootstrapUser {
  id: string;
  email: string;
  name: string | null;
  image?: string;
}

export interface BootstrapRestaurant {
  /** Permanent restaurant UID returned by the server; never an internal DB UUID. */
  uid: string;
  name: string;
  role: RestaurantRole;
  permissions: RestaurantPermission[];
}

export interface BootstrapResponse {
  apiVersion: 'v1';
  user: BootstrapUser;
  restaurants: BootstrapRestaurant[];
}
