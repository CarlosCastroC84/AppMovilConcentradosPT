import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-despacho-pedidos-bodega',
  templateUrl: './despacho-pedidos-bodega.page.html',
  styleUrls: ['./despacho-pedidos-bodega.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DespachoPedidosBodegaPage {
  constructor() { }
}
