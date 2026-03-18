import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-customer-bottom-nav',
  templateUrl: './customer-bottom-nav.component.html',
  styleUrls: ['./customer-bottom-nav.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class CustomerBottomNavComponent {
  readonly cart = inject(CartService);
}
