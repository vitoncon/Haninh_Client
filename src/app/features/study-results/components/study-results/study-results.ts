import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// PrimeNG Modules
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule, Table } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ProgressBarModule } from 'primeng/progressbar';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';

// Services
import { StudyResultService } from '../../services/study-result.service';

@Component({
  selector: 'app-study-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    TableModule,
    ButtonModule,
    RippleModule,
    ProgressBarModule,
    SkeletonModule,
    ToastModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  providers: [MessageService],
  templateUrl: './study-results.html',
  styleUrls: ['./study-results.scss']
})
export class StudyResults implements OnInit, OnDestroy {
  // Summary data
  summary: any = {
    total_classes: 0,
    total_students: 0,
    total_exams: 0,
    average_score: 0,
    pass_rate: 0
  };

  // Class analytics
  classAnalytics: any[] = [];
  filteredClasses: any[] = [];

  // Skill analytics
  skillAnalytics: any = {};

  // Charts
  classAverageChart: any;
  skillComparisonChart: any;
  trendChart: any;

  // Loading states
  loading: boolean = false;
  chartOptions: any;

  // Destroy subscription
  private destroy$ = new Subject<void>();

  constructor(
    private studyResultService: StudyResultService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.initCharts();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize chart options
  initCharts(): void {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        },
        y: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder
          }
        }
      }
    };
  }

  // Load all data
  loadData(): void {
    this.loading = true;

    forkJoin({
      summary: this.studyResultService.getOrganizationSummary(),
      classes: this.studyResultService.getClassAnalytics(),
      skills: this.studyResultService.getSkillAnalytics()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.summary = data.summary;
          this.classAnalytics = data.classes;
          this.filteredClasses = data.classes;
          this.skillAnalytics = data.skills;

          this.updateCharts();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading organization analytics:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không thể tải dữ liệu thống kê'
          });
          this.loading = false;
        }
      });
  }

  // Update charts with new data
  updateCharts(): void {
    this.updateClassAverageChart();
    this.updateSkillComparisonChart();
    this.updateTrendChart();
  }

  // Update class average chart
  updateClassAverageChart(): void {
    const sortedClasses = [...this.classAnalytics].sort((a, b) => b.average_score - a.average_score).slice(0, 10);
    
    this.classAverageChart = {
      labels: sortedClasses.map(c => c.class_name.substring(0, 15) + '...'),
      datasets: [
        {
          label: 'Điểm trung bình',
          data: sortedClasses.map(c => c.average_score),
          backgroundColor: '#42A5F5',
          borderColor: '#1E88E5',
          borderWidth: 1
        }
      ]
    };
  }

  // Update skill comparison chart
  updateSkillComparisonChart(): void {
    const skillTypes = Object.keys(this.skillAnalytics.skill_distribution || {});
    const skillCounts = Object.values(this.skillAnalytics.skill_distribution || {}) as number[];

    this.skillComparisonChart = {
      labels: skillTypes,
      datasets: [
        {
          label: 'Số lượng bài kiểm tra',
          data: skillCounts,
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ],
          borderWidth: 1
        }
      ]
    };
  }

  // Update trend chart (using exam dates)
  updateTrendChart(): void {
    // For now, create a simple monthly trend based on total exams
    // This would need actual date-based data from the backend
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'];
    const scores = [70, 72, 75, 73, 76, 74]; // Placeholder data

    this.trendChart = {
      labels: months,
      datasets: [
        {
          label: 'Điểm trung bình',
          data: scores,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4
        }
      ]
    };
  }

  // Navigate to class study results
  viewClassDetails(classId: number): void {
    this.router.navigate([`/features/class/${classId}/study-results`]);
  }

  // Format percentage
  formatPercentage(value: number): string {
    if (value == null || value === undefined || isNaN(value) || !isFinite(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  }

  // Format score
  formatScore(value: number): string {
    if (value == null || value === undefined || isNaN(value) || !isFinite(value)) {
      return '0.0';
    }
    return value.toFixed(1);
  }

  // Check if average score is valid
  hasValidAverageScore(): boolean {
    const avgScore = this.summary?.average_score;
    const totalExams = this.summary?.total_exams;
    
    // Check if average_score is valid (not NaN, not null/undefined, > 0)
    const isValidScore = !isNaN(avgScore) && 
                         avgScore != null && 
                         avgScore > 0 && 
                         isFinite(avgScore);
    
    // Check if total_exams is valid
    const hasExams = totalExams != null && totalExams > 0;
    
    return isValidScore && hasExams;
  }

  // Get score severity color
  getScoreSeverity(score: number): string {
    // Handle invalid values
    if (score == null || score === undefined || isNaN(score) || !isFinite(score)) {
      return 'secondary';
    }
    if (score >= 90) return 'success';
    if (score >= 80) return 'info';
    if (score >= 70) return 'warning';
    if (score >= 60) return 'help';
    return 'danger';
  }

  // Get score severity color for text class
  getScoreSeverityColor(score: number): string {
    // Handle invalid values
    if (score == null || score === undefined || isNaN(score) || !isFinite(score)) {
      return 'gray-500';
    }
    if (score >= 90) return 'green-500';
    if (score >= 80) return 'blue-500';
    if (score >= 70) return 'orange-500';
    if (score >= 60) return 'purple-500';
    return 'red-500';
  }

  // Refresh data
  refreshData(): void {
    this.loadData();
  }

  // Filter classes
  filterClasses(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredClasses = this.classAnalytics.filter(classItem =>
      classItem.class_name.toLowerCase().includes(query) ||
      classItem.class_code.toLowerCase().includes(query)
    );
  }
}
