import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { Router } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-best-selling-widget',
    imports: [CommonModule, ButtonModule, MenuModule],
    styles: [`
        ::ng-deep .p-menu-item a .pi {
            color: var(--primary-color) !important;
        }
        ::ng-deep .p-menu-item:has(.pi-refresh) a .pi {
            color: #3B82F6 !important;
        }
        ::ng-deep .p-menu-item:has(.pi-eye) a .pi {
            color: var(--primary-color) !important;
        }
    `],
    template: ` <div class="card">
        <div class="flex justify-between items-center mb-6">
            <div class="font-semibold text-xl">Top Khóa Học Theo Doanh Thu</div>
            <div>
                <button pButton type="button" icon="pi pi-ellipsis-v" class="p-button-rounded p-button-text p-button-plain" style="color: var(--primary-color);" (click)="menu.toggle($event)"></button>
                <p-menu #menu [popup]="true" [model]="items"></p-menu>
            </div>
        </div>
        <ul class="list-none p-0 m-0" *ngIf="topCourses.length > 0">
            <li class="flex flex-col md:flex-row md:items-center md:justify-between mb-6" *ngFor="let course of topCourses">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 flex items-center justify-center bg-primary-50 dark:bg-primary-400/10 rounded-full shrink-0">
                        <i class="pi pi-graduation-cap text-primary-500 text-xl"></i>
                    </div>
                    <div>
                        <div class="text-surface-900 dark:text-surface-0 font-medium">{{ course.course_name }}</div>
                        <div class="mt-1 text-sm text-muted-color">Khóa học</div>
                    </div>
                </div>
                <div class="mt-2 md:mt-0 ml-0 md:ml-20 flex items-center gap-3">
                    <div class="bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden" style="height: 8px; width: 120px;">
                        <div class="bg-primary-500 h-full rounded-full transition-all" [style.width.%]="getPercentage(course.revenue)"></div>
                    </div>
                    <span class="text-primary-500 ml-4 font-medium text-sm">{{ formatCurrency(course.revenue) }}</span>
                </div>
            </li>
        </ul>
        <div *ngIf="topCourses.length === 0" class="text-center py-8 text-muted-color">
            Chưa có dữ liệu
        </div>
    </div>`
})
export class BestSellingWidget implements OnInit {
    topCourses: any[] = [];
    menu = null;
    maxRevenue = 0;

    items: any[] = [];

    constructor(
        private dashboardService: DashboardService,
        private router: Router
    ) {
        this.setupMenuItems();
    }

    setupMenuItems() {
        this.items = [
            { 
                label: 'Cập nhật', 
                icon: 'pi pi-fw pi-refresh', 
                iconClass: 'text-blue-500',
                command: () => this.refreshData()
            },
            { 
                label: 'Chi tiết', 
                icon: 'pi pi-fw pi-eye', 
                iconClass: 'text-primary',
                command: () => this.viewDetails()
            }
        ];
    }

    ngOnInit() {
        this.loadTopCourses();
    }

    loadTopCourses() {
        this.dashboardService.getTopCoursesByRevenue().subscribe({
            next: (data) => {
                this.topCourses = data;
                this.maxRevenue = Math.max(...data.map(c => c.revenue), 0);
            },
            error: (err) => {
                console.error('Error loading top courses:', err);
                this.topCourses = [];
            }
        });
    }

    getPercentage(revenue: number): number {
        return this.maxRevenue > 0 ? (revenue / this.maxRevenue) * 100 : 0;
    }

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(value);
    }

    refreshData() {
        this.loadTopCourses();
    }

    viewDetails() {
        // Navigate to courses page
        this.router.navigate(['/features/courses']);
    }
}
