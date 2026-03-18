import { Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';
import { CustomerBottomNavComponent } from '../../components/customer-bottom-nav/customer-bottom-nav.component';

@Component({
  selector: 'app-customer-shell',
  templateUrl: './customer-shell.component.html',
  styleUrls: ['./customer-shell.component.scss'],
  standalone: true,
  imports: [IonRouterOutlet, CustomerBottomNavComponent]
})
export class CustomerShellComponent { }
