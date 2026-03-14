import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-perfil-auditoria-staff',
  templateUrl: './perfil-auditoria-staff.page.html',
  styleUrls: ['./perfil-auditoria-staff.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class PerfilAuditoriaStaffPage {
  constructor() { }
}
