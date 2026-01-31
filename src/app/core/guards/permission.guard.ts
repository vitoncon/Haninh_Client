import { CanActivateFn } from '@angular/router';

export const permissionGuard = (_requiredPermissions: string[]): CanActivateFn => {
    return () => {
        return true; // LUÔN CHO PHÉP
    };
};
