import { CartItem } from './cart-item';

export interface Order {
  id: string;
  items: CartItem[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: 'COD' | 'UPI' | 'CARD';
  createdAt?: string;
}

export interface OrderPayload {
  items: CartItem[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  paymentMethod: string;
}
