export interface Product {
  id: string;              // Clave primaria en DynamoDB
  nombre: string;          // v.g. 'Pollito Pre-iniciador'
  categoria?: string;      // v.g. 'Ganadería', 'Pollo Engorde'
  marca?: string;          // v.g. 'Finca', 'Italcol', 'Atalsal'
  presentacion: string;    // v.g. 'Bulto 20 kg'
  precio: number;          // Precio de venta
  estado: 'ACTIVO' | 'INACTIVO' | 'OFERTA';
  stock?: number;          // Opcional, cantidad disponible
  imagenUrl?: string;      // Opcional, URL del bucket S3
  imagenKey?: string;      // Opcional, key relativa del bucket S3
  descripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}
