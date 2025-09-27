import { Component, Inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { StyleClassModule } from 'primeng/styleclass';
import { AppConfigurator } from './app.configurator';
import { LayoutService } from '../service/layout.service';
import { API_BASE_URL } from '../../core/tokens/api-url.token';

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
                        <button type="button" class="layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                            <img [src]="avatarUrl" 
                                [alt]="user?.name || 'Avatar'" 
                                class="w-8 h-8 rounded-full object-cover"
                                (error)="onImageError($event)" />
                            <span>{{ user?.name || 'User' }}</span>
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
export class AppTopbar {
    items!: MenuItem[];
    user: any;
    avatarUrl: string = '';

    constructor(public layoutService: LayoutService, private http: HttpClient, private router: Router, @Inject(API_BASE_URL) private apiBaseUrl: string) {}

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({ ...state, darkTheme: !state.darkTheme }));
    }

    onImageError(event: any) {
        // Khi ảnh không tải được, chuyển về ảnh default
        event.target.src = '/img_avatar/avatar_default.jpg';
    }

    ngOnInit(): void {
        this.http.get('/api/profile').subscribe({
            next: (res: any) => {
                this.user = res?.data ?? null;
                // Sử dụng avatarUrl từ server hoặc fallback về default
                this.avatarUrl = this.user?.avatarUrl || '/img_avatar/avatar_default.jpg';
            },
            error: (error) => {
                console.error('Error loading user profile:', error);
                // Nếu có lỗi khi load profile, sử dụng ảnh default
                this.avatarUrl = '/img_avatar/avatar_default.jpg';
            }
        });
    }
      
    onLogout() {
        const refreshToken = localStorage.getItem('refreshToken');
    
        this.http.post('/api/auth/logout', {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        }).subscribe({
            next: () => {
                localStorage.clear();
                sessionStorage.clear();
                this.router.navigate(['/auth/login']);
            },
            error: () => {
                localStorage.clear(); // Dù lỗi cũng clear để đảm bảo user logout
                sessionStorage.clear();
                this.router.navigate(['/auth/login']);
            }
        });
    }
    
}
