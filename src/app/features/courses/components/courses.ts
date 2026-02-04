import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DrawerModule } from 'primeng/drawer';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { MessageService, ConfirmationService } from 'primeng/api';

import { Course, CourseStatistics } from '../models/courses.model';

@Component({
  selector: 'app-courses',
  standalone: true,
  templateUrl: './courses.html',
  styleUrls: ['./courses.scss'],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    InputNumberModule,
    DrawerModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    CardModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class Courses implements OnInit {

  // ================= TABLE =================
  @ViewChild('dt') dt!: Table;

  courses: Course[] = [];
  filteredCourses: Course[] = [];

  // ================= UI STATE =================
  loading = false;
  saving = false;
  drawerVisible = false;

  selectedCourse: Course | null = null;
  formCourse: Course | null = null;

  searchQuery = '';
  showClearButton = false;

  // ================= OPTIONS =================
  languages = ['Tiếng Anh', 'Tiếng Hàn', 'Tiếng Trung'];
  levels = ['Sơ cấp', 'Trung cấp', 'Cao cấp'];
  statuses = ['Đang hoạt động', 'Không hoạt động'];

  // ================= STATISTICS =================
  statistics: CourseStatistics | null = null;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  // ================= INIT =================
  ngOnInit(): void {
    this.mockCourses();
    this.filteredCourses = [...this.courses];
    this.calculateStatistics();
  }

  // ================= MOCK DATA =================
  private mockCourses() {
    this.courses = [
      {
        id: 1,
        course_code: 'KH2024001',
        course_name: 'Tiếng Anh Giao Tiếp',
        description: 'Khóa học giao tiếp tiếng Anh cho người mất gốc',
        language: 'Tiếng Anh',
        level: 'Sơ cấp',
        duration_weeks: 12,
        total_hours: 36,
        tuition_fee: 3500000,
        status: 'Đang hoạt động',
        prerequisites: 'Không yêu cầu',
        learning_objectives: 'Giao tiếp cơ bản, phản xạ nhanh',
        category: 'Giao tiếp',
        created_at: new Date()
      },
      {
        id: 2,
        course_code: 'KH2024002',
        course_name: 'TOPIK I',
        description: 'Luyện thi chứng chỉ TOPIK I',
        language: 'Tiếng Hàn',
        level: 'Trung cấp',
        duration_weeks: 10,
        total_hours: 30,
        tuition_fee: 4200000,
        status: 'Đang hoạt động',
        prerequisites: 'Biết bảng chữ cái Hangeul',
        learning_objectives: 'Đạt TOPIK I',
        category: 'Luyện thi'
      },
      {
        id: 3,
        course_code: 'KH2024003',
        course_name: 'HSK 2',
        description: 'Luyện thi chứng chỉ HSK 2',
        language: 'Tiếng Trung',
        level: 'Sơ cấp',
        duration_weeks: 8,
        total_hours: 24,
        tuition_fee: 3000000,
        status: 'Không hoạt động',
        prerequisites: 'HSK 1',
        learning_objectives: 'Đạt HSK 2',
        category: 'Luyện thi'
      }
    ];
  }

  // ================= CRUD =================
  onCreate() {
    this.selectedCourse = null;
    this.formCourse = this.createEmptyCourse();
    this.drawerVisible = true;
  }

  onEdit(course: Course) {
    this.selectedCourse = course;
    this.formCourse = { ...course };
    this.drawerVisible = true;
  }

  onDelete(course: Course) {
    this.confirmationService.confirm({
      message: `Xóa khóa học "${course.course_name}"?`,
      accept: () => {
        this.courses = this.courses.filter(c => c.id !== course.id);
        this.filteredCourses = [...this.courses];
        this.calculateStatistics();
        this.messageService.add({
          severity: 'success',
          summary: 'Đã xóa',
          detail: 'Xóa khóa học thành công'
        });
      }
    });
  }

  onSave() {
    if (!this.formCourse) return;

    if (this.selectedCourse) {
      const index = this.courses.findIndex(c => c.id === this.selectedCourse!.id);
      this.courses[index] = { ...this.formCourse };
    } else {
      this.formCourse.id = Date.now();
      this.courses.unshift(this.formCourse);
    }

    this.filteredCourses = [...this.courses];
    this.calculateStatistics();
    this.drawerVisible = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Lưu khóa học thành công'
    });
  }

  onDrawerHide() {
    this.drawerVisible = false;
    this.formCourse = null;
    this.selectedCourse = null;
  }

  // ================= SEARCH =================
  onGlobalFilter(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchQuery = value;
    this.showClearButton = value.length > 0;

    this.filteredCourses = this.courses.filter(c =>
      c.course_name.toLowerCase().includes(value) ||
      c.course_code.toLowerCase().includes(value) ||
      c.language.toLowerCase().includes(value)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.showClearButton = false;
    this.filteredCourses = [...this.courses];
  }

  // ================= HELPERS =================
  private createEmptyCourse(): Course {
    return {
      course_code: `KH${new Date().getFullYear()}${Math.floor(Math.random() * 1000)}`,
      course_name: '',
      description: '',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      duration_weeks: null,
      total_hours: null,
      tuition_fee: null,
      status: 'Đang hoạt động',
      prerequisites: '',
      learning_objectives: '',
      category: ''
    };
  }

  formatCurrency(value?: number | null): string {
    if (!value) return '—';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  }

  private calculateStatistics() {
    const active = this.courses.filter(c => c.status === 'Đang hoạt động');
    const inactive = this.courses.filter(c => c.status === 'Không hoạt động');

    this.statistics = {
      total_courses: this.courses.length,
      active_courses: active.length,
      inactive_courses: inactive.length,
      language_distribution: [
        { language: 'Tiếng Anh', count: this.courses.filter(c => c.language === 'Tiếng Anh').length },
        { language: 'Tiếng Hàn', count: this.courses.filter(c => c.language === 'Tiếng Hàn').length },
        { language: 'Tiếng Trung', count: this.courses.filter(c => c.language === 'Tiếng Trung').length }
      ],
      level_distribution: [
        { level: 'Sơ cấp', count: this.courses.filter(c => c.level === 'Sơ cấp').length },
        { level: 'Trung cấp', count: this.courses.filter(c => c.level === 'Trung cấp').length },
        { level: 'Cao cấp', count: this.courses.filter(c => c.level === 'Cao cấp').length }
      ],
      average_tuition_fee: 0,
      average_duration_weeks: 0,
      average_total_hours: 0
    };
  }

  forceRefresh() {}
}
