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
                // Ensure chart data has proper structure
                if (!data || !data.labels || !data.datasets) {
                    console.warn('Invalid chart data structure:', data);
                    this.initChart();
                    return;
                }

                // Map datasets to ensure proper chart configuration
                data.datasets = data.datasets.map((ds: any) => ({
                    ...ds,
                    fill: false, // Tắt tô nền dưới đường
                    tension: 0.4, // Bo nhẹ đường cong cho đẹp
                    borderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    pointBackgroundColor: ds.borderColor || '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: ds.borderColor || '#3b82f6',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 3
                }));

                this.chartData = data;
                this.initChart();
            },
            error: (err) => {
                console.error('Error loading revenue data:', err);
                // Initialize with empty data on error
                this.chartData = {
                    labels: ['Không có dữ liệu'],
                    datasets: [{
                        label: 'Doanh thu (VNĐ)',
                        data: [0],
                        backgroundColor: '#3B82F6',
                        borderColor: '#2563EB',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    }]
                };
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
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: isDark ? '#f3f4f6' : '#1f2937',
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '500'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    titleColor: isDark ? '#f3f4f6' : '#1f2937',
                    bodyColor: isDark ? '#f3f4f6' : '#1f2937',
                    borderColor: borderColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: (context: any) => {
                            const value = context.parsed.y || 0;
                            return `${context.dataset.label}: ${new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                                maximumFractionDigits: 0
                            }).format(value)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent',
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: isDark ? '#9ca3af' : '#6b7280',
                        font: {
                            size: 11
                        },
                        callback: (value: any) => {
                            if (value === 0) return '0';
                            return new Intl.NumberFormat('vi-VN', {
                                notation: 'compact',
                                style: 'currency',
                                currency: 'VND',
                                maximumFractionDigits: 1
                            }).format(value);
                        }
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false,
                        drawBorder: false
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
