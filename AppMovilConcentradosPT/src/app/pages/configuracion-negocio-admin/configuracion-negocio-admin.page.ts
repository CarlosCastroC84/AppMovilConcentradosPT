import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-configuracion-negocio-admin',
  templateUrl: './configuracion-negocio-admin.page.html',
  styleUrls: ['./configuracion-negocio-admin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ConfiguracionNegocioAdminPage {
  constructor() { }
}
