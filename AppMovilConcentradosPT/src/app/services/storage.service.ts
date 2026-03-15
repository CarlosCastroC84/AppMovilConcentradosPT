import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  async getJson<T>(key: string): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key });
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.warn(`No fue posible leer la clave "${key}" desde storage.`, error);
      return null;
    }
  }

  async setJson<T>(key: string, value: T): Promise<void> {
    try {
      await Preferences.set({
        key,
        value: JSON.stringify(value)
      });
    } catch (error) {
      console.warn(`No fue posible guardar la clave "${key}" en storage.`, error);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
    } catch (error) {
      console.warn(`No fue posible eliminar la clave "${key}" de storage.`, error);
    }
  }
}
