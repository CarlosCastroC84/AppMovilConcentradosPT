import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';

const BUSINESS_CONFIG_KEY = 'business_config_admin';

export interface CoverageArea {
    name: string;
    detail: string;
}

export interface BusinessConfig {
    businessName: string;
    businessSubtitle: string;
    whatsappNumber: string;
    phoneNumber: string;
    weekdayOpen: string;
    weekdayClose: string;
    saturdayOpen: string;
    saturdayClose: string;
    sundayEnabled: boolean;
    sundayOpen: string;
    sundayClose: string;
    coverageAreas: CoverageArea[];
    welcomeTemplate: string;
    confirmationTemplate: string;
}

@Injectable({
    providedIn: 'root'
})
export class BusinessConfigService {
    private storageService = inject(StorageService);

    getDefaultConfig(): BusinessConfig {
        return {
            businessName: 'Concentrados Puente Tierra',
            businessSubtitle: 'Nutriendo tu granja, fortaleciendo tu futuro',
            whatsappNumber: '573108118851',
            phoneNumber: '+573108118851',
            weekdayOpen: '07:00',
            weekdayClose: '17:00',
            saturdayOpen: '08:00',
            saturdayClose: '12:00',
            sundayEnabled: false,
            sundayOpen: '08:00',
            sundayClose: '12:00',
            coverageAreas: [
                { name: 'Puente Tierra', detail: 'Vereda principal' },
                { name: 'El Silencio', detail: 'Municipio vecino' },
                { name: 'La Cumbre', detail: 'Zona rural' }
            ],
            welcomeTemplate: '¡Hola! Gracias por contactar a Concentrados Puente Tierra. ¿En qué podemos ayudarte hoy?',
            confirmationTemplate: 'Tu pedido ha sido confirmado. Pronto te contactaremos para coordinar entrega y detalles.'
        };
    }

    async loadConfig(): Promise<BusinessConfig> {
        const savedConfig = await this.storageService.getJson<Partial<BusinessConfig>>(BUSINESS_CONFIG_KEY);
        return this.mergeWithDefaults(savedConfig);
    }

    async saveConfig(config: BusinessConfig): Promise<void> {
        await this.storageService.setJson(BUSINESS_CONFIG_KEY, this.mergeWithDefaults(config));
    }

    async resetConfig(): Promise<void> {
        await this.storageService.remove(BUSINESS_CONFIG_KEY);
    }

    normalizePhone(value: string): string {
        return value.replace(/\D/g, '');
    }

    isValidPhone(value: string): boolean {
        return this.normalizePhone(value).length >= 10;
    }

    formatHours(start: string, end: string): string {
        return `${start} - ${end}`;
    }

    private mergeWithDefaults(config?: Partial<BusinessConfig> | null): BusinessConfig {
        const defaults = this.getDefaultConfig();

        return {
            ...defaults,
            ...config,
            coverageAreas: Array.isArray(config?.coverageAreas)
                ? config.coverageAreas
                    .filter((area): area is CoverageArea => !!area && typeof area.name === 'string')
                    .map(area => ({
                        name: area.name ?? '',
                        detail: area.detail ?? ''
                    }))
                : defaults.coverageAreas
        };
    }
}
