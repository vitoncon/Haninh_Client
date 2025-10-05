import { Component, OnInit,ViewChild } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CoursesService } from '../services/courses.service';
import { Course } from '../models/courses.model';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Table } from 'primeng/table';
import { ClassService } from '../../class-management/services/class.service';
import { ClassModel } from '../../class-management/models/class.model';

@Component({
  selector: 'app-courses',
  templateUrl: 'courses.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    ToastModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DialogModule,
    DrawerModule,
    ConfirmDialogModule,
  ],
  providers: [ConfirmationService],
  styleUrls: ['./courses.scss']
})
export class Courses implements OnInit {
  courses: Course[] = [];
  displayDialog: boolean = false; 
  drawerVisible: boolean = false;
  drawerDetailVisible: boolean = false;
  selectedCourse: Course | null = null;
  formCourse: Course | null = null;
  classesForCourse: ClassModel[] = [];
  newCourse: Course = {
    id: undefined,
    course_code: '',
    course_name: '',
    description: '',
    language: 'Tiếng Anh',
    level: 'Sơ cấp',
    duration_weeks: null,
    total_hours: null,
    tuition_fee: null,
    status: 'Đang hoạt động'
  };
  saving: boolean = false;
  @ViewChild('dt', { static: false }) dt!: Table;


  constructor(
    private coursesService: CoursesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private classService: ClassService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  private createEmptyCourse(): Course {
    return {
      id: undefined,
      course_code: '',
      course_name: '',
      description: '',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      duration_weeks: null,
      total_hours: null,
      tuition_fee: null,
      status: 'Đang hoạt động'
    };
  }

  loadCourses() {
    this.coursesService.getCourses().subscribe(data => {
      this.courses = data.map(course => ({
        ...course,
        tuition_fee: Number(course.tuition_fee)
      }));
    });
  }
  onCreate() {
    this.selectedCourse = null;
    this.formCourse = this.createEmptyCourse();
    this.drawerVisible = true;
  }

  onDrawerHide() {
    this.formCourse = null;
    this.selectedCourse = null;
    this.displayDialog = false;
    this.drawerVisible = false;
  }

  onEdit(course: Course) {
    this.selectedCourse = { ...course };
    this.formCourse = { ...course };
    this.drawerVisible = true;  
  }

  onDelete(courseId: number) {
    this.confirmationService.confirm({
      message: 'Bạn có chắc muốn xóa khóa học này không?',
      header: 'Xác nhận',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Đồng ý',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.coursesService.deleteCourse(courseId).subscribe(() => {
          this.loadCourses();
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã xóa khóa học thành công'
          });
        });
      }
    });    
  }
  
  onView(course: Course) {
    this.selectedCourse = { ...course };
    this.drawerDetailVisible = true; 
    this.loadClassesForCourse(course.id as number);
  }

  private loadClassesForCourse(courseId: number) {
    if (!courseId) {
      this.classesForCourse = [];
      return;
    }
    this.classService.getClasses().subscribe({
      next: (all: ClassModel[]) => {
        this.classesForCourse = (all || []).filter(c => Number(c.course_id) === Number(courseId));
      },
      error: () => {
        this.classesForCourse = [];
      }
    });
  }

  onSave() {
    if (!this.formCourse) return;
    if (!this.formCourse.course_code || !this.formCourse.course_name) {
      this.messageService.add({ severity: 'warn', summary: 'Thiếu thông tin', detail: 'Vui lòng nhập Mã KH và Tên khóa học' });
      return;
    }

    this.saving = true;
    const done = () => { this.saving = false; };

    if (this.selectedCourse && this.selectedCourse.id) {
      this.coursesService.updateCourse(this.selectedCourse.id, this.formCourse).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Cập nhật khóa học thành công' });
          this.loadCourses();
          this.drawerVisible = false; 
        },
        error: (err) => {
          console.error("Update error:", err);
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err?.error?.message || 'Không thể cập nhật khóa học' });
        },
        complete: done
      });
    } else {
      this.coursesService.addCourse(this.formCourse).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Thêm khóa học thành công' });
          this.loadCourses();
          this.drawerVisible = false; 
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err?.error?.message || 'Không thể thêm khóa học' });
        },
        complete: done
      });
    }
  }

  onClearFilters() {
    this.dt?.clear();
  }

  resetForm() {
    this.newCourse = {
      id: undefined,
      course_code: '',
      course_name: '',
      description: '',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      duration_weeks: null,
      total_hours: null,
      tuition_fee: null,
      status: 'Đang hoạt động'
    };
  }
}
