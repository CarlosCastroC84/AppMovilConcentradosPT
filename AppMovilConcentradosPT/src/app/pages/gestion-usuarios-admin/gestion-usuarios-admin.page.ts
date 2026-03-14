import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-gestion-usuarios-admin',
  templateUrl: './gestion-usuarios-admin.page.html',
  styleUrls: ['./gestion-usuarios-admin.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class GestionUsuariosAdminPage {
  constructor() { }
}
