import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-ventas',
  templateUrl: './dashboard-ventas.page.html',
  styleUrls: ['./dashboard-ventas.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class DashboardVentasPage {
  constructor() { }
}
