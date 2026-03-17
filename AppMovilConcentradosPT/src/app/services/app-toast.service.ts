import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { Toast } from '@capacitor/toast';

@Injectable({
    providedIn: 'root'
})
export class AppToastService {
    private toastController = inject(ToastController);

    async showCartAdded(productName: string, quantity: number): Promise<void> {
        const message = `${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} de ${productName}`;
        await this.show(message, 'success');
    }

    async show(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'success'): Promise<void> {
        if (Capacitor.getPlatform() !== 'web') {
            try {
                await Toast.show({
                    text: message,
                    duration: 'short',
                    position: 'bottom'
                });
                return;
            } catch (error) {
                console.warn('No fue posible mostrar el toast nativo. Usando Ionic toast.', error);
            }
        }

        const toast = await this.toastController.create({
            message,
            duration: 2200,
            position: 'bottom',
            color
        });

        await toast.present();
    }
}
