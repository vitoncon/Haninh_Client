import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const allowed: number[] = (route.data?.['roles'] as number[]) ?? [];
    const tokenRoles = authService.getRoles();

    if (authService.isAuthenticated() && (allowed.length === 0 || tokenRoles.some((r) => allowed.includes(r)))) {
        return true;
    }

    return router.createUrlTree(['/unauthorized'], { queryParams: { redirected: 'true' } });
};


