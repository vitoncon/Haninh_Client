import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);

    // MOCK: luôn coi là đúng role (admin)
    return true;
};
