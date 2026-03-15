import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CatalogProductView, enrichCatalogProduct } from '../../utils/catalog-product.util';
import { Product } from '../../models/product.model';

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
  searchLoading = false;
  searchReady = false;
  isSearchFocused = false;

  private router = inject(Router);
  private productService = inject(ProductService);

  constructor() { }

  ngOnInit() {
    this.cargarProductosBusqueda();
  }

  buscarProductos() {
    const term = this.searchTerm.trim();

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

  onSuggestionImageError(event: Event) {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.src.includes(this.fallbackImage)) {
      return;
    }

    image.src = this.fallbackImage;
  }

  get shouldShowSearchPanel(): boolean {
    return this.isSearchFocused && !!this.searchTerm.trim();
  }

  get showEmptyResults(): boolean {
    return this.shouldShowSearchPanel && this.searchReady && !this.searchLoading && this.searchResults.length === 0;
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

  private normalizeValue(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
