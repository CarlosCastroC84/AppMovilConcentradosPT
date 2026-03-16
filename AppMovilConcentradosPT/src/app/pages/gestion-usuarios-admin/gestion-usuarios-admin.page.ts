import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import {
    AdminUser,
    AdminUserRole,
    CreateAdminUserRequest
} from '../../models/admin-user.model';
import { AdminUsersService } from '../../services/admin-users.service';

type UserFilter = 'TODOS' | AdminUserRole;

interface AdminUserView {
    id: string;
    username: string;
    name: string;
    email: string;
    role: AdminUserRole;
    active: boolean;
    status: string;
    lastAccess: string;
}

interface NewUserForm {
    name: string;
    email: string;
    role: AdminUserRole;
    temporaryPassword: string;
}


@Component({
    selector: 'app-gestion-usuarios-admin',
    templateUrl: './gestion-usuarios-admin.page.html',
    styleUrls: ['./gestion-usuarios-admin.page.scss'],
    standalone: true,
    imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class GestionUsuariosAdminPage implements OnInit {
    private adminUsersService = inject(AdminUsersService);
    private toastController = inject(ToastController);


    users: AdminUserView[] = [];
    loading = true;
    error: string | null = null;

    searchTerm = '';
    activeFilter: UserFilter = 'TODOS';

    showCreateModal = false;

    newUserForm: NewUserForm = {
        name: '',
        email: '',
        role: 'VENTAS',
        temporaryPassword: ''
    };


    ngOnInit(): void {
        this.loadUsers();
    }



    get filteredUsers(): AdminUserView[] {
        const search = this.searchTerm.trim().toLowerCase();

        return [...this.users]
            .filter(user => this.activeFilter === 'TODOS' || user.role === this.activeFilter)
            .filter(user => {
                if (!search) {
                    return true;
                }

                return [
                    user.name,
                    user.email,
                    this.getRoleLabel(user.role)
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(search);
            })
            .sort((left, right) => left.name.localeCompare(right.name));
    }

    get totalUsers(): number {
        return this.filteredUsers.length;
    }

    setFilter(filter: UserFilter): void {
        this.activeFilter = filter;
    }

    openCreateModal(): void {
        this.showCreateModal = true;
    }

    closeCreateModal(): void {
        this.showCreateModal = false;
        this.resetNewUserForm();
    }

    createUser(): void {
        const name = this.newUserForm.name.trim();
        const email = this.newUserForm.email.trim().toLowerCase();
        const role = this.newUserForm.role;
        const temporaryPassword = this.newUserForm.temporaryPassword.trim();

        if (!temporaryPassword) {
            void this.showToast('Ingresa una contraseña temporal.', 'warning');
            return;
        }

        if (temporaryPassword.length < 8) {
            void this.showToast('La contraseña temporal debe tener al menos 8 caracteres.', 'warning');
            return;
        }

        if (!name || !email) {
            void this.showToast('Ingresa nombre y correo del usuario.', 'warning');
            return;
        }

        if (!this.isValidEmail(email)) {
            void this.showToast('Ingresa un correo válido.', 'warning');
            return;
        }

        const payload: CreateAdminUserRequest = {
            name,
            email,
            role,
            temporaryPassword
        };


        this.adminUsersService.createUser(payload).subscribe({
            next: user => {
                this.upsertUser(this.toViewModel(user));
                this.closeCreateModal();
                void this.showToast(
                    'Usuario creado en Cognito. Quedará en cambio de contraseña si usas password temporal.',
                    'success'
                );
            },
            error: (error: Error) => {
                void this.showToast(
                    error.message || 'No fue posible crear el usuario en Cognito.',
                    'danger'
                );
            }
        });
    }

    toggleUserStatus(user: AdminUserView): void {
        const nextEnabled = !user.active;

        this.adminUsersService.setUserEnabled(user.username, nextEnabled).subscribe({
            next: () => {
                this.users = this.users.map(item =>
                    item.username === user.username
                        ? {
                            ...item,
                            active: nextEnabled,
                            lastAccess: new Date().toISOString()
                        }
                        : item
                );

                void this.showToast(
                    `${user.name} ahora está ${nextEnabled ? 'activo' : 'inactivo'}.`,
                    'success'
                );
            },
            error: (error: Error) => {
                void this.showToast(
                    error.message || 'No fue posible cambiar el estado del usuario.',
                    'danger'
                );
            }
        });
    }

    resetPassword(user: AdminUserView): void {
        this.adminUsersService.resetUserPassword(user.username).subscribe({
            next: response => {
                void this.showToast(
                    response.message || `Reset de contraseña solicitado para ${user.email}.`,
                    'success'
                );
            },
            error: (error: Error) => {
                void this.showToast(
                    error.message || 'No fue posible resetear la contraseña.',
                    'danger'
                );
            }
        });
    }

    openAuditLog(): void {
        void this.showToast('Audit log pendiente de integrar con backend.', 'medium');
    }

    getRoleLabel(role: AdminUserRole): string {
        switch (role) {
            case 'ADMIN':
                return 'Administradores';
            case 'VENTAS':
                return 'Ventas';
            case 'BODEGA':
                return 'Bodega';
            default:
                return role;
        }
    }

    getRoleBadgeClass(role: AdminUserRole): string {
        switch (role) {
            case 'ADMIN':
                return 'badge-admin';
            case 'VENTAS':
                return 'badge-sales';
            case 'BODEGA':
                return 'badge-warehouse';
            default:
                return 'badge-admin';
        }
    }

    getRoleBorderClass(role: AdminUserRole): string {
        switch (role) {
            case 'ADMIN':
                return 'border-admin';
            case 'VENTAS':
                return 'border-sales';
            case 'BODEGA':
                return 'border-warehouse';
            default:
                return 'border-admin';
        }
    }

    getRoleCardClass(role: AdminUserRole): string {
        switch (role) {
            case 'ADMIN':
                return 'admin-border';
            case 'VENTAS':
                return 'sales-border';
            case 'BODEGA':
                return 'warehouse-border';
            default:
                return 'admin-border';
        }
    }

    getRoleSliderClass(role: AdminUserRole): string {
        switch (role) {
            case 'ADMIN':
                return 'bg-admin';
            case 'VENTAS':
                return 'bg-sales';
            case 'BODEGA':
                return 'bg-warehouse';
            default:
                return 'bg-admin';
        }
    }

    getUserInitials(user: AdminUserView): string {
        const parts = user.name.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return 'PT';
        }

        return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('');
    }

    getRelativeAccess(dateValue: string): string {
        if (!dateValue) {
            return 'Sin registro';
        }

        const now = Date.now();
        const then = new Date(dateValue).getTime();

        if (Number.isNaN(then)) {
            return 'Sin registro';
        }

        const diffInMinutes = Math.max(1, Math.floor((now - then) / 60000));

        if (diffInMinutes < 60) {
            return `Hace ${diffInMinutes} min`;
        }

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `Hace ${diffInHours}h`;
        }

        const diffInDays = Math.floor(diffInHours / 24);
        return `Hace ${diffInDays} día${diffInDays === 1 ? '' : 's'}`;
    }

    trackByUser(_index: number, user: AdminUserView): string {
        return user.id;
    }

    private loadUsers(): void {
        this.loading = true;
        this.error = null;

        this.adminUsersService.listUsers().subscribe({
            next: users => {
                this.users = users.map(user => this.toViewModel(user));
                this.loading = false;
            },
            error: (error: Error) => {
                this.users = [];
                this.error = error.message || 'No fue posible cargar los usuarios de Cognito.';
                this.loading = false;
            }
        });
    }

    private toViewModel(user: AdminUser): AdminUserView {
        return {
            id: user.username,
            username: user.username,
            name: user.name || user.email || user.username,
            email: user.email || user.username,
            role: user.role,
            active: user.enabled,
            status: user.status,
            lastAccess: user.updatedAt || user.createdAt || ''
        };
    }

    private upsertUser(user: AdminUserView): void {
        const index = this.users.findIndex(item => item.username === user.username);

        if (index >= 0) {
            this.users = [
                ...this.users.slice(0, index),
                user,
                ...this.users.slice(index + 1)
            ];
            return;
        }

        this.users = [user, ...this.users];
    }

    private resetNewUserForm(): void {
        this.newUserForm = {
            name: '',
            email: '',
            role: 'VENTAS',
            temporaryPassword: ''
        };
    }


    private isValidEmail(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }




    private async showToast(message: string, color: string): Promise<void> {
        const toast = await this.toastController.create({
            message,
            color,
            duration: 2200,
            position: 'top'
        });

        await toast.present();
    }
}
