import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-pedido-ventas',
  templateUrl: './gestion-pedido-ventas.page.html',
  styleUrls: ['./gestion-pedido-ventas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class GestionPedidoVentasPage {
  constructor() { }
}
