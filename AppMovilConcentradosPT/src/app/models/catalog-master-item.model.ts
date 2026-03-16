export interface CatalogMasterItem {
    id: string;
    nombre: string;
    orden?: number;
    activo?: boolean;
    imagenUrl?: string;
    imagenKey?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CatalogMasterCollection {
    categorias: CatalogMasterItem[];
    marcas: CatalogMasterItem[];
    presentaciones: CatalogMasterItem[];
}
