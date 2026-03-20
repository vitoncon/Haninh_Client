import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { AuthService } from '../../../../core/services/auth.service';
import { StudyResultWithDetails } from '../../models/study-results.model';

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
    total_students: 0,    // admin: total students, student: total exams
    total_exams: 0,
    average_score: 0,
    pass_rate: 0,
    score_improvement: 0, // student: chênh lệch điểm 2 bài gần nhất
    rank_in_class: null as number | null // optional: thứ hạng (nếu có dữ liệu)
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

  // Role flags
  isStudent: boolean = false;

  // Class detail state
  isClassDetail: boolean = false;
  selectedClassId: number | null = null;
  classResults: any[] = [];

  // Destroy subscription
  private destroy$ = new Subject<void>();

  constructor(
    private studyResultService: StudyResultService,
    public router: Router,
    private messageService: MessageService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initCharts();
    const roles = this.authService.getRoles();
    this.isStudent = roles.includes(3) && !roles.includes(1) && !roles.includes(2);

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const classId = params.get('class_id');

        if (classId) {
          this.isClassDetail = true;
          this.selectedClassId = Number(classId);
          this.loadStudentClassResults(this.selectedClassId);
        } else {
          this.isClassDetail = false;
          this.loadDashboardData();
        }
      });
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

  /**
   * Load data for Student dashboard (role 3).
   * Chỉ sử dụng dữ liệu đã được backend scope theo student_id.
   */
  loadStudentData(): void {
    this.loading = true;

    this.studyResultService.getStudyResults().pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: any) => {
        const data: StudyResultWithDetails[] = Array.isArray(results?.data) ? results.data : Array.isArray(results) ? results : [];

        // Build student-level summary & analytics
        this.buildStudentSummary(data);
        this.buildStudentAnalytics(data);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading student study results:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải dữ liệu kết quả học tập của bạn'
        });
        this.loading = false;
      }
    });
  }

  /**
   * Load dashboard data depending on role.
   * - Student: personal dashboard
   * - Others: organization dashboard
   */
  loadDashboardData(): void {
    if (this.isStudent) {
      this.loadStudentData();
    } else {
      this.loadData();
    }
  }

  loadStudentClassResults(classId: number): void {
    this.loading = true;

    this.studyResultService
      .getStudyResults({ class_id: classId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const rawResults = res || [];
          this.classResults = Array.isArray(rawResults)
            ? rawResults.map((r: any) => ({
                ...r,
                exam_date: r?.exam_date ? new Date(r.exam_date) : r?.exam_date
              }))
            : rawResults;
          this.loading = false;
        },
        error: () => {
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
    const validClasses = (this.classAnalytics || []).filter(
      (c) => c && typeof c.average_score === 'number' && !isNaN(c.average_score)
    );
    if (!validClasses.length) {
      this.classAverageChart = null;
      return;
    }

    const sortedClasses = [...validClasses].sort((a, b) => b.average_score - a.average_score).slice(0, 10);

    this.classAverageChart = {
      labels: sortedClasses.map((c: any) => c.class_name?.substring(0, 15) + '...' || ''),
      datasets: [
        {
          label: 'Điểm trung bình',
          data: sortedClasses.map((c: any) => c.average_score),
          backgroundColor: '#42A5F5',
          borderColor: '#1E88E5',
          borderWidth: 1
        }
      ]
    };
  }

  // Update skill comparison chart
  updateSkillComparisonChart(): void {
    // For admin dashboard we keep existing analytics; for student dashboard we rely on buildStudentAnalytics
    if (this.isStudent) {
      // student mode: skillComparisonChart is already built in buildStudentAnalytics()
      return;
    }

    const skillTypes = Object.keys(this.skillAnalytics.skill_distribution || {});
    const skillCounts = Object.values(this.skillAnalytics.skill_distribution || {}) as number[];

    if (!skillTypes.length) {
      this.skillComparisonChart = null;
      return;
    }

    this.skillComparisonChart = {
      labels: skillTypes,
      datasets: [
        {
          label: 'Số lượng bài kiểm tra',
          data: skillCounts,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
          borderWidth: 1
        }
      ]
    };
  }

  // Update trend chart (using exam dates)
  updateTrendChart(): void {
    // For student dashboard, trendChart is built in buildStudentAnalytics()
    if (this.isStudent) {
      return;
    }

    const validClasses = (this.classAnalytics || []).filter(
      (c) => c && typeof c.average_score === 'number' && !isNaN(c.average_score)
    );
    if (!validClasses.length) {
      this.trendChart = null;
      return;
    }

    const sortedClasses = [...validClasses].sort((a, b) => b.average_score - a.average_score);
    const labels = sortedClasses.map((c: any) => c.class_name?.substring(0, 15) + '...' || '');
    const scores = sortedClasses.map((c: any) => c.average_score);

    this.trendChart = {
      labels,
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
    if (this.isStudent) {
      // Học viên xem kết quả học tập của chính mình cho lớp này
      // Route này phải không có guard chỉ dành cho admin/giáo viên,
      // backend đã scope dữ liệu theo student_id.
      this.router.navigate(['/features/study-results'], {
        queryParams: { class_id: classId }
      });
    } else {
      // Admin / Giáo viên: giữ nguyên hành vi hiện tại, xem kết quả theo lớp
      this.router.navigate([`/features/class/${classId}/study-results`]);
    }
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
    if (this.isStudent) {
      this.loadStudentData();
    } else {
      this.loadData();
    }
  }

  // Filter classes
  filterClasses(event: any): void {
    const query = event.target.value.toLowerCase();
    this.filteredClasses = this.classAnalytics.filter(classItem =>
      classItem.class_name.toLowerCase().includes(query) ||
      classItem.class_code.toLowerCase().includes(query)
    );
  }

  // ===== Student-specific helpers =====

  private buildStudentSummary(results: StudyResultWithDetails[]): void {
    if (!Array.isArray(results) || results.length === 0) {
      this.summary = {
        total_classes: 0,
        total_students: 0,
        total_exams: 0,
        average_score: 0,
        pass_rate: 0,
        score_improvement: 0,
        rank_in_class: null
      };
      this.classAnalytics = [];
      this.filteredClasses = [];
      return;
    }

    // Distinct classes
    const classIds = new Set<number>();
    const examKeys = new Set<string>();
    const scores: number[] = [];

    // Thu thập thông tin lớp + điểm cho từng bài để tính improvement
    const examList: { exam_date: string; score: number }[] = [];

    results.forEach((r: any) => {
      if (r.class_id) classIds.add(r.class_id);

      const key = `${r.exam_name}|${r.exam_date}|${r.class_id}`;
      examKeys.add(key);

      let value: any = (r as any).percentage;
      if (value == null || isNaN(value)) {
        value = (r as any).score;
      }
      const numeric = typeof value === 'string' ? parseFloat(value) : value;
      if (numeric != null && !isNaN(numeric) && isFinite(numeric)) {
        scores.push(numeric);
        examList.push({
          exam_date: r.exam_date,
          score: numeric
        });
      }
    });

    const totalClasses = classIds.size;
    const totalExams = examKeys.size || scores.length;

    let averageScore = 0;
    let passRate = 0;

    if (scores.length > 0) {
      averageScore = scores.reduce((sum, v) => sum + v, 0) / scores.length;
      const passCount = scores.filter((s) => s >= 60).length;
      passRate = (passCount / scores.length) * 100;
    }

    // Score improvement: chênh lệch giữa 2 bài kiểm tra gần nhất (theo exam_date)
    let scoreImprovement = 0;
    if (examList.length >= 2) {
      const sorted = [...examList].sort((a, b) => {
        const da = a.exam_date ? new Date(a.exam_date).getTime() : 0;
        const db = b.exam_date ? new Date(b.exam_date).getTime() : 0;
        return da - db;
      });
      const last = sorted[sorted.length - 1].score;
      const prev = sorted[sorted.length - 2].score;
      scoreImprovement = last - prev;
    }

    this.summary = {
      total_classes: totalClasses,
      // Ở chế độ học viên: total_students biểu diễn số bài kiểm tra đã làm
      total_students: totalExams,
      total_exams: totalExams,
      average_score: averageScore,
      pass_rate: passRate,
      score_improvement: scoreImprovement,
      rank_in_class: null
    };
  }

  private buildStudentAnalytics(results: StudyResultWithDetails[]): void {
    // ===== 1. Build class-level summary for table & class average chart =====
    // API hiện tại trả về exam_results (er.*) + exam_name, exam_date, class_code, class_name
    // nên ta map linh hoạt: ưu tiên field mới (class_name, class_code, score), fallback về cấu trúc cũ nếu có.

    type ClassAgg = { id: number; class_name: string; class_code: string; total_exams: number; scores: number[] };
    const classMap = new Map<string, ClassAgg>();
    let syntheticId = 1;

    results.forEach((r: any) => {
      const cls = r.class || {};
      const className: string = r.class_name || cls.class_name || 'Lớp chưa xác định';
      const classCode: string = r.class_code || cls.class_code || 'N/A';

      const classKey = `${classCode}|${className}`;
      if (!classMap.has(classKey)) {
        classMap.set(classKey, {
          id: syntheticId++,
          class_name: className,
          class_code: classCode,
          total_exams: 0,
          scores: []
        });
      }

      const entry = classMap.get(classKey)!;
      entry.total_exams += 1;

      let value: any = (r as any).percentage;
      if (value == null || isNaN(value)) {
        value = (r as any).score;
      }
      const numeric = typeof value === 'string' ? parseFloat(value) : value;
      if (numeric != null && !isNaN(numeric) && isFinite(numeric)) {
        entry.scores.push(numeric);
      }
    });

    this.classAnalytics = Array.from(classMap.values()).map((c) => ({
      id: c.id,
      class_name: c.class_name,
      class_code: c.class_code,
      total_students: 1, // không dùng ở chế độ học viên
      total_exams: c.total_exams,
      average_score: c.scores.length ? c.scores.reduce((s, v) => s + v, 0) / c.scores.length : 0
    }));

    this.filteredClasses = this.classAnalytics;

    // Build per-class average chart (for this student)
    this.updateClassAverageChart();

    // ===== 2. Build skill comparison chart (average score per skill) =====
    const skillScores = new Map<string, number[]>();
    results.forEach((r: any) => {
      const skill = r.skill_type || 'Kỹ năng';

      let value: any = (r as any).percentage;
      if (value == null || isNaN(value)) {
        value = (r as any).score;
      }
      const numeric = typeof value === 'string' ? parseFloat(value) : value;
      if (numeric != null && !isNaN(numeric) && isFinite(numeric)) {
        if (!skillScores.has(skill)) skillScores.set(skill, []);
        skillScores.get(skill)!.push(numeric);
      }
    });

    const skillLabels: string[] = [];
    const skillAverages: number[] = [];

    skillScores.forEach((values, key) => {
      if (values.length > 0) {
        skillLabels.push(key);
        skillAverages.push(values.reduce((s, v) => s + v, 0) / values.length);
      }
    });

    this.skillComparisonChart = {
      labels: skillLabels,
      datasets: [
        {
          label: 'Điểm trung bình theo kỹ năng',
          data: skillAverages,
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

    // ===== 3. Build trend chart (exam score progression over time) =====
    const examMap = new Map<string, { exam_date: string; exam_name: string; scores: number[] }>();
    results.forEach((r: any) => {
      const examName: string = r.exam_name || 'Exam';
      const examDate: string = r.exam_date || '';
      const key = `${examName}|${examDate}`;

      if (!examMap.has(key)) {
        examMap.set(key, {
          exam_date: examDate,
          exam_name: examName,
          scores: []
        });
      }

      let value: any = (r as any).percentage;
      if (value == null || isNaN(value)) {
        value = (r as any).score;
      }
      const numeric = typeof value === 'string' ? parseFloat(value) : value;
      if (numeric != null && !isNaN(numeric) && isFinite(numeric)) {
        examMap.get(key)!.scores.push(numeric);
      }
    });

    const sortedExams = Array.from(examMap.values()).sort((a, b) => {
      const da = a.exam_date ? new Date(a.exam_date).getTime() : 0;
      const db = b.exam_date ? new Date(b.exam_date).getTime() : 0;
      return da - db;
    });

    const trendLabels = sortedExams.map((e) => {
      const name = e.exam_name || 'Exam';
      return name.length > 20 ? name.substring(0, 20) + '...' : name;
    });
    const trendScores = sortedExams.map((e) =>
      e.scores.length ? e.scores.reduce((s, v) => s + v, 0) / e.scores.length : 0
    );

    this.trendChart = {
      labels: trendLabels,
      datasets: [
        {
          label: 'Điểm trung bình theo bài kiểm tra',
          data: trendScores,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4
        }
      ]
    };
  }
}
