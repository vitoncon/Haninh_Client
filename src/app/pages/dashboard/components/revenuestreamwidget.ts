import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [ChartModule],
    template: `<div class="card mb-8!">
        <div class="font-semibold text-xl mb-4">Doanh Thu Theo Tháng</div>
        <div class="relative" style="height: 400px;">
            <p-chart type="line" [data]="chartData" [options]="chartOptions" style="height: 100%; width: 100%;" />
        </div>
    </div>`
})
export class RevenueStreamWidget implements OnInit {
    chartData: any = {
        labels: [],
        datasets: []
    };
    chartOptions: any;
    subscription!: Subscription;

    constructor(
        public layoutService: LayoutService,
        private dashboardService: DashboardService
    ) {
        this.subscription = this.layoutService.configUpdate$.pipe(debounceTime(25)).subscribe(() => {
            this.initChart();
        });
    }

    ngOnInit() {
        this.loadRevenueData();
    }

    loadRevenueData() {
        this.dashboardService.getRevenueChartData().subscribe({
            next: (data) => {
                // Nếu backend trả về dữ liệu chưa có 'fill', ta thêm ở đây
                data.datasets = data.datasets.map((ds: any) => ({
                    ...ds,
                    fill: false, // Tắt tô nền dưới đường
                    tension: 0.4, // Bo nhẹ đường cong cho đẹp
                    borderWidth: 3,
                    pointRadius: 5,
                    pointBackgroundColor: ds.borderColor || '#3b82f6'
                }));

                this.chartData = data;
                this.initChart();
            },
            error: (err) => {
                console.error('Error loading revenue data:', err);
                this.initChart();
            }
        });
    }


    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');
        const isDark = this.layoutService.isDarkTheme();

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#f3f4f6' : '#1f2937' // Explicit color based on theme
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            return `${context.dataset.label}: ${new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                maximumFractionDigits: 0
                            }).format(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280' // Explicit muted color based on theme
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280', // Explicit muted color based on theme
                        callback: (value: any) => {
                            return new Intl.NumberFormat('vi-VN', {
                                notation: 'compact',
                                style: 'currency',
                                currency: 'VND'
                            }).format(value);
                        }
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false
                    }
                }
            }
        };
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
