export type AdminUserRole = 'ADMIN' | 'GERENTE' | 'VENTAS' | 'BODEGA';

export type CognitoAdminUserStatus =
    | 'CONFIRMED'
    | 'FORCE_CHANGE_PASSWORD'
    | 'RESET_REQUIRED'
    | 'UNCONFIRMED'
    | 'ARCHIVED'
    | 'COMPROMISED'
    | 'UNKNOWN';

export interface AdminUser {
    username: string;
    email: string;
    name: string;
    role: AdminUserRole;
    enabled: boolean;
    status: CognitoAdminUserStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAdminUserRequest {
    name: string;
    email: string;
    role: AdminUserRole;
    temporaryPassword?: string;
}
