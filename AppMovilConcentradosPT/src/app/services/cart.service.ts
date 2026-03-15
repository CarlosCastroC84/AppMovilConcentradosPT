import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart-item.model';
import { StorageService } from './storage.service';

const CART_ITEMS_KEY = 'cart_items';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private items = new BehaviorSubject<CartItem[]>([]);
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  items$ = this.items.asObservable();

  constructor(private readonly storageService: StorageService) {}

  get cartItems(): CartItem[] {
    return this.items.getValue();
  }

  get totalItems(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  get subtotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  init(): Promise<void> {
    if (this.initialized) {
      return Promise.resolve();
    }

    if (!this.initPromise) {
      this.initPromise = this.hydrateFromStorage()
        .catch((error) => {
          console.warn('No fue posible hidratar el carrito desde storage.', error);
        })
        .finally(() => {
          this.initialized = true;
          this.initPromise = null;
        });
    }

    return this.initPromise;
  }

  addItem(item: Omit<CartItem, 'quantity'>, quantity = 1) {
    const current = this.cartItems;
    const existing = current.find(i => i.id === item.id && i.presentation === item.presentation);
    if (existing) {
      existing.quantity += quantity;
      this.setItems(current);
    } else {
      this.setItems([...current, { ...item, quantity }]);
    }

    void this.persistItems();
  }

  removeItem(id: string) {
    this.setItems(this.cartItems.filter(i => i.id !== id));
    void this.persistItems();
  }

  increaseQty(id: string) {
    const current = this.cartItems;
    const item = current.find(i => i.id === id);
    if (item) {
      item.quantity++;
      this.setItems(current);
      void this.persistItems();
    }
  }

  decreaseQty(id: string) {
    const current = this.cartItems;
    const item = current.find(i => i.id === id);
    if (item && item.quantity > 1) {
      item.quantity--;
      this.setItems(current);
      void this.persistItems();
    }
  }

  clearCart() {
    this.setItems([]);
    void this.persistItems();
  }

  private async hydrateFromStorage(): Promise<void> {
    const storedItems = await this.storageService.getJson<CartItem[]>(CART_ITEMS_KEY);
    if (!storedItems || !Array.isArray(storedItems)) {
      this.setItems([]);
      return;
    }

    this.setItems(storedItems);
  }

  private setItems(items: CartItem[]): void {
    this.items.next(items.map(item => ({ ...item })));
  }

  private async persistItems(): Promise<void> {
    const currentItems = this.cartItems.map(item => ({ ...item }));
    if (currentItems.length === 0) {
      await this.storageService.remove(CART_ITEMS_KEY);
      return;
    }

    await this.storageService.setJson(CART_ITEMS_KEY, currentItems);
  }
}
