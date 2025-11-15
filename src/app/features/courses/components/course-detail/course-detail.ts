import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Course } from '../../models/courses.model';
import { CoursesService } from '../../services/courses.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DrawerModule } from 'primeng/drawer';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil, forkJoin, of, switchMap } from 'rxjs';
import { ClassService } from '../../../class-management/services/class.service';
import { ClassStudentService } from '../../../class-management/services/class-student.service';
import { TeachingAssignmentService } from '../../../teaching-assignments/services/teaching-assignment.service';

@Component({
  selector: 'app-course-detail',
  templateUrl: 'course-detail.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    CardModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DrawerModule,
  ],
  styleUrls: ['./course-detail.scss']
})
export class CourseDetail implements OnInit, OnDestroy {
  courseData: Course | null = null;
  loading: boolean = false;
  courseId: number | null = null;
  statsLoading: boolean = false;
  
  // Statistics data
  courseStats = {
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0
  };

  // Edit functionality properties
  drawerVisible: boolean = false;
  formCourse: Course | null = null;
  saving: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private teachingAssignmentService: TeachingAssignmentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    // Get initial course ID from route snapshot
    const initialId = +this.route.snapshot.params['id'];
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = +params['id'];
        if (id) {
          // Reset state when navigating to a different course
          if (this.courseId !== id) {
            this.resetComponentState();
            this.courseId = id;
            this.loadCourseDetail();
          }
        } else {
          this.handleCourseNotFound();
        }
      });
    
    // Load initial data if we have a valid ID
    if (initialId) {
      if (!this.courseId) {
        this.courseId = initialId;
        this.loadCourseDetail();
      } else if (this.courseId !== initialId) {
        this.resetComponentState();
        this.courseId = initialId;
        this.loadCourseDetail();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetComponentState(): void {
    this.courseData = null;
    this.loading = false;
    this.statsLoading = false;
    this.courseStats = {
      totalClasses: 0,
      totalStudents: 0,
      totalTeachers: 0
    };
  }

  private loadCourseDetail(): void {
    if (!this.courseId) {
      this.handleCourseNotFound();
      return;
    }
    
    this.loading = true;
    this.coursesService.getCourseById(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course: Course) => {
          this.courseData = this.processCourseData(course);
          this.loading = false;
          this.loadCourseStats();
        },
        error: (error) => {
          this.handleLoadError(error);
        }
      });
  }

  private handleCourseNotFound(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không tìm thấy thông tin khóa học'
    });
    this.router.navigate(['/features/courses']);
  }

  private handleLoadError(error: any): void {
    this.loading = false;
    const errorMessage = error?.error?.message || 'Không thể tải thông tin khóa học';
    
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: errorMessage
    });
    
    // Chỉ redirect nếu lỗi 404 hoặc không có quyền truy cập
    if (error?.status === 404 || error?.status === 403) {
      this.router.navigate(['/features/courses']);
    }
  }

  onBack(): void {
    this.router.navigate(['/features/courses']);
  }

  onEdit(): void {
    if (this.courseData?.id) {
      this.formCourse = { ...this.courseData };
      this.drawerVisible = true;
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không thể chỉnh sửa khóa học này'
      });
    }
  }


  onDrawerHide(): void {
    this.formCourse = null;
    this.drawerVisible = false;
  }

  onSave(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.updateCourse();
  }

  private validateForm(): boolean {
    if (!this.formCourse) {
      this.showValidationError('Vui lòng điền đầy đủ thông tin khóa học');
      return false;
    }

    const errors: string[] = [];
    
    if (!this.formCourse.course_code?.trim()) {
      errors.push('Mã khóa học');
    }
    
    if (!this.formCourse.course_name?.trim()) {
      errors.push('Tên khóa học');
    }

    if (errors.length > 0) {
      this.showValidationError(`Vui lòng nhập: ${errors.join(', ')}`);
      return false;
    }

    return true;
  }

  private showValidationError(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Thiếu thông tin',
      detail: message
    });
  }

  private updateCourse(): void {
    if (!this.courseData?.id || !this.formCourse) {
      return;
    }

    // Clean and prepare data for API
    const cleanData = this.prepareCourseDataForUpdate(this.formCourse);

    this.coursesService.updateCourse(this.courseData.id, cleanData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.handleSaveSuccess('Cập nhật khóa học thành công');
        },
        error: (error) => {
          this.handleSaveError(error, 'Không thể cập nhật khóa học');
        }
      });
  }

  private prepareCourseDataForUpdate(formData: Course): any {
    const cleanData: any = { ...formData };
    
    // Remove fields that shouldn't be updated
    delete cleanData.id;
    delete cleanData.created_at;
    delete cleanData.updated_at;
    
    
    // Ensure numeric fields are properly formatted
    if (cleanData.tuition_fee !== null && cleanData.tuition_fee !== undefined && cleanData.tuition_fee !== '') {
      cleanData.tuition_fee = Number(cleanData.tuition_fee);
    } else {
      cleanData.tuition_fee = null;
    }
    if (cleanData.duration_weeks !== null && cleanData.duration_weeks !== undefined && cleanData.duration_weeks !== '') {
      cleanData.duration_weeks = Number(cleanData.duration_weeks);
    } else {
      cleanData.duration_weeks = null;
    }
    if (cleanData.total_hours !== null && cleanData.total_hours !== undefined && cleanData.total_hours !== '') {
      cleanData.total_hours = Number(cleanData.total_hours);
    } else {
      cleanData.total_hours = null;
    }
    
    // Ensure string fields are trimmed and handle empty strings
    cleanData.course_code = cleanData.course_code ? cleanData.course_code.trim() : '';
    cleanData.course_name = cleanData.course_name ? cleanData.course_name.trim() : '';
    cleanData.description = cleanData.description ? cleanData.description.trim() : null;
    cleanData.prerequisites = cleanData.prerequisites ? cleanData.prerequisites.trim() : null;
    cleanData.learning_objectives = cleanData.learning_objectives ? cleanData.learning_objectives.trim() : null;
    cleanData.category = cleanData.category ? cleanData.category.trim() : null;
    
    // Validate enum values to match database schema
    const validLanguages = ['Tiếng Anh', 'Tiếng Hàn', 'Tiếng Trung'];
    const validLevels = ['Sơ cấp', 'Trung cấp', 'Cao cấp'];
    const validStatuses = ['Đang hoạt động', 'Không hoạt động'];
    
    if (cleanData.language && !validLanguages.includes(cleanData.language)) {
      cleanData.language = 'Tiếng Anh'; // Default value
    }
    if (cleanData.level && !validLevels.includes(cleanData.level)) {
      cleanData.level = 'Sơ cấp'; // Default value
    }
    if (cleanData.status && !validStatuses.includes(cleanData.status)) {
      cleanData.status = 'Đang hoạt động'; // Default value
    }
    
    return cleanData;
  }

  private handleSaveSuccess(message: string): void {
    this.saving = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: message
    });
    this.loadCourseDetail(); // Reload course data
    this.drawerVisible = false;
  }

  private handleSaveError(error: any, defaultMessage: string): void {
    this.saving = false;
    
    const errorMessage = error?.error?.message || defaultMessage;
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: errorMessage
    });
  }


  // Method để refresh data nếu cần
  refreshCourseDetail(): void {
    if (this.courseId) {
      this.loadCourseDetail();
    }
  }

  // Method để kiểm tra quyền chỉnh sửa
  canEdit(): boolean {
    return !!(this.courseData?.id && this.courseData?.status !== 'Không hoạt động');
  }


  // Process và validate course data
  private processCourseData(course: Course): Course {
    return {
      ...course,
      tuition_fee: course.tuition_fee ? Number(course.tuition_fee) : null,
      duration_weeks: course.duration_weeks ? Number(course.duration_weeks) : null,
      total_hours: course.total_hours ? Number(course.total_hours) : null,
      created_at: course.created_at ? new Date(course.created_at) : undefined,
      updated_at: course.updated_at ? new Date(course.updated_at) : undefined,
      
      // Process new fields
      prerequisites: course.prerequisites || '',
      learning_objectives: course.learning_objectives || '',
      category: course.category || '',
    };
  }

  // Load thống kê cho course
  private loadCourseStats(): void {
    if (!this.courseId) return;

    this.statsLoading = true;
    
    // Load classes cho course này
    this.classService.getClasses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (classes) => {
          const courseClasses = classes.filter(c => Number(c.course_id) === Number(this.courseId));
          const classIds = courseClasses.map(c => c.id).filter((id): id is number => !!id);
          
          // Load số học viên và giáo viên thực tế
          this.loadActualStudentAndTeacherCount(classIds, courseClasses.length);
        },
        error: (error) => {
          this.statsLoading = false;
        }
      });
  }

  private loadActualStudentAndTeacherCount(classIds: number[], classCount: number): void {
    if (classIds.length === 0) {
      this.courseStats = {
        totalClasses: classCount,
        totalStudents: 0,
        totalTeachers: 0
      };
      this.statsLoading = false;
      return;
    }

    // Tạo các observables để load students và teachers từ tất cả các lớp
    const studentObservables = classIds.map(classId => 
      this.classStudentService.getStudentsByClass(classId).pipe(
        takeUntil(this.destroy$)
      )
    );

    const teacherObservables = classIds.map(classId => 
      this.teachingAssignmentService.getClassTeacherAssignments(classId).pipe(
        takeUntil(this.destroy$)
      )
    );

    // Sử dụng forkJoin để đợi tất cả API calls hoàn thành
    forkJoin([...studentObservables, ...teacherObservables])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          const studentResults = results.slice(0, classIds.length);
          const teacherResults = results.slice(classIds.length);

          // Đếm số học viên unique (tránh đếm trùng nếu học viên học nhiều lớp)
          // Đếm tất cả học viên như trong class-detail, không filter theo status
          const uniqueStudents = new Set<number>();
          studentResults.forEach((students, index) => {
            if (students && Array.isArray(students)) {
              students.forEach(student => {
                const studentData = student as any;
                // Đếm tất cả học viên có student_id hợp lệ, giống như class-detail
                if (studentData.student_id) {
                  uniqueStudents.add(studentData.student_id);
                }
              });
            }
          });

          // Đếm số giáo viên unique từ class_teachers table (giống như class-detail)
          const uniqueTeachers = new Set<number>();
          teacherResults.forEach(assignments => {
            if (assignments && Array.isArray(assignments)) {
              assignments.forEach(assignment => {
                const assignmentData = assignment as any;
                // Chỉ đếm giáo viên có status 'Đang dạy' (giống logic trong class-detail)
                if (assignmentData.teacher_id && (assignmentData.status === 'Đang dạy' || !assignmentData.status)) {
                  uniqueTeachers.add(assignmentData.teacher_id);
                }
              });
            }
          });

          this.courseStats = {
            totalClasses: classCount,
            totalStudents: uniqueStudents.size,
            totalTeachers: uniqueTeachers.size
          };
          
          this.statsLoading = false;
        },
        error: (error) => {
          this.statsLoading = false;
        }
      });
  }

  // Helper methods để format hiển thị
  formatCurrency(value: number | null): string {
    if (!value) return '-';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Intl.DateTimeFormat('vi-VN').format(date);
  }

  formatNumber(value: number | null): string {
    return value ? value.toString() : '-';
  }

  // Helper methods for new fields
  getStatusSeverity(status: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (status) {
      case 'Đang hoạt động':
        return 'success';
      case 'Không hoạt động':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getLanguageIcon(language: string | undefined): string {
    switch (language) {
      case 'Tiếng Anh':
        return 'pi pi-language';
      case 'Tiếng Hàn':
        return 'pi pi-language';
      case 'Tiếng Trung':
        return 'pi pi-language';
      default:
        return 'pi pi-globe';
    }
  }

  getLevelColor(level: string | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | null | undefined {
    switch (level) {
      case 'Sơ cấp':
        return 'info';
      case 'Trung cấp':
        return 'warn';
      case 'Cao cấp':
        return 'success';
      default:
        return 'secondary';
    }
  }

  hasContent(value: string | undefined): boolean {
    return !!(value && value.trim().length > 0);
  }


  getCourseStats(): Array<{label: string, value: string, icon: string}> {
    if (!this.courseData) return [];
    
    return [
      {
        label: 'Thời gian',
        value: this.courseData.duration_weeks ? `${this.courseData.duration_weeks} tuần` : 'Chưa xác định',
        icon: 'pi pi-calendar'
      },
      {
        label: 'Tổng giờ học',
        value: this.courseData.total_hours ? `${this.courseData.total_hours} giờ` : 'Chưa xác định',
        icon: 'pi pi-clock'
      },
      {
        label: 'Học phí',
        value: this.formatCurrency(this.courseData.tuition_fee || null),
        icon: 'pi pi-money-bill'
      },
      {
        label: 'Ngôn ngữ',
        value: this.courseData.language || 'Chưa xác định',
        icon: this.getLanguageIcon(this.courseData.language)
      }
    ];
  }

  // Helper method để kiểm tra xem có dữ liệu đầy đủ không
  isCourseDataComplete(): boolean {
    if (!this.courseData) return false;
    
    return !!(
      this.courseData.course_code &&
      this.courseData.course_name &&
      this.courseData.language &&
      this.courseData.level
    );
  }

  // Helper method để tính completion percentage
  getCourseCompletionPercentage(): number {
    if (!this.courseData) return 0;
    
    const requiredFields = [
      'course_code',
      'course_name', 
      'description',
      'language',
      'level',
      'duration_weeks',
      'total_hours',
      'tuition_fee',
      'category',
      'prerequisites',
      'learning_objectives'
    ];
    
    const filledFields = requiredFields.filter(field => {
      const value = (this.courseData as any)[field];
      return value !== null && value !== undefined && value !== '';
    });
    
    return Math.round((filledFields.length / requiredFields.length) * 100);
  }

  // Helper method để format text content
  formatTextContent(text: string | undefined): string {
    if (!text || text.trim() === '') return 'Chưa có thông tin';
    return text.trim();
  }

}
