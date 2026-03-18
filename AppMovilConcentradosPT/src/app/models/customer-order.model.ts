import { CartItem } from './cart-item.model';
import { Order, OrderStatus } from './order.model';

export type CustomerOrderStatus = OrderStatus;

export interface CustomerDeliverySnapshot {
  fullName: string;
  phone: string;
  municipality: string;
  addressReference?: string;
}

export interface CustomerCheckoutItemInput {
  productId: string;
  presentation: string;
  quantity: number;
}

export interface CustomerCreateOrderRequest {
  observations?: string;
  deliverySnapshot: CustomerDeliverySnapshot;
  items: CustomerCheckoutItemInput[];
}

export interface CustomerOrderItem extends CartItem {
  productId?: string;
}

export interface CustomerOrderView extends Order {
  deliverySnapshot: CustomerDeliverySnapshot;
  items: CustomerOrderItem[];
  itemCount: number;
  leadProductName: string;
  leadProductImageUrl?: string;
}
