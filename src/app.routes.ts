import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { Unauthorized } from './app/pages/unauthorized/unauthorized';
import { authGuard } from './app/core/guards/auth.guard';
import { permissionGuard } from './app/core/guards/permission.guard';
import { PermissionService } from './app/core/services/permission.service';

export const appRoutes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', data: { breadcrumb: 'Dashboard' }, canActivate: [permissionGuard([PermissionService.PERMISSIONS.DASHBOARD_VIEW])], component: Dashboard },
            { path: 'features', loadChildren: () => import('./app/features/features.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'unauthorized', component: Unauthorized },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: '**', redirectTo: '/notfound' }
];
