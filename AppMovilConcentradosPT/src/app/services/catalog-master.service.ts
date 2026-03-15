import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { unwrapApiArray } from '../utils/api-response.util';
import { CatalogMasterCollection, CatalogMasterItem } from '../models/catalog-master-item.model';

@Injectable({
    providedIn: 'root',
})
export class CatalogMasterService {
    private http = inject(HttpClient);
    private apiBaseUrl = environment.awsConfig.apiUrl;

    getCategoriasProducto(): Observable<CatalogMasterItem[]> {
        return this.http.get<unknown>(`${this.apiBaseUrl}/categorias-producto`).pipe(
            map(response => unwrapApiArray<CatalogMasterItem>(response))
        );
    }

    getMarcasProducto(): Observable<CatalogMasterItem[]> {
        return this.http.get<unknown>(`${this.apiBaseUrl}/marcas-producto`).pipe(
            map(response => unwrapApiArray<CatalogMasterItem>(response))
        );
    }

    getPresentacionesProducto(): Observable<CatalogMasterItem[]> {
        return this.http.get<unknown>(`${this.apiBaseUrl}/presentaciones-producto`).pipe(
            map(response => unwrapApiArray<CatalogMasterItem>(response))
        );
    }

    getCatalogosProducto(): Observable<CatalogMasterCollection> {
        return forkJoin({
            categorias: this.getCategoriasProducto(),
            marcas: this.getMarcasProducto(),
            presentaciones: this.getPresentacionesProducto()
        });
    }
}
