import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/* PrimeNG */
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { DrawerModule } from 'primeng/drawer';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';

interface Course {
  id: number;
  course_code: string;
  course_name: string;
  description?: string;
  prerequisites?: string;
  learning_objectives?: string;
  category?: string;
  language: string;
  level: string;
  duration_weeks?: number;
  total_hours?: number;
  tuition_fee: number;
  status: string;
}

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
    ToolbarModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    DrawerModule,
    ConfirmDialogModule,
    TooltipModule
  ]
})
export class Courses implements OnInit {

  loading = false;
  saving = false;

  courses: Course[] = [];
  filteredCourses: Course[] = [];

  searchQuery = '';

  drawerVisible = false;
  selectedCourse: Course | null = null;
  formCourse: Course | null = null;

  statistics: any;

  ngOnInit() {
    this.loadMockData();
  }

  /* ================= MOCK DATA ================= */
  loadMockData() {
    this.loading = true;

    setTimeout(() => {
      this.courses = [
        {
          id: 1,
          course_code: 'ENG-A1',
          course_name: 'Tiếng Anh giao tiếp cơ bản',
          language: 'Tiếng Anh',
          level: 'Sơ cấp',
          duration_weeks: 12,
          total_hours: 96,
          tuition_fee: 2500000,
          status: 'Đang hoạt động'
        },
        {
          id: 2,
          course_code: 'KOR-TOPIK1',
          course_name: 'Luyện thi TOPIK I',
          language: 'Tiếng Hàn',
          level: 'Trung cấp',
          duration_weeks: 10,
          total_hours: 80,
          tuition_fee: 3000000,
          status: 'Đang hoạt động'
        },
        {
          id: 3,
          course_code: 'CHN-HSK2',
          course_name: 'Tiếng Trung HSK 2',
          language: 'Tiếng Trung',
          level: 'Sơ cấp',
          duration_weeks: 14,
          total_hours: 110,
          tuition_fee: 3200000,
          status: 'Không hoạt động'
        }
      ];

      this.filteredCourses = [...this.courses];

      this.statistics = {
        total_courses: this.courses.length,
        active_courses: this.courses.filter(c => c.status === 'Đang hoạt động').length,
        inactive_courses: this.courses.filter(c => c.status !== 'Đang hoạt động').length,
        average_tuition_fee:
          this.courses.reduce((s, c) => s + c.tuition_fee, 0) / this.courses.length
      };

      this.loading = false;
    }, 500);
  }

  /* ================= ACTIONS ================= */
  forceRefresh() {
    this.loadMockData();
  }

  onGlobalFilter(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredCourses = this.courses.filter(c =>
      Object.values(c).join(' ').toLowerCase().includes(value)
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredCourses = [...this.courses];
  }

  onCreate() {
    this.selectedCourse = null;
    this.formCourse = {
      id: 0,
      course_code: '',
      course_name: '',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      tuition_fee: 0,
      status: 'Đang hoạt động'
    };
    this.drawerVisible = true;
  }

  onEdit(course: Course) {
    this.selectedCourse = course;
    this.formCourse = { ...course };
    this.drawerVisible = true;
  }

  onView(course: Course) {
    alert(`Xem khóa học: ${course.course_name}`);
  }

  onDelete(course: Course) {
    if (confirm(`Xóa khóa học "${course.course_name}"?`)) {
      this.courses = this.courses.filter(c => c.id !== course.id);
      this.filteredCourses = [...this.courses];
    }
  }

  onSave() {
    if (!this.formCourse) return;

    if (this.formCourse.id === 0) {
      this.formCourse.id = Date.now();
      this.courses.push(this.formCourse);
    } else {
      const index = this.courses.findIndex(c => c.id === this.formCourse!.id);
      if (index > -1) this.courses[index] = this.formCourse;
    }

    this.filteredCourses = [...this.courses];
    this.drawerVisible = false;
  }

  onDrawerHide() {
    this.formCourse = null;
    this.selectedCourse = null;
  }

  formatCurrency(value: number) {
    return value?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }
}
