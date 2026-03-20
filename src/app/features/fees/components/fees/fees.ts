import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { FeeService } from '../../services/fee.service';
import { FeeStatistics } from '../../models/fees.model';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CardModule } from 'primeng/card';
import { AvatarModule } from 'primeng/avatar';
import { SelectModule } from 'primeng/select';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ClassService } from '../../../class-management/services/class.service';
import { ClassModel } from '../../../class-management/models/class.model';
import { CoursesService } from '../../../courses/services/courses.service';
import { Course } from '../../../courses/models/courses.model';
import { ClassStudentService } from '../../../class-management/services/class-student.service';
import { normalizeStatus } from '../../../../shared/utils/payment-utils';

@Component({
  selector: 'app-fees',
  templateUrl: './fees.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    InputTextModule,
    DrawerModule,
    ConfirmDialogModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    CardModule,
    AvatarModule,
    SelectModule
  ],
  providers: [ConfirmationService],
  styleUrls: ['./fees.scss']
})
export class Fees implements OnInit, OnDestroy {
  // Properties
  loading: boolean = false;
  searchQuery: string = '';
  statistics: FeeStatistics | null = null;

  // Classes view properties
  classes: ClassModel[] = [];
  filteredClasses: ClassModel[] = [];
  
  // Courses properties
  courses: Course[] = [];
  
  // Class statistics cache
  classStatisticsCache: Map<number, number> = new Map();
  
  // Fees data cache for calculations
  classFeesCache: Map<number, any[]> = new Map();

  // Filter properties
  selectedStatusFilter: string = '';
  hasActiveFilters: boolean = false;
  
  // RxJS subjects for better memory management
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  // Filter options
  statusOptions: any[] = [];

  constructor(
    private feeService: FeeService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private classService: ClassService,
    private coursesService: CoursesService,
    private classStudentService: ClassStudentService
  ) {}

  ngOnInit(): void {
    // Initialize statistics first
    this.statistics = {
      total_amount: 0,
      paid_amount: 0,
      debt_amount: 0,
      total_students: 0,
      paid_students: 0,
      debt_students: 0
    };
    
    this.initializeStatusOptions();
    this.setupSearchDebounce();
    
    this.loadClasses();
  }

  normalizeStatus = normalizeStatus;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchTerm => {
        this.searchQuery = searchTerm;
        this.hasActiveFilters = this.selectedStatusFilter !== '' || this.searchQuery.trim() !== '';
        this.applyFilters();
      });
  }

  // Load all statistics from fees-detail API (tất cả thống kê từ fees-detail)
  private updateAllStatistics(): void {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalDebt = 0;
    let totalStudents = 0;
    let paidStudents = 0;
    let debtStudents = 0;
    
    this.classes.forEach((classData: any) => {
      totalAmount += Number(classData.totalRevenue) || 0;
      totalPaid += Number(classData.totalPaid) || 0;
      totalDebt += Number(classData.totalDebt) || 0;
      totalStudents += Number(classData.totalStudents) || 0;
      
      // Simplify logic for student stats based on class-level payment status
      if (classData.paymentStatus === 'PAID') {
        paidStudents += classData.totalStudents;
      } else if (classData.paymentStatus === 'DEBT') {
        // Approximate: assume half paid if partial (We don't have detailed student fee history without N+1)
        // For accurate tracking, use backend statistics. 
        debtStudents += classData.totalStudents;
      }
    });

    this.statistics = {
      total_amount: totalAmount,
      paid_amount: totalPaid,
      debt_amount: totalDebt,
      total_students: totalStudents,
      paid_students: paidStudents,
      debt_students: debtStudents
    };
    this.cdr.detectChanges();
  }

  // Initialize status options for class filter
  private initializeStatusOptions(): void {
    this.statusOptions = [
      { label: 'Tất cả', value: '' },
      { label: 'Đã thu đủ', value: 'fully_paid' },
      { label: 'Còn nợ', value: 'has_debt' }
    ];
  }

  // Load classes with aggregated fee computing from backend
  private loadClasses(): void {
    this.loading = true;
    this.feeService.getAggregatedClassFeeStatistics().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (classes) => {
        this.classes = classes || [];
        this.filteredClasses = [...this.classes];
        
        this.updateAllStatistics();
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading classes fee aggregated stats:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách tài chính lớp học'
        });
      }
    });
  }

  // Navigation methods
  onClassRowClick(classData: ClassModel): void {
    // Navigate to fees detail page instead of changing internal view
    this.router.navigate(['/features/fees/detail', classData.id]);
  }

  onClassSelect(event: any): void {
    this.onClassRowClick(event);
  }

  // Search and filter methods - optimized with debounce
  onGlobalFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchSubject$.next(target.value);
  }

  onFilterChange(): void {
    this.hasActiveFilters = this.selectedStatusFilter !== '' || this.searchQuery.trim() !== '';
    this.applyFilters();
  }

  onClearFilters(): void {
    this.selectedStatusFilter = '';
    this.hasActiveFilters = false;
    this.searchQuery = '';
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filterClasses();
    this.updateAllStatistics();
  }

  private filterClasses(): void {
    let filtered = [...this.classes];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(cls => {
        // Search in class fields
        const matchesClass = cls.class_name.toLowerCase().includes(query) ||
                            cls.class_code.toLowerCase().includes(query);
        
        // Search in course fields (using merged course data)
        const courseData = this.courses.find(course => course.id === cls.course_id);
        const matchesCourse = courseData && (
          courseData.course_name.toLowerCase().includes(query) ||
          courseData.course_code.toLowerCase().includes(query) ||
          (courseData.description && courseData.description.toLowerCase().includes(query)) ||
          (courseData.language && courseData.language.toLowerCase().includes(query)) ||
          (courseData.level && courseData.level.toLowerCase().includes(query))
        );
        
        // Also check the already merged course_name field
        const matchesMergedCourse = cls.course_name && cls.course_name.toLowerCase().includes(query);
        
        return matchesClass || matchesCourse || matchesMergedCourse;
      });
    }

    // Apply status filter
    if (this.selectedStatusFilter) {
      filtered = filtered.filter((cls: any) => {
        const status = cls.paymentStatus;
        switch (this.selectedStatusFilter) {
          case 'fully_paid': return status === 'PAID';
          case 'has_debt': return status === 'DEBT';
          default: return true;
        }
      });
    }

    this.filteredClasses = filtered;
  }

  getPaymentStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'PAID': return 'success';
      case 'EMPTY': return 'info';
      case 'DEBT': return 'warn';
      default: return 'secondary';
    }
  }

  getClassStatusLabel(status: string): string {
    switch (status) {
      case 'PAID': return 'Đã thu đủ';
      case 'EMPTY': return 'Chưa có học viên';
      case 'DEBT': return 'Còn nợ';
      default: return 'Chưa xác định';
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    // Handle NaN, null, undefined values
    if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
      return '0 ₫';
    }
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  }

  get hasDataToExport(): boolean {
    return this.filteredClasses.length > 0;
  }

  getStatusLabel(value: string): string {
    const option = this.statusOptions.find(opt => opt.value === value);
    return option ? option.label : '';
  }

  clearStatusFilter(): void {
    this.selectedStatusFilter = '';
    this.onFilterChange();
  }

  // Legacy helper methods removed since statistics are computed on backend

}