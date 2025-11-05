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
      unpaid_amount: 0,
      total_students: 0,
      paid_students: 0,
      unpaid_students: 0
    };
    
    this.initializeStatusOptions();
    this.setupSearchDebounce();
    
    this.loadAllStatisticsFromAPI();
    
    this.loadClasses();
    this.loadCourses();
  }

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

  private loadStatistics(): void {
    // Load all statistics from API để đảm bảo consistency
    this.loadAllStatisticsFromAPI();
  }

  // Helper method to load statistics from API (primary source)
  private updateAllStatistics(): void {
    this.loadAllStatisticsFromAPI();
    
    // Fallback calculation from classes nếu cần thiết (sau khi API call hoàn thành)
    setTimeout(() => {
      // Chỉ tính từ classes nếu API không có dữ liệu hoặc lỗi
      if (!this.statistics || this.statistics.total_amount === 0) {
        this.calculateStatisticsFromClasses();
      }
    }, 100);
  }

  // Load all statistics from fees-detail API (tất cả thống kê từ fees-detail)
  private loadAllStatisticsFromAPI(): void {
    this.feeService.getFeeStatistics().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (stats) => {
        // Ensure statistics object exists
        if (!this.statistics) {
          this.statistics = {
            total_amount: 0,
            paid_amount: 0,
            unpaid_amount: 0,
            total_students: 0,
            paid_students: 0,
            unpaid_students: 0
          };
        }
        
        // Cập nhật statistics từ API làm base, nhưng sẽ được override bởi local calculation nếu có đủ data
        this.statistics = {
          total_amount: stats.total_amount || 0,
          paid_amount: stats.paid_amount || 0,
          unpaid_amount: stats.unpaid_amount || 0,
          total_students: stats.total_students || 0,
          paid_students: stats.paid_students || 0,
          unpaid_students: stats.unpaid_students || 0
        };
        
        // Luôn tính lại từ local data để đảm bảo consistency với UI table
        setTimeout(() => {
          this.calculateStatisticsFromClasses();
        }, 100);
        
        // Trigger change detection để UI update
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading statistics from API:', error);
        // Fallback to calculate from classes if API fails
        this.calculateStatisticsFromClasses();
      }
    });
  }

  // Calculate statistics from classes data (tổng từ cột "Tổng cần thu")
  private calculateStatisticsFromClasses(): void {
    if (!this.classes || this.classes.length === 0) {
      this.statistics = {
        total_amount: 0,
        paid_amount: 0,
        unpaid_amount: 0,
        total_students: 0,
        paid_students: 0,
        unpaid_students: 0
      };
      return;
    }

    // Kiểm tra xem có đủ dữ liệu fees chưa - chỉ tính khi có ít nhất 50% classes có fees data
    const classesWithFees = this.classes.filter(cls => cls.id && this.classFeesCache.has(cls.id));

    if (classesWithFees.length === 0) {
      return;
    }

    // Chỉ override API statistics khi có đủ dữ liệu local
    const hasEnoughData = classesWithFees.length >= this.classes.length * 0.5;
    if (!hasEnoughData) {
      return;
    }

    let totalAmount = 0;
    let totalPaid = 0;
    let totalUnpaid = 0; // Sum of "Còn nợ" column
    let totalStudents = 0;
    let paidStudents = 0;
    let unpaidStudents = 0;

    // Sử dụng this.classes thay vì this.filteredClasses để tính statistics cho tất cả classes
    // không bị ảnh hưởng bởi filter/search
    this.classes.forEach(classData => {
      // Chỉ tính cho các lớp có dữ liệu fees
      if (!classData.id || !this.classFeesCache.has(classData.id)) {
        return;
      }
      // Tổng số tiền = tổng cột "Tổng cần thu"
      const totalToCollect = this.getTotalAmountToCollect(classData);
      totalAmount += totalToCollect;

      // Tính số đã thu từ fees data (Đã thanh toán)
      const fees = this.classFeesCache.get(classData.id!) || [];
      
      const classPaid = fees
        .filter(fee => {
          if (!fee || typeof fee !== 'object') return false;
          // Kiểm tra cả payment_status và paid_date
          return fee.payment_status === 'Đã thanh toán' || fee.paid_date;
        })
        .reduce((sum, fee) => {
          if (!fee || typeof fee !== 'object') return sum;
          const amount = this.getStudentAmount(fee, classData);
          return sum + amount;
        }, 0);
      totalPaid += classPaid;

      // Tính chưa thu = Còn nợ (Remaining Debt)
      const remainingDebt = this.getRemainingDebt(classData);
      totalUnpaid += remainingDebt;

      // Đếm students
      const classStudents = this.getTotalStudents(classData.id);
      totalStudents += classStudents;

      // Đếm số học viên đã thanh toán dựa trên fees data thực tế
      const paidStudentsInClass = new Set(
        fees
          .filter(fee => {
            if (!fee || typeof fee !== 'object') return false;
            return fee.payment_status === 'Đã thanh toán' || fee.paid_date;
          })
          .map(fee => fee.student_id)
      ).size;

      // Tính số học viên chưa thanh toán = tổng - đã thanh toán
      const unpaidStudentsInClass = Math.max(0, classStudents - paidStudentsInClass);

      // Cộng dồn vào tổng
      paidStudents += paidStudentsInClass;
      unpaidStudents += unpaidStudentsInClass;
    });

    this.statistics = {
      total_amount: totalAmount,
      paid_amount: totalPaid,
      unpaid_amount: totalUnpaid,
      total_students: totalStudents,
      paid_students: paidStudents,
      unpaid_students: unpaidStudents
    };
    
    // Trigger change detection để UI update
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

  // Load courses
  private loadCourses(): void {
    this.coursesService.getCourses().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (courses) => {
        this.courses = courses;
        this.tryMergeCoursesWithClasses();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Không thể tải thông tin khóa học'
        });
      }
    });
  }

  // Load classes for the first level view
  private loadClasses(): void {
    this.loading = true;
    this.classService.getClasses().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (classes) => {
        this.classes = classes;
        this.tryMergeCoursesWithClasses();
        this.loadClassStatistics();
        this.loadClassFeesData();
        this.filteredClasses = [...this.classes];
        
        // Load statistics after classes are loaded
        this.updateAllStatistics();
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading classes:', error);
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách lớp học'
        });
      }
    });
  }

  // Try to merge courses with classes (only when both are loaded)
  private tryMergeCoursesWithClasses(): void {
    if (this.courses.length > 0 && this.classes.length > 0) {
      this.mergeCoursesWithClasses();
    }
  }

  // Merge course data with classes
  private mergeCoursesWithClasses(): void {
    if (this.courses.length > 0 && this.classes.length > 0) {
      this.classes = this.classes.map(classItem => {
        // Find corresponding course data by course_id
        const courseData = this.courses.find(course => 
          course.id === classItem.course_id
        );
        
        // Return class with enhanced course information
        if (courseData) {
          return {
            ...classItem,
            course_name: courseData.course_name,
            course_code: courseData.course_code,
            language: courseData.language,
            course_level: courseData.level,
            course_fee: courseData.tuition_fee,
            course_description: courseData.description,
            course_prerequisites: courseData.prerequisites
          };
        }
        
        return classItem; // Return original if no course found
      });
      
      // Update filtered classes to reflect the merged data and reapply filters
      this.applyFilters();
    }
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
      filtered = filtered.filter(cls => {
        const status = this.getClassPaymentStatus(cls.id);
        switch (this.selectedStatusFilter) {
          case 'fully_paid': return status === 'Đã thu đủ';
          case 'has_debt': return status === 'Còn nợ';
          default: return true;
        }
      });
    }

    this.filteredClasses = filtered;
  }

  // Helper methods for class statistics
  getClassPaymentStatus(classId: number | undefined): string {
    if (!classId) return 'Chưa xác định';
    
    // Find class data to calculate status
    const classData = this.classes.find(cls => cls.id === classId);
    if (!classData) return 'Chưa xác định';
    
    const totalStudents = this.getTotalStudents(classId);
    const remainingDebt = this.getRemainingDebt(classData);
    
    // If no students, status should be neutral or "Chưa có học viên"
    if (totalStudents === 0) {
      return 'Chưa có học viên';
    }
    
    // If no debt remaining, status should be "Đã thu đủ"
    if (remainingDebt === 0) {
      return 'Đã thu đủ';
    }
    
    return 'Còn nợ';
  }

  getPaymentStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    switch (status) {
      case 'Đã thu đủ': return 'success';
      case 'Chưa có học viên': return 'info';
      case 'Còn nợ': return 'warn';
      default: return 'secondary';
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

  // Load class statistics for all classes
  private loadClassStatistics(): void {
    let loadedCount = 0;
    const totalClasses = this.classes.filter(c => c.id).length;
    
    this.classes.forEach(classItem => {
      if (classItem.id) {
        this.classStudentService.getClassStatistics(classItem.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (stats) => {
            this.classStatisticsCache.set(classItem.id!, stats.totalStudents);
            loadedCount++;
            
            // Only trigger change detection when all statistics are loaded
            if (loadedCount === totalClasses) {
              this.updateAllStatistics();
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            console.error(`Error loading statistics for class ${classItem.id}:`, error);
            // Set default value if error occurs
            this.classStatisticsCache.set(classItem.id!, 0);
            loadedCount++;
            
            if (loadedCount === totalClasses) {
              this.updateAllStatistics();
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }

  // Get course tuition fee for display
  getCourseTuitionFee(classData: ClassModel): number | null {
    const courseData = this.courses.find(course => course.id === classData.course_id);
    if (!courseData?.tuition_fee) return null;
    
    // Handle string values from API
    const tuitionFee = typeof courseData.tuition_fee === 'string' 
      ? parseFloat(courseData.tuition_fee) 
      : courseData.tuition_fee;
    
    return typeof tuitionFee === 'number' && !isNaN(tuitionFee) && isFinite(tuitionFee) ? tuitionFee : null;
  }

  // Get total students for class
  getTotalStudents(classId: number | undefined): number {
    if (!classId) return 0;
    return this.classStatisticsCache.get(classId) || 0;
  }

  // Get course info for display
  getCourseInfo(classData: ClassModel): any {
    const courseData = this.courses.find(course => course.id === classData.course_id);
    if (courseData) {
      return {
        language: courseData.language,
        level: courseData.level,
        course_code: courseData.course_code,
        tuition_fee: courseData.tuition_fee
      };
    }
    return null;
  }

  // Helper methods for amount calculation (similar to fees-detail)
  private parseAmount(amount: any): number {
    if (amount === null || amount === undefined || amount === '') {
      return 0;
    }
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return typeof numAmount === 'number' && !isNaN(numAmount) && isFinite(numAmount) ? numAmount : 0;
  }

  private getStudentAmount(fee: any, classData: ClassModel): number {
    // If fee has valid amount, use it
    const parsedAmount = this.parseAmount(fee.amount);
    if (parsedAmount > 0) {
      return parsedAmount;
    }
    
    // Otherwise, use course tuition fee
    const tuitionFee = this.getCourseTuitionFee(classData);
    return tuitionFee && tuitionFee > 0 ? tuitionFee : 0;
  }

  // Helper methods for due date calculation (similar to fees-detail)
  private getDueDate(fee: any): string {
    return fee.due_date || '';
  }

  // Load fees data for all classes
  private loadClassFeesData(): void {
    let loadedCount = 0;
    const totalClasses = this.classes.filter(c => c.id).length;
    
    this.classes.forEach(classItem => {
      if (classItem.id) {
        this.feeService.getFeesByClass(classItem.id).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (fees) => {
            this.classFeesCache.set(classItem.id!, fees || []);
            loadedCount++;
            
            // Trigger change detection when all fees data are loaded
            if (loadedCount === totalClasses) {
              this.updateAllStatistics();
              this.cdr.detectChanges();
            }
          },
          error: (error) => {
            console.error(`Error loading fees for class ${classItem.id}:`, error);
            // Set empty array if error occurs
            this.classFeesCache.set(classItem.id!, []);
            loadedCount++;
            
            if (loadedCount === totalClasses) {
              this.updateAllStatistics();
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }

  // Calculate total amount to collect for a class 
  getTotalAmountToCollect(classData: ClassModel): number {
    if (!classData.id) return 0;
    
    const totalStudents = this.getTotalStudents(classData.id);
    const tuitionFee = this.getCourseTuitionFee(classData);
    
    // Đơn giản: Số học viên × Học phí mỗi người
    const totalAmount = (totalStudents > 0 && tuitionFee && tuitionFee > 0) ? totalStudents * tuitionFee : 0;
    
    return totalAmount;
  }

  // Calculate remaining debt for a class
  getRemainingDebt(classData: ClassModel): number {
    if (!classData.id) return 0;
    
    const totalAmountToCollect = this.getTotalAmountToCollect(classData);
    const fees = this.classFeesCache.get(classData.id) || [];
    
    // Calculate total amount already paid from fees database
    const totalPaid = fees
      .filter(fee => fee && fee.payment_status === 'Đã thanh toán')
      .reduce((sum, fee) => {
        if (!fee || typeof fee !== 'object') return sum;
        const amount = this.getStudentAmount(fee, classData);
        return sum + amount;
      }, 0);
    
    const remainingDebt = Math.max(0, totalAmountToCollect - totalPaid);
    
    return remainingDebt;
  }

}