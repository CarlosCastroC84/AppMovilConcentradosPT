import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items = new BehaviorSubject<CartItem[]>([]);

  items$ = this.items.asObservable();

  get cartItems(): CartItem[] {
    return this.items.getValue();
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  addItem(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    const current = this.cartItems;
    const existing = current.find(i => i.id === item.id && i.presentation === item.presentation);
    if (existing) {
      existing.quantity += quantity;
      this.items.next([...current]);
    } else {
      this.items.next([...current, { ...item, quantity }]);
    }
  }

  removeItem(id: string) {
    this.items.next(this.cartItems.filter(i => i.id !== id));
  }

  increaseQty(id: string) {
    const current = this.cartItems;
    const item = current.find(i => i.id === id);
    if (item) {
      item.quantity++;
      this.items.next([...current]);
    }
  }

  decreaseQty(id: string) {
    const current = this.cartItems;
    const item = current.find(i => i.id === id);
    if (item && item.quantity > 1) {
      item.quantity--;
      this.items.next([...current]);
    }
  }

  clearCart() {
    this.items.next([]);
  }
}
