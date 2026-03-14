import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonAlert } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonAlert, IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage {
  constructor() { }
  alertButtons = ['Action'];
}
