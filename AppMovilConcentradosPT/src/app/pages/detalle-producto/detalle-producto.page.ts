import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-detalle-producto',
  templateUrl: './detalle-producto.page.html',
  styleUrls: ['./detalle-producto.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DetalleProductoPage implements OnInit {
  selectedPresentation = 'bulto';
  quantity = 1;

  constructor() { }

  ngOnInit() { }

  decreaseQty() {
    if (this.quantity > 1) this.quantity--;
  }

  increaseQty() {
    this.quantity++;
  }
}
