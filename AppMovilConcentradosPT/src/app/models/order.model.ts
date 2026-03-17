import { CartItem } from './cart-item.model';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;              // Clave primaria (v.g. 'ORD-12345678')
  userId: string;          // Identificador del usuario (Cognito sub o GUEST)
  customerName: string;    // Nombre para mostrar del cliente
  customerPhone?: string;
  customerLocation?: string;
  customerEmail?: string;
  total: number;           // Total procesado 
  status: OrderStatus;
  observations?: string;   // Notas adicionales
  createdAt: string;       // Timestamp formato ISO
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  items: CartItem[];       // Array con los productos de este pedido
}

export interface UpdateOrderRequest {
  id: string;
  status: OrderStatus;
  updatedAt: string;
  updatedBy?: string;
}

export interface DeleteOrderRequest {
  id: string;
  deletedAt: string;
  updatedAt: string;
  deletedBy?: string;
}
