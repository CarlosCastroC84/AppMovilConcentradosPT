import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

export interface CatalogProductView extends Product {
  displayCategory: string;
  displayBrand: string;
  resolvedImageUrl: string;
}

const DEFAULT_IMAGE = 'assets/Logos_dpt.png';

export const CATEGORY_ORDER = [
  'Ganaderia',
  'Pollo Engorde',
  'Posturas',
  'Porcicultura',
  'Equinos',
  'Acuicultura',
  'Ovinos',
  'Conejos',
  'Sales',
  'Mascotas Finca',
  'Mascotas Italcol',
  'Abonos',
  'Venenos',
  'Maiz y Materias Primas',
  'Ferreteria',
  'Otros'
] as const;

const CATEGORY_RULES: Array<{ label: string; keywords: string[] }> = [
  { label: 'Ganaderia', keywords: ['vaca', 'cremosa', 'superternera'] },
  { label: 'Pollo Engorde', keywords: ['pollito', 'super pollito', 'pollo iniciacion', 'pollo engorde', 'f.pollito', 'pollo campesino'] },
  { label: 'Posturas', keywords: ['pollita', 'prepico', 'codorniz', 'arranque', 'hna', 'queb'] },
  { label: 'Porcicultura', keywords: ['cerdito', 'cerdo', 'cerda', 'f.cerdo', 'f.cerda', 'ag1', 'ag2'] },
  { label: 'Equinos', keywords: ['furia total'] },
  { label: 'Acuicultura', keywords: ['mojarra'] },
  { label: 'Ovinos', keywords: ['italovinos'] },
  { label: 'Conejos', keywords: ['conejo'] },
  { label: 'Sales', keywords: ['italsal', 'pack fique', 'tropico', 'lecheria'] },
  { label: 'Mascotas Finca', keywords: ['filpo', 'ringo'] },
  { label: 'Mascotas Italcol', keywords: ['chunky', 'italcan', 'mirringo', 'tuffy', 'agility', 'don kat', 'q-ida', 'qida'] },
  { label: 'Abonos', keywords: ['10-30-10', 'radio menores', 'remital', 'aboteck', 'triple 15', 'urea', '10-20-20', 'amina'] },
  { label: 'Venenos', keywords: ['raton', 'gramoxone', 'glifosato', 'randan', 'cipermetrina'] },
  { label: 'Maiz y Materias Primas', keywords: ['maiz', 'repila', 'h3', 'carbonato'] },
  { label: 'Ferreteria', keywords: ['arnero', 'plastico negro', 'maguera', 'palos', 'cincel', 'gancho', 'cerbo', 'brida', 'carbon', 'sal toro', 'sal la y', 'abrazadera', 'cemento'] }
];

const BRAND_RULES: Array<{ label: string; keywords: string[] }> = [
  { label: 'Atalsal', keywords: ['italsal', 'pack fique', 'tropico', 'lecheria'] },
  { label: 'Italcol', keywords: ['chunky', 'italcan', 'mirringo', 'tuffy', 'agility', 'don kat', 'q-ida', 'qida'] },
  { label: 'Finca', keywords: ['filpo', 'ringo', 'f.cerdo', 'f.cerda', 'f.pollito', 'finca', 'ag1', 'ag2'] },
  { label: 'Yara', keywords: ['10-30-10', 'radio menores', 'remital', 'aboteck', 'triple 15', 'urea', '10-20-20', 'amina'] }
];

export function enrichCatalogProduct(product: Product): CatalogProductView {
  const displayCategory = product.categoria?.trim() || inferCategory(product.nombre);
  const displayBrand = product.marca?.trim() || inferBrand(product.nombre, displayCategory);

  return {
    ...product,
    categoria: displayCategory,
    marca: displayBrand,
    displayCategory,
    displayBrand,
    resolvedImageUrl: resolveImageUrl(product)
  };
}

export function sortCategoryOptions(categories: string[]): string[] {
  return [...categories].sort((left, right) => categorySortValue(left) - categorySortValue(right) || left.localeCompare(right));
}

export function sortBrandOptions(brands: string[]): string[] {
  return [...brands].sort((left, right) => left.localeCompare(right));
}

function resolveImageUrl(product: Product): string {
  if (product.imagenUrl?.trim()) {
    return product.imagenUrl.trim();
  }

  if (product.imagenKey?.trim()) {
    const baseUrl = environment.awsConfig.s3BaseUrl?.replace(/\/+$/, '');
    const normalizedKey = product.imagenKey.trim().replace(/^\/+/, '');
    if (baseUrl) {
      return `${baseUrl}/${normalizedKey}`;
    }
  }

  return DEFAULT_IMAGE;
}

function inferCategory(name: string): string {
  const normalizedName = normalizeValue(name);
  const matchedRule = CATEGORY_RULES.find(rule => rule.keywords.some(keyword => normalizedName.includes(keyword)));
  return matchedRule?.label || 'Otros';
}

function inferBrand(name: string, category: string): string {
  const normalizedName = normalizeValue(name);
  const matchedRule = BRAND_RULES.find(rule => rule.keywords.some(keyword => normalizedName.includes(keyword)));
  if (matchedRule) {
    return matchedRule.label;
  }

  switch (category) {
    case 'Mascotas Finca':
    case 'Porcicultura':
      return 'Finca';
    case 'Mascotas Italcol':
      return 'Italcol';
    case 'Sales':
      return 'Atalsal';
    case 'Abonos':
      return 'Yara';
    default:
      return 'Puente Tierra';
  }
}

function normalizeValue(value: string | undefined): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function categorySortValue(category: string): number {
  const index = CATEGORY_ORDER.indexOf(category as (typeof CATEGORY_ORDER)[number]);
  return index >= 0 ? index : CATEGORY_ORDER.length;
}
