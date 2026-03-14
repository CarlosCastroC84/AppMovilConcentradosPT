import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-confirmacion-pedido-cliente',
  templateUrl: './confirmacion-pedido-cliente.page.html',
  styleUrls: ['./confirmacion-pedido-cliente.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ConfirmacionPedidoClientePage {
  pedidoId = 'PT-7892';
  
  constructor() { }
}
