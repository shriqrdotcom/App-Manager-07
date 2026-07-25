export type RestaurantRole = 'owner' | 'admin' | 'manager' | 'staff';

export type RestaurantPermission = string;

export interface BootstrapUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export interface BootstrapRestaurant {
  id: string;
  name: string;
  role: RestaurantRole;
  permissions: RestaurantPermission[];
}

export interface BootstrapResponse {
  apiVersion: 'v1';
  user: BootstrapUser;
  restaurants: BootstrapRestaurant[];
}
