export interface CartItem {
  id: string;
  name: string;
  emoji?: string;
  presentation: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}
