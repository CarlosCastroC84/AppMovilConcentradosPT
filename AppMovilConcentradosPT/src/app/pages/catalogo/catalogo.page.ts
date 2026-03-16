import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CatalogProductView, enrichCatalogProduct, sortBrandOptions, sortCategoryOptions } from '../../utils/catalog-product.util';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.page.html',
  styleUrls: ['./catalogo.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class CatalogoPage implements OnInit {
  readonly allCategoriesLabel = 'Todas';
  readonly allBrandsLabel = 'Todas';
  readonly fallbackImage = 'assets/Logos_dpt.png';

  private productService = inject(ProductService);
  public cart = inject(CartService);
  private toastController = inject(ToastController);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  productos: CatalogProductView[] = [];
  cargando = true;
  error: string | null = null;
  searchTerm = '';
  selectedCategory = this.allCategoriesLabel;
  selectedBrand = this.allBrandsLabel;
  previewProduct: CatalogProductView | null = null;
  selectedQuantities: Record<string, number> = {};

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      this.searchTerm = params.get('q')?.trim() || '';
      this.selectedCategory = this.allCategoriesLabel;
      this.selectedBrand = this.allBrandsLabel;
    });

    this.cargarProductos();
  }

  get categoryOptions(): string[] {
    const categories = new Set(this.productos.map(product => product.displayCategory));
    return [this.allCategoriesLabel, ...sortCategoryOptions([...categories])];
  }

  irADetalle(producto: CatalogProductView) {
    void this.router.navigate(['/detalle-producto'], {
      queryParams: { id: producto.id }
    });
  }


  get brandOptions(): string[] {
    const brands = new Set(this.filteredProductsWithoutBrandFilter.map(product => product.displayBrand));
    return [this.allBrandsLabel, ...sortBrandOptions([...brands])];
  }

  get filteredProducts(): CatalogProductView[] {
    return this.filteredProductsWithoutBrandFilter.filter(product =>
      this.selectedBrand === this.allBrandsLabel || product.displayBrand === this.selectedBrand
    );
  }

  get groupedProducts(): Array<{ category: string; items: CatalogProductView[] }> {
    const groups = new Map<string, CatalogProductView[]>();

    for (const product of this.filteredProducts) {
      const currentProducts = groups.get(product.displayCategory) || [];
      currentProducts.push(product);
      groups.set(product.displayCategory, currentProducts);
    }

    return sortCategoryOptions([...groups.keys()]).map(category => ({
      category,
      items: [...(groups.get(category) || [])].sort((left, right) => left.nombre.localeCompare(right.nombre))
    }));
  }

  setCategory(category: string) {
    this.selectedCategory = category;
    if (!this.brandOptions.includes(this.selectedBrand)) {
      this.selectedBrand = this.allBrandsLabel;
    }
  }

  setBrand(brand: string) {
    this.selectedBrand = brand;
  }

  cargarProductos() {
    this.cargando = true;
    this.error = null;

    this.productService.getProducts().subscribe({
      next: (data: Product[]) => {
        this.productos = data
          .filter(product => product.estado !== 'INACTIVO')
          .map(product => enrichCatalogProduct(product));
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando catálogo:', err);
        this.error = 'No se pudieron cargar los productos. Intenta más tarde.';
        this.cargando = false;
      }
    });
  }

  getSelectedQuantity(producto: CatalogProductView): number {
    return this.selectedQuantities[this.getProductSelectionKey(producto)] ?? 1;
  }

  increaseSelectedQuantity(producto: CatalogProductView, event?: Event) {
    event?.stopPropagation();
    const key = this.getProductSelectionKey(producto);
    this.selectedQuantities = {
      ...this.selectedQuantities,
      [key]: this.getSelectedQuantity(producto) + 1
    };
  }

  decreaseSelectedQuantity(producto: CatalogProductView, event?: Event) {
    event?.stopPropagation();
    const key = this.getProductSelectionKey(producto);
    const nextQuantity = Math.max(1, this.getSelectedQuantity(producto) - 1);
    this.selectedQuantities = {
      ...this.selectedQuantities,
      [key]: nextQuantity
    };
  }

  async agregarAlCarrito(producto: CatalogProductView, quantity = this.getSelectedQuantity(producto)) {
    this.cart.addItem({
      id: producto.id,
      name: producto.nombre,
      emoji: '📦',
      presentation: producto.presentacion,
      price: producto.precio,
      imageUrl: producto.resolvedImageUrl
    }, quantity);

    const toast = await this.toastController.create({
      message: `${quantity} ${quantity === 1 ? 'unidad agregada' : 'unidades agregadas'} de ${producto.nombre}`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();

    const key = this.getProductSelectionKey(producto);
    this.selectedQuantities = {
      ...this.selectedQuantities,
      [key]: 1
    };
  }

  abrirVistaPrevia(producto: CatalogProductView) {
    this.previewProduct = producto;
  }

  cerrarVistaPrevia() {
    this.previewProduct = null;
  }

  onProductImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }

  trackByProduct(_index: number, product: CatalogProductView): string {
    return product.id;
  }

  private get filteredProductsWithoutBrandFilter(): CatalogProductView[] {
    const searchTerm = this.normalizeValue(this.searchTerm);

    return this.productos.filter(product => {
      const matchesCategory = this.selectedCategory === this.allCategoriesLabel || product.displayCategory === this.selectedCategory;
      const searchableText = this.normalizeValue([
        product.id,
        product.nombre,
        product.presentacion,
        product.displayCategory,
        product.displayBrand
      ].join(' '));
      const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

      return matchesCategory && matchesSearch;
    });
  }

  private normalizeValue(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private getProductSelectionKey(producto: CatalogProductView): string {
    return `${producto.id}::${producto.presentacion}`;
  }
}
