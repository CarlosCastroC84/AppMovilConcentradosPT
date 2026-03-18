import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { unwrapApiArray } from '../utils/api-response.util';
import { CatalogMasterCollection, CatalogMasterItem } from '../models/catalog-master-item.model';

@Injectable({
    providedIn: 'root',
})
export class CatalogMasterService {
    private static readonly requestTimeoutMs = 12000;
    private http = inject(HttpClient);
    private apiBaseUrl = environment.awsConfig.apiUrl;

    getCategoriasProducto(): Observable<CatalogMasterItem[]> {
        return this.http.get<unknown>(`${this.apiBaseUrl}/categorias-producto`).pipe(
            timeout(CatalogMasterService.requestTimeoutMs),
            map(response => unwrapApiArray<CatalogMasterItem>(response))
        );
    }

    getMarcasProducto(): Observable<CatalogMasterItem[]> {
        return this.http.get<unknown>(`${this.apiBaseUrl}/marcas-producto`).pipe(
            timeout(CatalogMasterService.requestTimeoutMs),
            map(response => unwrapApiArray<CatalogMasterItem>(response))
        );
    }

    getPresentacionesProducto(): Observable<CatalogMasterItem[]> {
        return this.http.get<unknown>(`${this.apiBaseUrl}/presentaciones-producto`).pipe(
            timeout(CatalogMasterService.requestTimeoutMs),
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
