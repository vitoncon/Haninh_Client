import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { AttendanceService } from '../../services/attendance.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-attendance-analytics',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ChartModule,
    TableModule,
    ToastModule
  ],
  templateUrl: './attendance-analytics.html',
  styleUrls: ['./attendance-analytics.scss'],
  providers: [MessageService]
})
export class AttendanceAnalyticsComponent implements OnInit {
  analytics: any = null;
  chartData: any = null;
  chartOptions: any = null;
  loading = false;

  constructor(
    private attendanceService: AttendanceService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    this.loading = true;
    this.attendanceService.getAttendanceAnalytics().subscribe({
      next: (res: any) => {
        this.analytics = res;
        this.prepareChartData();
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải phân tích chuyên cần' });
      }
    });
  }

  prepareChartData() {
    if (!this.analytics || !this.analytics.class_rates) return;

    this.chartData = {
      labels: this.analytics.class_rates.map((c: any) => c.class_name),
      datasets: [
        {
          label: 'Tỉ lệ chuyên cần (%)',
          data: this.analytics.class_rates.map((c: any) => c.attendance_rate),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }
      ]
    };

    this.chartOptions = {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    };
  }
}
