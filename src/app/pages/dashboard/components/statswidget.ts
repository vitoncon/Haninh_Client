import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-stats-widget',
    imports: [CommonModule],
    template: `<div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex-1">
                        <div class="text-muted-color font-medium mb-1 text-sm">Tổng Học Viên</div>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-3xl">{{ stats.totalStudents }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-2xl" style="width: 3.5rem; height: 3.5rem">
                        <i class="pi pi-users text-blue-500 text-3xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-primary font-semibold text-lg">{{ stats.recentRegistrations }}</span>
                    <span class="text-primary font-medium">mới</span>
                    <span class="text-muted-color text-sm">trong tháng qua</span>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex-1">
                        <div class="text-muted-color font-medium mb-1 text-sm">Doanh Thu</div>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-3xl">{{ formatCurrency(stats.totalRevenue) }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-2xl" style="width: 3.5rem; height: 3.5rem">
                        <i class="pi pi-money-bill text-orange-500 text-3xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-primary font-semibold text-lg">{{ stats.attendanceRate }}%</span>
                    <span class="text-muted-color text-sm">tỉ lệ tham gia</span>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex-1">
                        <div class="text-muted-color font-medium mb-1 text-sm">Lớp Học Đang Diễn Ra</div>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-3xl">{{ stats.activeClasses }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-2xl" style="width: 3.5rem; height: 3.5rem">
                        <i class="pi pi-book text-cyan-500 text-3xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-primary font-semibold text-lg">{{ stats.totalClasses }}</span>
                    <span class="text-muted-color text-sm">tổng số lớp</span>
                </div>
            </div>
        </div>
        <div class="col-span-12 lg:col-span-6 xl:col-span-3">
            <div class="card mb-0">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex-1">
                        <div class="text-muted-color font-medium mb-1 text-sm">Tổng Khóa Học</div>
                        <div class="text-surface-900 dark:text-surface-0 font-bold text-3xl">{{ stats.totalCourses }}</div>
                    </div>
                    <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-2xl" style="width: 3.5rem; height: 3.5rem">
                        <i class="pi pi-graduation-cap text-purple-500 text-3xl"></i>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <span class="text-primary font-semibold text-lg">{{ stats.activeClasses }}</span>
                    <span class="text-muted-color text-sm">khóa học đang diễn ra</span>
                </div>
            </div>
        </div>`
})
export class StatsWidget implements OnInit {
    stats: any = {
        totalStudents: 0,
        totalClasses: 0,
        activeClasses: 0,
        totalCourses: 0,
        totalRevenue: 0,
        recentRegistrations: 0,
        attendanceRate: 0
    };

    constructor(private dashboardService: DashboardService) {}

    ngOnInit() {
        this.loadStatistics();
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

    formatCurrency(value: number): string {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    }
}
