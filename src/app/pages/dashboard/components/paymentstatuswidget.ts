import { Component, OnInit } from '@angular/core';
import { ChartModule } from 'primeng/chart';
import { debounceTime, Subscription } from 'rxjs';
import { LayoutService } from '../../../layout/service/layout.service';
import { DashboardService } from '../services/dashboard.service';

@Component({
    standalone: true,
    selector: 'app-payment-status-widget',
    imports: [ChartModule],
    template: `<div class="card">
        <div class="font-semibold text-xl mb-4">Tình Trạng Thanh Toán</div>
        <div class="relative" style="height: 400px;">
            <p-chart type="pie" [data]="chartData" [options]="chartOptions" style="height: 100%; width: 100%;" />
        </div>
    </div>`
})
export class PaymentStatusWidget implements OnInit {
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
            // Force chart re-render when theme changes
            if (this.chartData && this.chartData.labels && this.chartData.labels.length > 0) {
                const currentData = { ...this.chartData };
                this.chartData = { labels: [], datasets: [] };
                setTimeout(() => {
                    this.chartData = currentData;
                }, 50);
            }
        });
    }

    ngOnInit() {
        this.loadPaymentStatusData();
    }

    loadPaymentStatusData() {
        this.dashboardService.getPaymentStatusDistribution().subscribe({
            next: (data) => {
                this.chartData = data;
                this.initChart();
            },
            error: (err) => {
                this.initChart();
            }
        });
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#1f2937';
        const isDark = this.layoutService.isDarkTheme();

        this.chartOptions = {
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: isDark ? '#f3f4f6' : '#1f2937', // Explicit color based on theme
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context: any) => {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
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

