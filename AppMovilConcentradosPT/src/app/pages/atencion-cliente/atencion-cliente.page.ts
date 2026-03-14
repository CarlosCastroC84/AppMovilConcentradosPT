import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-atencion-cliente',
  templateUrl: './atencion-cliente.page.html',
  styleUrls: ['./atencion-cliente.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class AtencionClientePage {
  showModal = false;

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }
}
