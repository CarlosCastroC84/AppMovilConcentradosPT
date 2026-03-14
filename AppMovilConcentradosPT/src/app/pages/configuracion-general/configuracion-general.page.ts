import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-configuracion-general',
  templateUrl: './configuracion-general.page.html',
  styleUrls: ['./configuracion-general.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ConfiguracionGeneralPage {
  constructor() { }
}
