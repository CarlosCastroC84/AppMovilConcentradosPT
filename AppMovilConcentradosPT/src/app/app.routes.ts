import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';


export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login-operativo',
    loadComponent: () => import('./pages/login-operativo/login-operativo.page').then((m) => m.LoginOperativoPage),
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
  },
  {
    path: 'catalogo',
    loadComponent: () => import('./pages/catalogo/catalogo.page').then((m) => m.CatalogoPage),
  },
  {
    path: 'detalle-producto',
    loadComponent: () => import('./pages/detalle-producto/detalle-producto.page').then((m) => m.DetalleProductoPage),
  },
  {
    path: 'mi-pedido',
    loadComponent: () => import('./pages/mi-pedido/mi-pedido.page').then((m) => m.MiPedidoPage),
  },
  {
    path: 'atencion-cliente',
    loadComponent: () => import('./pages/atencion-cliente/atencion-cliente.page').then((m) => m.AtencionClientePage),
  },
  {
    path: 'panel-admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/panel-admin/panel-admin.page').then((m) => m.PanelAdminPage),
  },
  {
    path: 'gestion-productos',
    canActivate: [authGuard, permissionGuard('products.manage')],
    loadComponent: () => import('./pages/gestion-productos/gestion-productos.page').then((m) => m.GestionProductosPage),
  },
  {
    path: 'gestion-pedidos',
    canActivate: [authGuard, permissionGuard('orders.manage')],
    loadComponent: () => import('./pages/gestion-pedidos/gestion-pedidos.page').then((m) => m.GestionPedidosPage),
  },
  {
    path: 'mayoristas',
    loadComponent: () => import('./pages/mayoristas/mayoristas.page').then((m) => m.MayoristasPage),
  },
  {
    path: 'configuracion-general',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/configuracion-general/configuracion-general.page').then((m) => m.ConfiguracionGeneralPage),
  },
  {
    path: 'dashboard-ventas',
    canActivate: [authGuard, permissionGuard('sales.view')],
    loadComponent: () => import('./pages/dashboard-ventas/dashboard-ventas.page').then((m) => m.DashboardVentasPage),
  },
  {
    path: 'gestion-pedido-ventas',
    canActivate: [authGuard, permissionGuard('orders.view')],
    loadComponent: () => import('./pages/gestion-pedido-ventas/gestion-pedido-ventas.page').then((m) => m.GestionPedidoVentasPage),
  },
  {
    path: 'bandeja-alistamiento',
    canActivate: [authGuard, permissionGuard('warehouse.pick')],
    loadComponent: () => import('./pages/bandeja-alistamiento/bandeja-alistamiento.page').then((m) => m.BandejaAlistamientoPage),
  },
  {
    path: 'checklist-alistamiento',
    canActivate: [authGuard, permissionGuard('warehouse.pick')],
    loadComponent: () => import('./pages/checklist-alistamiento/checklist-alistamiento.page').then((m) => m.ChecklistAlistamientoPage),
  },
  {
    path: 'despacho-pedidos-bodega',
    canActivate: [authGuard, permissionGuard('warehouse.dispatch')],
    loadComponent: () => import('./pages/despacho-pedidos-bodega/despacho-pedidos-bodega.page').then((m) => m.DespachoPedidosBodegaPage),
  },
  {
    path: 'gestion-usuarios-admin',
    canActivate: [authGuard, permissionGuard('users.manage')],
    loadComponent: () => import('./pages/gestion-usuarios-admin/gestion-usuarios-admin.page').then((m) => m.GestionUsuariosAdminPage),
  },
  {
    path: 'configuracion-negocio-admin',
    canActivate: [authGuard, permissionGuard('settings.manage')],
    loadComponent: () => import('./pages/configuracion-negocio-admin/configuracion-negocio-admin.page').then((m) => m.ConfiguracionNegocioAdminPage),
  },
  {
    path: 'confirmacion-pedido-cliente',
    loadComponent: () => import('./pages/confirmacion-pedido-cliente/confirmacion-pedido-cliente.page').then((m) => m.ConfirmacionPedidoClientePage),
  },
  {
    path: 'perfil-auditoria-staff',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/perfil-auditoria-staff/perfil-auditoria-staff.page').then((m) => m.PerfilAuditoriaStaffPage),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
];
