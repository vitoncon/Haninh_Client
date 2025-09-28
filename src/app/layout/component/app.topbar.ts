import { Component, Inject, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { API_BASE_URL } from '../../core/tokens/api-url.token';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule, AppConfigurator],
    template: ` <div class="layout-topbar">

        
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a routerLink="/dashboard" class="layout-topbar-logo flex items-center gap-2">
                <img src="img/logoHaNinh.ico" alt="HaNinh Logo" width="32" height="32" />
                <span class="text-lg font-semibold">HaNinh Academy</span>
            </a>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
                <div class="relative">
                    <button
                        class="layout-topbar-action layout-topbar-action-highlight"
                        pStyleClass="@next"
                        enterFromClass="hidden"
                        enterActiveClass="animate-scalein"
                        leaveToClass="hidden"
                        leaveActiveClass="animate-fadeout"
                        [hideOnOutsideClick]="true"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <app-configurator />
                </div>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-bell"></i>
                        <span>Messages</span>
                    </button>

                    <div class="relative">
                        <button type="button" class="flex items-center gap-3 h-10 px-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                            <img [src]="avatarUrl" 
                                [alt]="userName || 'Avatar'" 
                                class="w-8 h-8 rounded-full object-cover"
                                (error)="onImageError($event)" 
                            />
                            <div class="flex flex-col items-start text-left">
                                <span class="text-sm font-medium text-white">{{ userName || 'User' }}</span>
                                <span class="text-xs text-white/70">{{ roleText || 'No Role' }}</span>
                            </div>
                        </button>

                        <div class="hidden absolute right-0 mt-1 w-56 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-2 p-2 border border-primary-300 dark:border-primary-500 text-surface-900 dark:text-surface-0">
                            <a routerLink="/profile" class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer">
                                <i class="pi pi-user text-primary-500"></i>
                                <span>Profile</span>
                            </a>
                            <a routerLink="/settings" class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer">
                                <i class="pi pi-cog text-primary-500"></i>
                                <span>Settings</span>
                            </a>
                            <a routerLink="/calendar" class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer">
                                <i class="pi pi-calendar text-primary-500"></i>
                                <span>Calendar</span>
                            </a>
                            <a routerLink="/inbox" class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer">
                                <i class="pi pi-inbox text-primary-500"></i>
                                <span>Inbox</span>
                            </a>
                            <button type="button" (click)="onLogout()" class="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800">
                                <i class="pi pi-power-off text-red-500"></i>
                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar implements OnInit {
    items!: MenuItem[];
    userName: string = '';
    roleText: string = '';
    avatarUrl: string = '/img_avatar/avatar_default.jpg';

    constructor(public layoutService: LayoutService, private http: HttpClient, private router: Router, @Inject(API_BASE_URL) private apiBaseUrl: string, private authService: AuthService) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    onImageError(event: any) {
        // Khi ảnh không tải được, chuyển về ảnh default
        event.target.src = '/img_avatar/avatar_default.jpg';
    }

    ngOnInit(): void {
        this.loadUserProfile();
    }

    private loadUserProfile(): void {
        const token = this.authService.getAccessToken();
        if (!token) {

            this.avatarUrl = '/img_avatar/avatar_default.jpg';
            return;
        }

        this.http.get(`${this.apiBaseUrl}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).subscribe({
            next: (response: any) => {
                if (response && response.data) {
                    const userData = response.data;
                    this.userName = userData.name || userData.fullName || userData.username || userData.email || 'User';
                    
                    if (userData.role_id) {
                        this.roleText = this.getRoleDisplayName(userData.role_id);
                    } else {
                        this.roleText = 'No Role';
                    }
                    
                    this.avatarUrl = userData.avatar || userData.avatarUrl || '/img_avatar/avatar_default.jpg';
                }
            },
            error: (error) => {
                this.loadFromJWT();
            }
        });
    }

    private loadFromJWT(): void {
        const token = this.authService.getAccessToken();
        if (token) {
            const payload = this.decodeJwt(token);
            this.userName = payload?.name || payload?.fullName || payload?.username || payload?.email || 'User';
            const roles = Array.isArray(payload?.roles) ? payload.roles : [];
            this.roleText = roles.length > 0 ? this.getRoleDisplayName(roles[0]) : 'No Role';
            this.avatarUrl = payload?.avatarUrl || payload?.avatar || '/img_avatar/avatar_default.jpg';
        } else {
            this.avatarUrl = '/img_avatar/avatar_default.jpg';
        }
    }

    private getRoleDisplayName(roleId: number): string {
        switch (roleId) {
            case 1:
                return 'Admin';
            case 2:
                return 'Giáo viên';
            case 3:
                return 'Học viên';
            default:
                return `Role ${roleId}`;
        }
    }

    private decodeJwt(token: string): any | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            const json = atob(parts[1]);
            return JSON.parse(json);
        } catch {
            return null;
        }
    }
      
    onLogout() {
        try {
            localStorage.clear();
            sessionStorage.clear();
        } finally {
            this.router.navigate(['/auth/login']);
        }
    }
    
}
