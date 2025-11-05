import { Component, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';
import { Router } from '@angular/router';

@Component({
    standalone: true,
    selector: 'app-notifications-widget',
    imports: [ButtonModule, MenuModule, CommonModule],
    styles: [`
        ::ng-deep .p-menu-item a .pi {
            color: var(--primary-color) !important;
        }
        ::ng-deep .p-menu-item:has(.pi-refresh) a .pi {
            color: #3B82F6 !important;
        }
        ::ng-deep .p-menu-item:has(.pi-list) a .pi {
            color: var(--primary-color) !important;
        }
        ::ng-deep .p-menu-item:has(.pi-check) a .pi {
            color: #10B981 !important;
        }
    `],
    template: `<div class="card mb-8!" style="height: 500px; display: flex; flex-direction: column; overflow-y: auto;">
        <div class="flex items-center justify-between mb-6">
            <div class="font-semibold text-xl">Thông Báo Hệ Thống</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" style="color: var(--primary-color);" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>

        <div *ngIf="upcomingClasses.length > 0; else noUpcomingClasses">
            <span class="block text-muted-color font-medium mb-4">LỚP HỌC SẮP KHAI GIẢNG</span>
            <ul class="p-0 mx-0 mt-0 mb-6 list-none">
                <li class="flex items-center py-2 border-b border-surface cursor-pointer transition-opacity" 
                    *ngFor="let cls of upcomingClasses.slice(0, 2)"
                    [style.opacity]="isRead('class_' + cls.id) ? '0.6' : '1'"
                    [class.pointer-events-none]="isRead('class_' + cls.id)"
                    (click)="!isRead('class_' + cls.id) && markAsRead('class_' + cls.id)">
                    <div [ngClass]="{
                        'w-12': true,
                        'h-12': true,
                        'flex': true,
                        'items-center': true,
                        'justify-center': true,
                        'rounded-full': true,
                        'mr-4': true,
                        'shrink-0': true,
                        'bg-gray-200': isRead('class_' + cls.id),
                        'bg-blue-100': !isRead('class_' + cls.id),
                        'dark:bg-blue-400/10': !isRead('class_' + cls.id)
                    }">
                        <i *ngIf="!isRead('class_' + cls.id)" 
                           class="pi pi-book text-xl text-blue-500"></i>
                        <i *ngIf="isRead('class_' + cls.id)" 
                           class="pi pi-check text-xl text-green-600"></i>
                    </div>
                    <div class="flex-1">
                        <span class="text-surface-900 dark:text-surface-0 leading-normal"
                            >{{ cls.class_name || 'Lớp học' }}
                            <span class="text-surface-700 dark:text-surface-100"> bắt đầu vào <span class="text-primary font-bold">{{ formatDate(cls.start_date) }}</span></span>
                        </span>
                    </div>
                    <span *ngIf="isRead('class_' + cls.id)" class="text-xs text-green-600 ml-auto">
                        <i class="pi pi-check-circle"></i> Đã đọc
                    </span>
                </li>
            </ul>
        </div>

        <ng-template #noUpcomingClasses>
            <div class="py-4 text-center text-muted-color">
                <i class="pi pi-calendar-times text-4xl mb-2 block opacity-50"></i>
                <p class="text-sm">Không có lớp học sắp khai giảng</p>
            </div>
        </ng-template>

        <span class="block text-muted-color font-medium mb-4">HOẠT ĐỘNG GẦN ĐÂY</span>
        <ul class="p-0 m-0 list-none mb-6">
            <li class="flex items-center py-2 border-b border-surface">
                <div class="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-users text-xl! text-green-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">
                    Có <span class="text-primary font-bold">{{ stats.recentRegistrations }}</span> học viên mới đăng ký trong tháng này.
                </span>
            </li>
            <li class="flex items-center py-2">
                <div class="w-12 h-12 flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-full mr-4 shrink-0">
                    <i class="pi pi-graduation-cap text-xl! text-purple-500"></i>
                </div>
                <span class="text-surface-900 dark:text-surface-0 leading-normal">
                    Có <span class="text-primary font-bold">{{ stats.activeClasses }}</span> lớp học đang hoạt động.
                </span>
            </li>
        </ul>
        
        <div class="text-xs text-muted-color mt-auto pt-4 text-right">
            Cập nhật: {{ getCurrentDateTime() }}
        </div>
    </div>`
})
export class NotificationsWidget implements OnInit {
    items: any[] = [];
    upcomingClasses: any[] = [];
    stats: any = {};
    readStatus: Set<string> = new Set();

    constructor(
        private dashboardService: DashboardService,
        private router: Router
    ) {
        this.setupMenuItems();
        this.loadReadStatus();
    }

    ngOnInit() {
        this.loadUpcomingClasses();
        this.loadStatistics();
    }

    setupMenuItems() {
        this.items = [
            { 
                label: 'Làm mới', 
                icon: 'pi pi-fw pi-refresh',
                iconClass: 'text-blue-500',
                command: () => this.refreshData()
            },
            { 
                label: 'Xem tất cả lớp học', 
                icon: 'pi pi-fw pi-list',
                iconClass: 'text-primary',
                command: () => this.router.navigate(['/features/class'])
            },
            { 
                separator: true 
            },
            { 
                label: 'Đánh dấu tất cả đã đọc', 
                icon: 'pi pi-fw pi-check',
                iconClass: 'text-green-500',
                command: () => this.markAllAsRead()
            }
        ];
    }

    refreshData() {
        this.loadUpcomingClasses();
        this.loadStatistics();
    }

    loadReadStatus() {
        const saved = localStorage.getItem('notifications_read_status');
        if (saved) {
            this.readStatus = new Set(JSON.parse(saved));
        }
    }

    saveReadStatus() {
        localStorage.setItem('notifications_read_status', JSON.stringify(Array.from(this.readStatus)));
    }

    markAllAsRead() {
        // Mark all items as read
        this.upcomingClasses.forEach(cls => {
            if (cls.id) this.readStatus.add(`class_${cls.id}`);
        });
        this.readStatus.add('recent_students');
        this.readStatus.add('active_classes');
        
        this.saveReadStatus();
    }

    isRead(key: string): boolean {
        return this.readStatus.has(key);
    }

    markAsRead(key: string) {
        this.readStatus.add(key);
        this.saveReadStatus();
    }

    loadUpcomingClasses() {
        this.dashboardService.getUpcomingClasses().subscribe({
            next: (data) => {
                this.upcomingClasses = data;
            },
            error: (err) => {
                console.error('Error loading upcoming classes:', err);
                this.upcomingClasses = [];
            }
        });
    }

    loadStatistics() {
        this.dashboardService.getDashboardStatistics().subscribe({
            next: (data) => {
                this.stats = data;
            },
            error: (err) => {
                console.error('Error loading statistics:', err);
            }
        });
    }

    formatDate(date: string): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('vi-VN');
    }

    getCurrentDateTime(): string {
        const now = new Date();
        return now.toLocaleString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
