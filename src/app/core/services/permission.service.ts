import { Injectable } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class PermissionService {
    private readonly permissionsKey = 'user_permissions';
    private readonly rolePermissionsKey = 'role_permissions';

    // Định nghĩa các permission codes
    public static readonly PERMISSIONS = {
        // Dashboard
        DASHBOARD_VIEW: 'dashboard.view',
        
        // Khóa học & Lớp học
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
        
        // Học viên
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
        
        // Giảng viên
        TEACHER_VIEW: 'teacher.view',
        TEACHER_CREATE: 'teacher.create',
        TEACHER_EDIT: 'teacher.edit',
        TEACHER_DELETE: 'teacher.delete',
        
        TEACHING_ASSIGNMENTS_VIEW: 'teaching_assignments.view',
        TEACHING_ASSIGNMENTS_CREATE: 'teaching_assignments.create',
        TEACHING_ASSIGNMENTS_EDIT: 'teaching_assignments.edit',
        TEACHING_ASSIGNMENTS_DELETE: 'teaching_assignments.delete',
        
        // Tài chính
        FEES_VIEW: 'fees.view',
        FEES_CREATE: 'fees.create',
        FEES_EDIT: 'fees.edit',
        FEES_DELETE: 'fees.delete',
    };

    // Định nghĩa permissions cho từng role
    public static readonly ROLE_PERMISSIONS: RolePermission[] = [
        {
            roleId: 1, // Admin
            permissions: [
                { id: 1, name: 'Dashboard View', code: PermissionService.PERMISSIONS.DASHBOARD_VIEW },
                { id: 2, name: 'Courses View', code: PermissionService.PERMISSIONS.COURSES_VIEW },
                { id: 3, name: 'Courses Create', code: PermissionService.PERMISSIONS.COURSES_CREATE },
                { id: 4, name: 'Courses Edit', code: PermissionService.PERMISSIONS.COURSES_EDIT },
                { id: 5, name: 'Courses Delete', code: PermissionService.PERMISSIONS.COURSES_DELETE },
                { id: 6, name: 'Class View', code: PermissionService.PERMISSIONS.CLASS_VIEW },
                { id: 7, name: 'Class Create', code: PermissionService.PERMISSIONS.CLASS_CREATE },
                { id: 8, name: 'Class Edit', code: PermissionService.PERMISSIONS.CLASS_EDIT },
                { id: 9, name: 'Class Delete', code: PermissionService.PERMISSIONS.CLASS_DELETE },
                { id: 10, name: 'Schedule View', code: PermissionService.PERMISSIONS.SCHEDULE_VIEW },
                { id: 11, name: 'Schedule Create', code: PermissionService.PERMISSIONS.SCHEDULE_CREATE },
                { id: 12, name: 'Schedule Edit', code: PermissionService.PERMISSIONS.SCHEDULE_EDIT },
                { id: 13, name: 'Schedule Delete', code: PermissionService.PERMISSIONS.SCHEDULE_DELETE },
                { id: 14, name: 'Students View', code: PermissionService.PERMISSIONS.STUDENTS_VIEW },
                { id: 15, name: 'Students Create', code: PermissionService.PERMISSIONS.STUDENTS_CREATE },
                { id: 16, name: 'Students Edit', code: PermissionService.PERMISSIONS.STUDENTS_EDIT },
                { id: 17, name: 'Students Delete', code: PermissionService.PERMISSIONS.STUDENTS_DELETE },
                { id: 18, name: 'Class Students View', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_VIEW },
                { id: 19, name: 'Class Students Create', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_CREATE },
                { id: 20, name: 'Class Students Edit', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_EDIT },
                { id: 21, name: 'Class Students Delete', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_DELETE },
                { id: 22, name: 'Study Results View', code: PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW },
                { id: 23, name: 'Study Results Create', code: PermissionService.PERMISSIONS.STUDY_RESULTS_CREATE },
                { id: 24, name: 'Study Results Edit', code: PermissionService.PERMISSIONS.STUDY_RESULTS_EDIT },
                { id: 25, name: 'Study Results Delete', code: PermissionService.PERMISSIONS.STUDY_RESULTS_DELETE },
                { id: 26, name: 'Certificates View', code: PermissionService.PERMISSIONS.CERTIFICATES_VIEW },
                { id: 27, name: 'Certificates Create', code: PermissionService.PERMISSIONS.CERTIFICATES_CREATE },
                { id: 28, name: 'Certificates Edit', code: PermissionService.PERMISSIONS.CERTIFICATES_EDIT },
                { id: 29, name: 'Certificates Delete', code: PermissionService.PERMISSIONS.CERTIFICATES_DELETE },
                { id: 30, name: 'Teacher View', code: PermissionService.PERMISSIONS.TEACHER_VIEW },
                { id: 31, name: 'Teacher Create', code: PermissionService.PERMISSIONS.TEACHER_CREATE },
                { id: 32, name: 'Teacher Edit', code: PermissionService.PERMISSIONS.TEACHER_EDIT },
                { id: 33, name: 'Teacher Delete', code: PermissionService.PERMISSIONS.TEACHER_DELETE },
                { id: 34, name: 'Teaching Assignments View', code: PermissionService.PERMISSIONS.TEACHING_ASSIGNMENTS_VIEW },
                { id: 35, name: 'Teaching Assignments Create', code: PermissionService.PERMISSIONS.TEACHING_ASSIGNMENTS_CREATE },
                { id: 36, name: 'Teaching Assignments Edit', code: PermissionService.PERMISSIONS.TEACHING_ASSIGNMENTS_EDIT },
                { id: 37, name: 'Teaching Assignments Delete', code: PermissionService.PERMISSIONS.TEACHING_ASSIGNMENTS_DELETE },
                { id: 38, name: 'Fees View', code: PermissionService.PERMISSIONS.FEES_VIEW },
                { id: 39, name: 'Fees Create', code: PermissionService.PERMISSIONS.FEES_CREATE },
                { id: 40, name: 'Fees Edit', code: PermissionService.PERMISSIONS.FEES_EDIT },
                { id: 41, name: 'Fees Delete', code: PermissionService.PERMISSIONS.FEES_DELETE },
            ]
        },
        {
            roleId: 2, // Quản lý/Staff
            permissions: [
                { id: 1, name: 'Dashboard View', code: PermissionService.PERMISSIONS.DASHBOARD_VIEW },
                { id: 10, name: 'Schedule View', code: PermissionService.PERMISSIONS.SCHEDULE_VIEW },
                { id: 11, name: 'Schedule Create', code: PermissionService.PERMISSIONS.SCHEDULE_CREATE },
                { id: 12, name: 'Schedule Edit', code: PermissionService.PERMISSIONS.SCHEDULE_EDIT },
                { id: 14, name: 'Students View', code: PermissionService.PERMISSIONS.STUDENTS_VIEW },
                { id: 15, name: 'Students Create', code: PermissionService.PERMISSIONS.STUDENTS_CREATE },
                { id: 16, name: 'Students Edit', code: PermissionService.PERMISSIONS.STUDENTS_EDIT },
                { id: 18, name: 'Class Students View', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_VIEW },
                { id: 19, name: 'Class Students Create', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_CREATE },
                { id: 20, name: 'Class Students Edit', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_EDIT },
                { id: 21, name: 'Class Students Delete', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_DELETE },
                { id: 22, name: 'Study Results View', code: PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW },
                { id: 23, name: 'Study Results Create', code: PermissionService.PERMISSIONS.STUDY_RESULTS_CREATE },
                { id: 24, name: 'Study Results Edit', code: PermissionService.PERMISSIONS.STUDY_RESULTS_EDIT },
            ]
        },
        {
            roleId: 3, // Giáo viên
            permissions: [
                { id: 10, name: 'Schedule View', code: PermissionService.PERMISSIONS.SCHEDULE_VIEW },
                { id: 18, name: 'Class Students View', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_VIEW },
                { id: 19, name: 'Class Students Edit', code: PermissionService.PERMISSIONS.CLASS_STUDENTS_EDIT },
                { id: 22, name: 'Study Results View', code: PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW },
                { id: 23, name: 'Study Results Create', code: PermissionService.PERMISSIONS.STUDY_RESULTS_CREATE },
                { id: 24, name: 'Study Results Edit', code: PermissionService.PERMISSIONS.STUDY_RESULTS_EDIT },
            ]
        }
    ];

    /**
     * Lưu permissions từ BE response
     */
    setPermissions(permissions: Permission[]): void {
        try {
            localStorage.setItem(this.permissionsKey, JSON.stringify(permissions));
        } catch (error) {
            console.error('Error saving permissions:', error);
        }
    }

    /**
     * Lấy permissions hiện tại
     */
    getPermissions(): Permission[] {
        try {
            const permissions = localStorage.getItem(this.permissionsKey);
            return permissions ? JSON.parse(permissions) : [];
        } catch (error) {
            console.error('Error getting permissions:', error);
            return [];
        }
    }

    /**
     * Lưu role permissions (fallback nếu BE không trả về permissions)
     */
    setRolePermissions(roleId: number): void {
        try {
            const rolePermission = PermissionService.ROLE_PERMISSIONS.find(rp => rp.roleId === roleId);
            if (rolePermission) {
                localStorage.setItem(this.rolePermissionsKey, JSON.stringify(rolePermission.permissions));
            }
        } catch (error) {
            console.error('Error saving role permissions:', error);
        }
    }

    /**
     * Lấy permissions theo role (fallback)
     */
    getRolePermissions(roleId: number): Permission[] {
        try {
            const rolePermission = PermissionService.ROLE_PERMISSIONS.find(rp => rp.roleId === roleId);
            return rolePermission ? rolePermission.permissions : [];
        } catch (error) {
            console.error('Error getting role permissions:', error);
            return [];
        }
    }

    /**
     * Kiểm tra user có permission cụ thể không
     */
    hasPermission(permissionCode: string): boolean {
        const userPermissions = this.getPermissions();
        if (userPermissions.length === 0) {
            // Fallback: lấy permissions theo role
            const roleId = this.getCurrentRoleId();
            if (roleId) {
                const rolePermissions = this.getRolePermissions(roleId);
                return rolePermissions.some(p => p.code === permissionCode);
            }
            return false;
        }
        return userPermissions.some(p => p.code === permissionCode);
    }

    /**
     * Kiểm tra user có ít nhất một trong các permissions không
     */
    hasAnyPermission(permissionCodes: string[]): boolean {
        return permissionCodes.some(code => this.hasPermission(code));
    }

    /**
     * Kiểm tra user có tất cả permissions không
     */
    hasAllPermissions(permissionCodes: string[]): boolean {
        return permissionCodes.every(code => this.hasPermission(code));
    }

    /**
     * Lấy role ID hiện tại
     */
    private getCurrentRoleId(): number | null {
        try {
            const roleId = localStorage.getItem('user_role');
            return roleId ? Number(roleId) : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Xóa tất cả permissions
     */
    clearPermissions(): void {
        try {
            localStorage.removeItem(this.permissionsKey);
            localStorage.removeItem(this.rolePermissionsKey);
        } catch (error) {
            console.error('Error clearing permissions:', error);
        }
    }

    /**
     * Lấy menu items theo permissions
     */
    getFilteredMenuItems(menuItems: any[]): any[] {
        return menuItems.filter(item => {
            if (item.items) {
                // Nếu có submenu, filter submenu trước
                const filteredSubItems = item.items.filter((subItem: any) => {
                    return this.checkMenuItemPermission(subItem);
                });
                
                // Nếu không có submenu nào được phép, ẩn menu cha
                if (filteredSubItems.length === 0) {
                    return false;
                }
                
                // Cập nhật items với submenu đã được filter
                item.items = filteredSubItems;
                return true;
            }
            return this.checkMenuItemPermission(item);
        });
    }

    /**
     * Kiểm tra permission cho menu item
     */
    private checkMenuItemPermission(menuItem: any): boolean {
        if (!menuItem.permissions || menuItem.permissions.length === 0) {
            return true; // Nếu không có permission requirement, cho phép
        }
        return this.hasAnyPermission(menuItem.permissions);
    }
}
