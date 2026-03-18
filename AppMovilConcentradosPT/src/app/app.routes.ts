import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { customerAuthGuard } from './guards/customer-auth.guard';
import { permissionGuard } from './guards/permission.guard';
import { STAFF_PERMISSIONS } from './models/session-profile.model';


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
    path: 'cuenta',
    loadComponent: () => import('./pages/cuenta/cuenta.page').then((m) => m.CuentaPage),
  },
  {
    path: 'auth/callback',
    loadComponent: () => import('./pages/auth-callback/auth-callback.page').then((m) => m.AuthCallbackPage),
  },
  {
    path: 'detalle-producto',
    loadComponent: () => import('./pages/detalle-producto/detalle-producto.page').then((m) => m.DetalleProductoPage),
  },
  {
    path: 'atencion-cliente',
    loadComponent: () => import('./pages/atencion-cliente/atencion-cliente.page').then((m) => m.AtencionClientePage),
  },
  {
    path: 'panel-admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/panel-admin/panel-admin.page').then((m) => m.PanelAdminPage),
  },
  {
    path: 'gestion-productos',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.productsManage)],
    loadComponent: () => import('./pages/gestion-productos/gestion-productos.page').then((m) => m.GestionProductosPage),
  },
  {
    path: 'gestion-pedidos',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.ordersManage)],
    loadComponent: () => import('./pages/gestion-pedidos/gestion-pedidos.page').then((m) => m.GestionPedidosPage),
  },
  {
    path: 'mayoristas',
    loadComponent: () => import('./pages/mayoristas/mayoristas.page').then((m) => m.MayoristasPage),
  },
  {
    path: 'configuracion-general',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/configuracion-general/configuracion-general.page').then((m) => m.ConfiguracionGeneralPage),
  },
  {
    path: 'dashboard-ventas',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.salesView)],
    loadComponent: () => import('./pages/dashboard-ventas/dashboard-ventas.page').then((m) => m.DashboardVentasPage),
  },
  {
    path: 'gestion-pedido-ventas',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.ordersView)],
    loadComponent: () => import('./pages/gestion-pedido-ventas/gestion-pedido-ventas.page').then((m) => m.GestionPedidoVentasPage),
  },
  {
    path: 'bandeja-alistamiento',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.warehousePick)],
    loadComponent: () => import('./pages/bandeja-alistamiento/bandeja-alistamiento.page').then((m) => m.BandejaAlistamientoPage),
  },
  {
    path: 'checklist-alistamiento',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.warehousePick)],
    loadComponent: () => import('./pages/checklist-alistamiento/checklist-alistamiento.page').then((m) => m.ChecklistAlistamientoPage),
  },
  {
    path: 'despacho-pedidos-bodega',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.warehouseDispatch)],
    loadComponent: () => import('./pages/despacho-pedidos-bodega/despacho-pedidos-bodega.page').then((m) => m.DespachoPedidosBodegaPage),
  },
  {
    path: 'gestion-usuarios-admin',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.usersManage)],
    loadComponent: () => import('./pages/gestion-usuarios-admin/gestion-usuarios-admin.page').then((m) => m.GestionUsuariosAdminPage),
  },
  {
    path: 'configuracion-negocio-admin',
    canActivate: [adminGuard, permissionGuard(STAFF_PERMISSIONS.settingsManage)],
    loadComponent: () => import('./pages/configuracion-negocio-admin/configuracion-negocio-admin.page').then((m) => m.ConfiguracionNegocioAdminPage),
  },
  {
    path: 'confirmacion-pedido-cliente',
    loadComponent: () => import('./pages/confirmacion-pedido-cliente/confirmacion-pedido-cliente.page').then((m) => m.ConfirmacionPedidoClientePage),
  },
  {
    path: 'perfil-auditoria-staff',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/perfil-auditoria-staff/perfil-auditoria-staff.page').then((m) => m.PerfilAuditoriaStaffPage),
  },
  {
    path: '',
    loadComponent: () => import('./layout/customer-shell/customer-shell.component').then((m) => m.CustomerShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
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
        path: 'mi-pedido',
        loadComponent: () => import('./pages/mi-pedido/mi-pedido.page').then((m) => m.MiPedidoPage),
      },
      {
        path: 'mis-pedidos',
        canActivate: [customerAuthGuard],
        loadComponent: () => import('./pages/mis-pedidos/mis-pedidos.page').then((m) => m.MisPedidosPage),
      },
      {
        path: 'perfil',
        canActivate: [customerAuthGuard],
        loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
      }
    ]
  },
];
