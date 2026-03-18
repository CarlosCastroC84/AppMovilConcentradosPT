export const STAFF_PERMISSIONS = {
    dashboardView: 'dashboard.view',
    ordersView: 'orders.view',
    ordersManage: 'orders.manage',
    ordersCancel: 'orders.cancel',
    ordersReturn: 'orders.return',
    productsManage: 'products.manage',
    salesView: 'sales.view',
    usersManage: 'users.manage',
    settingsManage: 'settings.manage',
    warehousePick: 'warehouse.pick',
    warehouseDispatch: 'warehouse.dispatch'
} as const;

export type StaffPermission = typeof STAFF_PERMISSIONS[keyof typeof STAFF_PERMISSIONS];

export interface SessionModule {
    key: string;
    title: string;
    route: string;
    icon: string;
}

export interface SessionUserProfile {
    user: {
        username: string;
        email: string;
        name: string;
    };
    role: string;
    defaultRoute: string;
    permissions: StaffPermission[];
    modules: SessionModule[];
}
