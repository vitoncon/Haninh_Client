import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Course } from '../../models/courses.model';
import { CoursesService } from '../../services/courses.service';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { ClassService } from '../../../class-management/services/class.service';
import { ClassStudentService } from '../../../class-management/services/class-student.service';
import { TeachingAssignmentService } from '../../../teaching-assignments/services/teaching-assignment.service';

@Component({
  selector: 'app-course-detail',
  templateUrl: 'course-detail.html',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    CardModule,
    ChipModule,
    TagModule,
    DividerModule,
    ProgressSpinnerModule,
    TooltipModule,
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
          console.error('Error loading course detail:', error);
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
      this.router.navigate(['/features/courses/edit', this.courseData.id]);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cảnh báo',
        detail: 'Không thể chỉnh sửa khóa học này'
      });
    }
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
      tags: course.tags || []
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
          console.error('Error loading course stats:', error);
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

    // Load students và teachers từ tất cả các lớp
    const studentPromises = classIds.map(classId => 
      this.classStudentService.getStudentsByClass(classId).toPromise()
    );

    const teacherPromises = classIds.map(classId => 
      this.teachingAssignmentService.getTeachingAssignmentsWithDetails({ 
        class_id: classId, 
        status: 'Đang dạy' 
      }).toPromise()
    );

    Promise.all([...studentPromises, ...teacherPromises])
      .then(results => {
        const studentResults = results.slice(0, classIds.length);
        const teacherResults = results.slice(classIds.length);

        // Đếm số học viên unique (tránh đếm trùng nếu học viên học nhiều lớp)
        const uniqueStudents = new Set<number>();
        studentResults.forEach(students => {
          if (students && Array.isArray(students)) {
            students.forEach(student => {
              const studentData = student as any; // Type assertion for student data
              if (studentData.student_id && studentData.status === 'Đang học') {
                uniqueStudents.add(studentData.student_id);
              }
            });
          }
        });

        // Đếm số giáo viên unique từ teaching assignments
        const uniqueTeachers = new Set<number>();
        teacherResults.forEach(assignments => {
          if (assignments && Array.isArray(assignments)) {
            assignments.forEach(assignment => {
              const assignmentData = assignment as any; // Type assertion for assignment data
              if (assignmentData.teacher_id) {
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
      })
      .catch(error => {
        console.error('Error loading course statistics:', error);
        this.statsLoading = false;
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
        return 'pi pi-flag';
      case 'Tiếng Hàn':
        return 'pi pi-flag';
      case 'Tiếng Trung':
        return 'pi pi-flag';
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

  hasTags(tags: string[] | undefined): boolean {
    return !!(tags && tags.length > 0);
  }

  formatTags(tags: string[] | undefined): string[] {
    return tags || [];
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

  // Helper method để format tags display
  getTagsDisplayText(tags: string[] | undefined): string {
    if (!tags || tags.length === 0) return 'Chưa có thẻ phân loại';
    return tags.join(', ');
  }
}
