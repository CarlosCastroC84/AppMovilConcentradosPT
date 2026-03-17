import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CatalogMasterService } from '../../services/catalog-master.service';
import { CartService } from '../../services/cart.service';
import { CatalogProductView, enrichCatalogProduct } from '../../utils/catalog-product.util';
import { Product } from '../../models/product.model';
import { CatalogMasterItem } from '../../models/catalog-master-item.model';
import { environment } from '../../../environments/environment';

interface InicioCategoryCard extends CatalogMasterItem {
  resolvedImageUrl: string;
}

const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
  ganaderia: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPDAkhq8aeYtslLDrTtFY2qCGmA7hQsSZ2WFPKvR_M0A4oKW0i4FJFsE4kSfV1a8CK1OG_C7ST8CRP2riLagwR7gZeXcH2l6jxYurpwank5Qb_gF2AjC9maoX447RViqwWnaajY36Kiewta_ewuL-5y52exrGVKQ3rCcyL6RvTL2p7JN9TEW8lB7jp_qKMnuJmjtUvOmcYqqK1lCnsSaRrAnlymBP7KNd-KvWIGNd7dyl6fkB8N2M9QsdNDwE2pYPaLG9lV8txXyA',
  acuicultura: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZ2Rf_FpyLzrbPki9LpQtrOAYHNSPyCJEpuTk6JuMLdj6EQvTd4DZn8l3G7bKavvR6TU0I_OGnzI8XvGM0J0fSDOU5AB5Pa6fjHIuShAHl9Mh2whaeibrxQAnIJT1yUnUrFZWLGcPTDijJCn07F1dx7zr-NE6zLAgJ7mS2rXCYYbipc3M50PGXkmnJE1-tFGTVvpWoLMjQ3XTYUMV71TMMNjMDNd6WaVoRjK9NocwO5JKLtloG2nZE7IXJJNl1dKATFwdEYTN5NJI',
  porcicultura: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUCRN3yydkx1ZU8YcnQI7Q8e6Jdt5g-FsT3hjyitI0lZSJccpxi1-a_KopIWjVrV6YvNefT_lb9fE4Uv4XExcPl8thhoDYeRrNP8RfkwiZDyISit0dP8YPFre7qXZWeAcmGbC6YRfLILm47roBAntKSWet2WiNPt1PvJO2bF7VfWpGFj6LVMVd6CdKBGgC607v-FAi1-sgj1q0Sfuze-dWeZoXDVXT1wobAmeemdQ7n2r9BrSlttzO9ZpUR-KWv1JxuZDYagC2AjU',
  equinos: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBu6AT_950MGa05h2xxNPcG1lBZD3AM7eMWrqUggn8D07eU11wi4tSUMQRqfLuqufMcIpP5i1Ii5PngCbAcTvKQGuuGzHqKKXO3x688opWd8fs09yT11GAjRnKHNDSflYPU_Tf84T93OvPXyZ5L2XSxglZh3WWceF_UW7TrgAkcvNfGWC2jUB-RtrEbgfIAlAOR5mp2hpSuDzezAzVt1mcOinmEEJY6CKRUVXLjaQyg4Uts7hfJ_ONBAOkxjo-lTIlDgkmMR32Xno8'
};

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class InicioPage implements OnInit {
  readonly fallbackImage = 'assets/Logos_dpt.png';

  searchTerm = '';
  searchResults: CatalogProductView[] = [];
  products: CatalogProductView[] = [];
  categories: InicioCategoryCard[] = this.buildDefaultCategories();
  searchLoading = false;
  searchReady = false;
  isSearchFocused = false;

  private router = inject(Router);
  private productService = inject(ProductService);
  private catalogMasterService = inject(CatalogMasterService);
  readonly cart = inject(CartService);

  ngOnInit() {
    this.cargarProductosBusqueda();
    this.cargarCategorias();
  }

  irALoginAdmin() {
    void this.router.navigate(['/login-operativo']);
  }

  irAMayoristas() {
    void this.router.navigate(['/mayoristas']);
  }

  irACatalogo() {
    this.isSearchFocused = false;
    void this.router.navigate(['/catalogo']);
  }

  buscarProductos() {
    const term = this.searchTerm.trim();
    this.isSearchFocused = false;

    void this.router.navigate(['/catalogo'], {
      queryParams: term ? { q: term } : {}
    });
  }

  onSearchTermChange(value: string) {
    this.searchTerm = value;
    this.updateSearchResults();
  }

  onSearchFocus() {
    this.isSearchFocused = true;
    this.updateSearchResults();
  }

  onSearchBlur() {
    window.setTimeout(() => {
      this.isSearchFocused = false;
    }, 150);
  }

  seleccionarProducto(product: CatalogProductView) {
    this.searchTerm = product.nombre;
    this.searchResults = [];
    this.isSearchFocused = false;

    void this.router.navigate(['/catalogo'], {
      queryParams: { q: product.nombre }
    });
  }

  verResultados() {
    this.searchResults = [];
    this.isSearchFocused = false;
    this.buscarProductos();
  }

  verCategoria(category: InicioCategoryCard) {
    this.isSearchFocused = false;
    void this.router.navigate(['/catalogo'], {
      queryParams: { categoria: category.nombre }
    });
  }

  onSuggestionImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }

  onCategoryImageError(event: Event, category: InicioCategoryCard) {
    const image = event.target as HTMLImageElement | null;
    if (!image) {
      return;
    }

    const fallback = FALLBACK_CATEGORY_IMAGES[category.id] || this.fallbackImage;
    if (image.src.includes(fallback)) {
      return;
    }

    image.src = fallback;
  }

  get shouldShowSearchPanel(): boolean {
    return this.isSearchFocused && !!this.searchTerm.trim();
  }

  get showEmptyResults(): boolean {
    return this.shouldShowSearchPanel && this.searchReady && !this.searchLoading && this.searchResults.length === 0;
  }

  get activeProductsCount(): number {
    return this.products.length;
  }

  get categoriesCount(): number {
    return this.categories.length;
  }

  get cartSummary(): string {
    return this.cart.totalItems > 0
      ? `${this.cart.totalItems} ${this.cart.totalItems === 1 ? 'item listo' : 'items listos'}`
      : 'Arma tu pedido';
  }

  irAHacerPedido() {
    const route = this.cart.totalItems > 0 ? '/mi-pedido' : '/catalogo';
    this.isSearchFocused = false;
    void this.router.navigate([route]);
  }

  trackByCategory(_index: number, category: InicioCategoryCard): string {
    return category.id;
  }


  private cargarProductosBusqueda() {
    this.searchLoading = true;

    this.productService.getProducts().subscribe({
      next: (products: Product[]) => {
        this.products = products
          .filter(product => product.estado !== 'INACTIVO')
          .map(product => enrichCatalogProduct(product));
        this.searchReady = true;
        this.searchLoading = false;
        this.updateSearchResults();
      },
      error: error => {
        console.error('Error cargando productos para la búsqueda de inicio:', error);
        this.products = [];
        this.searchReady = true;
        this.searchLoading = false;
        this.updateSearchResults();
      }
    });
  }

  private cargarCategorias() {
    this.catalogMasterService.getCategoriasProducto().subscribe({
      next: categories => {
        this.categories = categories
          .filter(category => category.activo !== false)
          .sort((left, right) => (left.orden ?? 999) - (right.orden ?? 999))
          .map(category => ({
            ...category,
            resolvedImageUrl: this.resolveCategoryImage(category)
          }));
      },
      error: error => {
        console.error('Error cargando categorías para inicio:', error);
      }
    });
  }

  private updateSearchResults() {
    const term = this.normalizeValue(this.searchTerm);

    if (!term) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.products
      .filter(product => {
        const searchableText = this.normalizeValue([
          product.nombre,
          product.displayCategory,
          product.displayBrand,
          product.presentacion
        ].join(' '));

        return searchableText.includes(term);
      })
      .sort((left, right) => left.nombre.localeCompare(right.nombre))
      .slice(0, 6);
  }

  private resolveCategoryImage(category: CatalogMasterItem): string {
    if (category.imagenUrl?.trim()) {
      return category.imagenUrl.trim();
    }

    if (category.imagenKey?.trim()) {
      const baseUrl = environment.awsConfig.s3BaseUrl?.replace(/\/+$/, '');
      const normalizedKey = category.imagenKey.trim().replace(/^\/+/, '');
      if (baseUrl) {
        return `${baseUrl}/${normalizedKey}`;
      }
    }

    return FALLBACK_CATEGORY_IMAGES[category.id] || this.fallbackImage;
  }

  private buildDefaultCategories(): InicioCategoryCard[] {
    return [
      { id: 'ganaderia', nombre: 'Ganaderia', orden: 1, resolvedImageUrl: FALLBACK_CATEGORY_IMAGES['ganaderia'] },
      { id: 'acuicultura', nombre: 'Acuicultura', orden: 2, resolvedImageUrl: FALLBACK_CATEGORY_IMAGES['acuicultura'] },
      { id: 'porcicultura', nombre: 'Porcicultura', orden: 3, resolvedImageUrl: FALLBACK_CATEGORY_IMAGES['porcicultura'] },
      { id: 'equinos', nombre: 'Equinos', orden: 4, resolvedImageUrl: FALLBACK_CATEGORY_IMAGES['equinos'] }
    ];
  }

  private normalizeValue(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
