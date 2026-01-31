import { Injectable } from '@angular/core';

/* =======================
   INTERFACES
======================= */
export interface Permission {
    id: number;
    name: string;
    code: string;
    description?: string;
}

export interface RolePermission {
    roleId: number;
    permissions: Permission[];
}

/* =======================
   SERVICE
======================= */
@Injectable({ providedIn: 'root' })
export class PermissionService {

    private readonly permissionsKey = 'user_permissions';
    private readonly roleKey = 'user_role';

    /* =======================
       STATIC PERMISSIONS
       👉 Dùng cho menu / guard
    ======================= */
    public static readonly PERMISSIONS = {
        DASHBOARD_VIEW: 'dashboard.view',

        COURSES_VIEW: 'courses.view',
        COURSES_CREATE: 'courses.create',
        COURSES_EDIT: 'courses.edit',
        COURSES_DELETE: 'courses.delete',

        CLASS_VIEW: 'class.view',
        CLASS_CREATE: 'class.create',
        CLASS_EDIT: 'class.edit',
        CLASS_DELETE: 'class.delete',

        CLASS_STUDENTS_VIEW: 'class_students.view',
        CLASS_STUDENTS_CREATE: 'class_students.create',
        CLASS_STUDENTS_EDIT: 'class_students.edit',
        CLASS_STUDENTS_DELETE: 'class_students.delete',

        SCHEDULE_VIEW: 'schedule.view',
        SCHEDULE_CREATE: 'schedule.create',
        SCHEDULE_EDIT: 'schedule.edit',
        SCHEDULE_DELETE: 'schedule.delete',

        STUDENTS_VIEW: 'students.view',
        STUDENTS_CREATE: 'students.create',
        STUDENTS_EDIT: 'students.edit',
        STUDENTS_DELETE: 'students.delete',

        STUDY_RESULTS_VIEW: 'study_results.view',
        STUDY_RESULTS_CREATE: 'study_results.create',
        STUDY_RESULTS_EDIT: 'study_results.edit',
        STUDY_RESULTS_DELETE: 'study_results.delete',

        CERTIFICATES_VIEW: 'certificates.view',
        CERTIFICATES_CREATE: 'certificates.create',
        CERTIFICATES_EDIT: 'certificates.edit',
        CERTIFICATES_DELETE: 'certificates.delete',

        TEACHER_VIEW: 'teacher.view',
        TEACHER_CREATE: 'teacher.create',
        TEACHER_EDIT: 'teacher.edit',
        TEACHER_DELETE: 'teacher.delete',

        TEACHING_ASSIGNMENTS_VIEW: 'teaching_assignments.view',
        TEACHING_ASSIGNMENTS_CREATE: 'teaching_assignments.create',
        TEACHING_ASSIGNMENTS_EDIT: 'teaching_assignments.edit',
        TEACHING_ASSIGNMENTS_DELETE: 'teaching_assignments.delete',

        FEES_VIEW: 'fees.view',
        FEES_CREATE: 'fees.create',
        FEES_EDIT: 'fees.edit',
        FEES_DELETE: 'fees.delete',

        USERS_VIEW: 'users.view',
        USERS_CREATE: 'users.create',
        USERS_EDIT: 'users.edit',
        USERS_DELETE: 'users.delete',

        ROLES_VIEW: 'roles.view',
        ROLES_CREATE: 'roles.create',
        ROLES_EDIT: 'roles.edit',
        ROLES_DELETE: 'roles.delete',
    };

    /* =======================
       ROLE → PERMISSIONS (fallback)
    ======================= */
    private static readonly ROLE_PERMISSIONS: RolePermission[] = [
        {
            roleId: 1, // Admin
            permissions: Object.values(PermissionService.PERMISSIONS).map(
                (code, index) => ({
                    id: index + 1,
                    name: code,
                    code
                })
            )
        },
        {
            roleId: 2, // Giáo viên
            permissions: [
                PermissionService.PERMISSIONS.DASHBOARD_VIEW,
                PermissionService.PERMISSIONS.SCHEDULE_VIEW,
                PermissionService.PERMISSIONS.SCHEDULE_CREATE,
                PermissionService.PERMISSIONS.SCHEDULE_EDIT,
                PermissionService.PERMISSIONS.STUDENTS_VIEW,
                PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW,
            ].map((code, i) => ({ id: i + 1, name: code, code }))
        },
        {
            roleId: 3, // Học viên
            permissions: [
                PermissionService.PERMISSIONS.SCHEDULE_VIEW,
                PermissionService.PERMISSIONS.CLASS_STUDENTS_VIEW,
                PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW,
            ].map((code, i) => ({ id: i + 1, name: code, code }))
        }
    ];

    /* =======================
       CORE METHODS
    ======================= */

    setPermissions(perms: Permission[]): void {
        localStorage.setItem(this.permissionsKey, JSON.stringify(perms));
    }

    getPermissions(): Permission[] {
        const raw = localStorage.getItem(this.permissionsKey);
        return raw ? JSON.parse(raw) : [];
    }

    clearPermissions(): void {
        localStorage.removeItem(this.permissionsKey);
    }

    /* =======================
       PERMISSION CHECK
    ======================= */

    hasPermission(code: string): boolean {
        const perms = this.getPermissions();

        if (perms.length > 0) {
            return perms.some(p => p.code === code);
        }

        // fallback theo role
        const roleId = this.getRoleId();
        const rolePerms = PermissionService.ROLE_PERMISSIONS
            .find(r => r.roleId === roleId)?.permissions ?? [];

        return rolePerms.some(p => p.code === code);
    }

    hasAnyPermission(codes: string[]): boolean {
        return codes.some(code => this.hasPermission(code));
    }

    hasAllPermissions(codes: string[]): boolean {
        return codes.every(code => this.hasPermission(code));
    }

    /* =======================
       MENU FILTER
    ======================= */

    filterMenu(menu: any[]): any[] {
        return menu
            .map(item => {
                if (item.items) {
                    item.items = item.items.filter((sub: any) =>
                        this.canAccessMenu(sub)
                    );
                    return item.items.length ? item : null;
                }
                return this.canAccessMenu(item) ? item : null;
            })
            .filter(Boolean);
    }

    private canAccessMenu(item: any): boolean {
        if (!item.permissions || item.permissions.length === 0) {
            return true;
        }
        return this.hasAnyPermission(item.permissions);
    }

    /* =======================
       HELPERS
    ======================= */

    private getRoleId(): number | null {
        const raw = localStorage.getItem(this.roleKey);
        return raw ? Number(raw) : null;
    }

    getFilteredMenuItems(menu: any[]): any[] {
    return this.filterMenu(menu);
}

}
