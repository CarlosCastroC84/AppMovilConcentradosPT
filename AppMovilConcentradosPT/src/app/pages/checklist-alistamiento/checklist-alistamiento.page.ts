import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-checklist-alistamiento',
  templateUrl: './checklist-alistamiento.page.html',
  styleUrls: ['./checklist-alistamiento.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class ChecklistAlistamientoPage {
  constructor() { }
}
