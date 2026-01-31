import { Injectable } from '@angular/core';

export interface Permission {
    id: number;
    name: string;
    code: string;
    description?: string;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {

    /**
     * ===============================
     * DEV MODE – ADMIN CÓ TẤT CẢ QUYỀN
     * ===============================
     */

    /** Luôn trả về true */
    hasPermission(_permissionCode: string): boolean {
        return true;
    }

    /** Luôn trả về true */
    hasAnyPermission(_permissionCodes: string[]): boolean {
        return true;
    }

    /** Luôn trả về true */
    hasAllPermissions(_permissionCodes: string[]): boolean {
        return true;
    }

    /** Trả về mảng permission giả (để tránh lỗi UI) */
    getPermissions(): Permission[] {
        return [
            { id: 1, name: 'ADMIN_ALL', code: 'admin.all' }
        ];
    }

    /** Không làm gì */
    setPermissions(_permissions: Permission[]): void {}

    /** Không làm gì */
    setRolePermissions(_roleId: number): void {}

    /** Không làm gì */
    clearPermissions(): void {}

    /**
     * ===============================
     * MENU – KHÔNG FILTER
     * ===============================
     */

    /** Giữ nguyên menu */
    getFilteredMenuItems(menuItems: any[]): any[] {
        return menuItems;
    }
}
