import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard = (requiredPermissions: string[]): CanActivateFn => {
    return () => {
        const permissionService = inject(PermissionService);
        const router = inject(Router);

        // Kiểm tra user có ít nhất một trong các permissions không
        const hasPermission = permissionService.hasAnyPermission(requiredPermissions);
        
        if (hasPermission) {
            return true;
        }

        // Nếu không có permission, chuyển đến trang unauthorized
        return router.createUrlTree(['/unauthorized'], { 
            queryParams: { 
                redirected: 'true',
                reason: 'insufficient_permissions'
            } 
        });
    };
};
