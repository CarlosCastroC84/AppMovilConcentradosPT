import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-confirmacion-pedido-cliente',
  templateUrl: './confirmacion-pedido-cliente.page.html',
  styleUrls: ['./confirmacion-pedido-cliente.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ConfirmacionPedidoClientePage implements OnInit {
  private route = inject(ActivatedRoute);

  pedidoId = '';
  customerName = '';
  customerLocation = '';
  total = 0;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.pedidoId = params.get('pedidoId') || 'ORD-SIN-ID';
      this.customerName = params.get('customerName') || 'Cliente';
      this.customerLocation = params.get('customerLocation') || 'Ubicación por confirmar';
      this.total = Number(params.get('total') || 0);
    });
  }

  formatPrice(value: number): string {
    return '$' + value.toLocaleString('es-CO');
  }
}
