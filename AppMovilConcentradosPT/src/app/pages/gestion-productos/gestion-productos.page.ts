import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { Product } from '../../models/product.model';
import { CatalogMasterItem } from '../../models/catalog-master-item.model';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { CatalogMasterService } from '../../services/catalog-master.service';
import { CatalogProductView, enrichCatalogProduct } from '../../utils/catalog-product.util';

interface ProductFormModel {
  id: string;
  nombre: string;
  categoria: string;
  marca: string;
  presentacion: string;
  precio: number | null;
  stock: number | null;
  imagenUrl: string;
  imagenKey: string;
}

@Component({
  selector: 'app-gestion-productos',
  templateUrl: './gestion-productos.page.html',
  styleUrls: ['./gestion-productos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class GestionProductosPage implements OnInit {
  readonly fallbackImage = 'assets/Logos_dpt.png';

  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private catalogMasterService = inject(CatalogMasterService);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  activeFilter = 'todos';
  searchTerm = '';
  currentUserInitials = 'PT';
  loading = true;
  saving = false;
  error: string | null = null;
  catalogsLoading = true;
  catalogsError: string | null = null;
  products: CatalogProductView[] = [];
  categorias: CatalogMasterItem[] = [];
  marcas: CatalogMasterItem[] = [];
  presentaciones: CatalogMasterItem[] = [];
  formVisible = false;
  editingProductId: string | null = null;
  form: ProductFormModel = this.createEmptyForm();

  async ngOnInit() {
    await this.loadCurrentUser();
    this.cargarCatalogos();
    this.cargarProductos();
  }

  get categoriaOptions(): CatalogMasterItem[] {
    return this.withCurrentOption(this.categorias, this.form.categoria);
  }

  get marcaOptions(): CatalogMasterItem[] {
    return this.withCurrentOption(this.marcas, this.form.marca);
  }

  get presentacionOptions(): CatalogMasterItem[] {
    return this.withCurrentOption(this.presentaciones, this.form.presentacion);
  }

  get filteredProducts(): CatalogProductView[] {
    const term = this.searchTerm.trim().toLowerCase();

    return [...this.products]
      .filter(product => this.matchesFilter(product))
      .filter(product => this.matchesSearch(product, term))
      .sort((left, right) => left.nombre.localeCompare(right.nombre));
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
  }

  cargarProductos() {
    this.loading = true;
    this.error = null;

    this.productService.getProducts().subscribe({
      next: products => {
        this.products = products.map(product => enrichCatalogProduct(product));
        this.loading = false;
      },
      error: (error: Error) => {
        this.error = error.message || 'No fue posible cargar los productos.';
        this.loading = false;
      }
    });
  }

  cargarCatalogos() {
    this.catalogsLoading = true;
    this.catalogsError = null;

    this.catalogMasterService.getCatalogosProducto().subscribe({
      next: ({ categorias, marcas, presentaciones }) => {
        this.categorias = this.sortCatalogItems(categorias);
        this.marcas = this.sortCatalogItems(marcas);
        this.presentaciones = this.sortCatalogItems(presentaciones);
        this.catalogsLoading = false;
      },
      error: (error: Error) => {
        this.catalogsError = error.message || 'No fue posible cargar categorías, marcas y presentaciones.';
        this.catalogsLoading = false;
      }
    });
  }

  startCreate() {
    this.editingProductId = null;
    this.form = this.createEmptyForm();
    this.formVisible = true;
  }

  startEdit(product: Product) {
    this.editingProductId = product.id;
    this.form = {
      id: product.id,
      nombre: product.nombre,
      categoria: product.categoria || '',
      marca: product.marca || '',
      presentacion: product.presentacion,
      precio: product.precio,
      stock: product.stock ?? null,
      imagenUrl: product.imagenUrl || '',
      imagenKey: product.imagenKey || ''
    };
    this.formVisible = true;
  }

  cancelEdit() {
    this.formVisible = false;
    this.editingProductId = null;
    this.form = this.createEmptyForm();
  }

  saveProduct() {
    const validationError = this.validateForm();
    if (validationError) {
      this.showToast(validationError, 'warning');
      return;
    }

    const existingProduct = this.editingProductId
      ? this.products.find(product => product.id === this.editingProductId)
      : undefined;
    const timestamp = new Date().toISOString();

    const productPayload: Product = {
      id: this.form.id.trim() || this.slugify(this.form.nombre),
      nombre: this.form.nombre.trim(),
      categoria: this.form.categoria.trim() || undefined,
      marca: this.form.marca.trim() || undefined,
      presentacion: this.form.presentacion.trim(),
      precio: Number(this.form.precio),
      estado: existingProduct?.estado || 'ACTIVO',
      stock: this.form.stock === null ? undefined : Number(this.form.stock),
      imagenUrl: this.form.imagenUrl.trim() || undefined,
      imagenKey: this.form.imagenKey.trim() || undefined,
      createdAt: existingProduct?.createdAt || timestamp,
      updatedAt: timestamp
    };

    this.saving = true;
    const request$ = this.editingProductId
      ? this.productService.updateProduct(productPayload)
      : this.productService.createProduct(productPayload);

    request$.subscribe({
      next: savedProduct => {
        this.upsertProduct(enrichCatalogProduct(savedProduct));
        this.cancelEdit();
        this.saving = false;
        this.showToast(
          existingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.',
          'success'
        );
      },
      error: (error: Error) => {
        this.saving = false;
        this.showToast(error.message || 'No fue posible guardar el producto.', 'danger');
      }
    });
  }

  toggleProductState(product: Product, event: Event) {
    const target = event.target as HTMLInputElement | null;
    const isChecked = target?.checked ?? false;
    const updatedProduct: Product = {
      ...product,
      estado: isChecked ? 'ACTIVO' : 'INACTIVO',
      updatedAt: new Date().toISOString()
    };

    this.productService.updateProduct(updatedProduct).subscribe({
      next: savedProduct => {
        this.upsertProduct(enrichCatalogProduct(savedProduct));
        this.showToast(`Estado actualizado para ${product.nombre}.`, 'success');
      },
      error: (error: Error) => {
        if (target) {
          target.checked = product.estado !== 'INACTIVO';
        }
        this.showToast(error.message || 'No fue posible actualizar el estado.', 'danger');
      }
    });
  }

  async confirmDelete(product: Product) {
    const alert = await this.alertController.create({
      header: 'Eliminar producto',
      message: `Se eliminará ${product.nombre} del catálogo. Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteProduct(product)
        }
      ]
    });

    await alert.present();
  }

  showHistory(product: Product) {
    const historyText = product.updatedAt
      ? `Última actualización: ${new Date(product.updatedAt).toLocaleString('es-CO')}`
      : 'El backend aún no reporta historial de cambios para este producto.';

    this.showToast(`${product.nombre}. ${historyText}`, 'medium');
  }

  trackByProduct(_index: number, product: Product): string {
    return product.id;
  }

  onProductImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }

  isActive(product: Product): boolean {
    return product.estado !== 'INACTIVO';
  }

  getCategoryEmoji(product: Product): string {
    const category = `${product.categoria || product.nombre}`.toLowerCase();

    if (category.includes('pollo') || category.includes('ave')) {
      return '🐓';
    }

    if (category.includes('porc')) {
      return '🐷';
    }

    if (category.includes('acui') || category.includes('pez') || category.includes('mojarra')) {
      return '🐟';
    }

    return '🐄';
  }

  getCategoryTone(product: Product): string {
    const category = `${product.categoria || product.nombre}`.toLowerCase();

    if (category.includes('pollo') || category.includes('ave')) {
      return 'yellow';
    }

    if (category.includes('porc')) {
      return 'pink';
    }

    if (category.includes('acui') || category.includes('pez') || category.includes('mojarra')) {
      return 'blue';
    }

    return 'orange';
  }

  private async loadCurrentUser() {
    const user = await this.authService.getCurrentUser();
    if (user) {
      this.currentUserInitials = this.buildInitials(user.name || user.username);
    }
  }

  private deleteProduct(product: Product) {
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter(item => item.id !== product.id);
        this.showToast('Producto eliminado correctamente.', 'success');
      },
      error: (error: Error) => {
        this.showToast(error.message || 'No fue posible eliminar el producto.', 'danger');
      }
    });
  }

  private createEmptyForm(): ProductFormModel {
    return {
      id: '',
      nombre: '',
      categoria: '',
      marca: '',
      presentacion: '',
      precio: null,
      stock: null,
      imagenUrl: '',
      imagenKey: ''
    };
  }

  private validateForm(): string | null {
    if (!this.form.nombre.trim()) {
      return 'El nombre del producto es obligatorio.';
    }

    if (!this.form.presentacion.trim()) {
      return 'La presentación es obligatoria.';
    }

    if (this.form.precio === null || Number.isNaN(Number(this.form.precio)) || Number(this.form.precio) <= 0) {
      return 'Ingresa un precio válido.';
    }

    if (this.form.stock !== null && Number(this.form.stock) < 0) {
      return 'El stock no puede ser negativo.';
    }

    return null;
  }

  private matchesFilter(product: Product): boolean {
    if (this.activeFilter === 'todos') {
      return true;
    }

    const searchableCategory = `${product.categoria || product.nombre}`.toLowerCase();

    switch (this.activeFilter) {
      case 'ganaderia':
        return searchableCategory.includes('ganad') || searchableCategory.includes('vaca') || searchableCategory.includes('bov');
      case 'pollo':
        return searchableCategory.includes('pollo') || searchableCategory.includes('ave');
      case 'porcicultura':
        return searchableCategory.includes('porc');
      case 'acuicultura':
        return searchableCategory.includes('acui') || searchableCategory.includes('pez') || searchableCategory.includes('mojarra');
      default:
        return true;
    }
  }

  private matchesSearch(product: Product, term: string): boolean {
    if (!term) {
      return true;
    }

    const searchableText = [
      product.id,
      product.nombre,
      product.categoria,
      product.marca,
      product.presentacion
    ]
      .filter((value): value is string => Boolean(value))
      .join(' ')
      .toLowerCase();

    return searchableText.includes(term);
  }

  private upsertProduct(product: CatalogProductView) {
    const index = this.products.findIndex(item => item.id === product.id);
    if (index >= 0) {
      this.products = [
        ...this.products.slice(0, index),
        product,
        ...this.products.slice(index + 1)
      ];
      return;
    }

    this.products = [...this.products, product];
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `prod-${Date.now()}`;
  }

  private buildInitials(value: string): string {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'PT';
    }

    return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
  }

  private sortCatalogItems(items: CatalogMasterItem[]): CatalogMasterItem[] {
    return [...items].sort((left, right) => {
      const leftOrder = left.orden ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.orden ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.nombre.localeCompare(right.nombre);
    });
  }

  private withCurrentOption(items: CatalogMasterItem[], currentValue: string): CatalogMasterItem[] {
    const normalizedValue = currentValue.trim();
    if (!normalizedValue || items.some(item => item.nombre === normalizedValue)) {
      return items;
    }

    return [
      ...items,
      {
        id: this.slugify(normalizedValue),
        nombre: normalizedValue,
        activo: true
      }
    ];
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      color,
      duration: 2500,
      position: 'top'
    });

    await toast.present();
  }
}
