import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subject, takeUntil } from 'rxjs';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-courses',
  templateUrl: './student-courses.html',
  styleUrls: ['./student-courses.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressSpinnerModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class StudentCourses implements OnInit, OnDestroy {
  courses: any[] = [];
  loading: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(
    private studentService: StudentService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCourses(): void {
    this.loading = true;
    this.studentService.getCourses().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.courses = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách khóa học'
        });
        this.loading = false;
      }
    });
  }

  getLanguageSeverity(language: string): "success" | "secondary" | "info" | "warn" | "danger" | "contrast" {
    switch (language?.toLowerCase()) {
      case 'anh':
      case 'tiếng anh':
      case 'english':
        return 'info';
      case 'trung':
      case 'tiếng trung':
      case 'chinese':
        return 'warn';
      case 'hàn':
      case 'tiếng hàn':
      case 'korean':
        return 'success';
      default:
        return 'secondary';
    }
  }

  getCourseIcon(courseName: string): string {
    const name = courseName?.toLowerCase() || '';
    if (name.includes('anh') || name.includes('english')) return 'pi-language';
    if (name.includes('trung') || name.includes('chinese')) return 'pi-pencil';
    if (name.includes('hàn') || name.includes('korean')) return 'pi-palette';
    if (name.includes('nhật') || name.includes('japanese')) return 'pi-compass';
    return 'pi-book';
  }

  formatCurrency(amount: number): string {

    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  onEnroll(course: any): void {
    if (!course.id) return;

    this.loading = true;
    this.studentService.enrollCourse(course.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Đăng ký thành công',
          detail: response.message || 'Hồ sơ đăng ký của bạn đang được xử lý. Vui lòng kiểm tra mục Học phí.'
        });
        this.loadCourses(); // Refresh to show "Registered" status
      },

      error: (error) => {
        this.loading = false;
        console.error('Error enrolling course:', error);
        
        let detail = 'Không thể thực hiện đăng ký. Vui lòng thử lại sau.';
        if (error.error && error.error.message) {
          detail = error.error.message;
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi đăng ký',
          detail: detail
        });
      }
    });
  }
}

