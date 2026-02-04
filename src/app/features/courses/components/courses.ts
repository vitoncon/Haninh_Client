import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

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
    ConfirmDialogModule,
    DrawerModule,
    InputTextModule,
    InputNumberModule
  ]
})
export class Courses {
  loading = false;

  courses: any[] = [];
  filteredCourses: any[] = [];

  searchQuery = '';

  statistics = {
    total_courses: 0,
    active_courses: 0,
    inactive_courses: 0,
    average_tuition_fee: 0
  };

  drawerVisible = false;
  saving = false;

  selectedCourse: any = null;
  formCourse: any = null;

  constructor() {
    this.mockData();
  }

  mockData() {
    this.courses = [
      {
        id: 1,
        course_code: 'ENG101',
        course_name: 'Tiếng Anh giao tiếp cơ bản',
        language: 'Tiếng Anh',
        level: 'Sơ cấp',
        duration_weeks: 12,
        total_hours: 96,
        tuition_fee: 2000000,
        status: 'Đang hoạt động'
      },
      {
        id: 2,
        course_code: 'KOR201',
        course_name: 'Tiếng Hàn trung cấp',
        language: 'Tiếng Hàn',
        level: 'Trung cấp',
        duration_weeks: 16,
        total_hours: 120,
        tuition_fee: 3500000,
        status: 'Không hoạt động'
      }
    ];

    this.filteredCourses = [...this.courses];
    this.calculateStatistics();
  }

  calculateStatistics() {
    this.statistics.total_courses = this.courses.length;
    this.statistics.active_courses = this.courses.filter(c => c.status === 'Đang hoạt động').length;
    this.statistics.inactive_courses = this.courses.filter(c => c.status === 'Không hoạt động').length;

    const totalFee = this.courses.reduce((sum, c) => sum + (c.tuition_fee || 0), 0);
    this.statistics.average_tuition_fee = totalFee / (this.courses.length || 1);
  }

  formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  }

  onGlobalFilter(event: any) {
    const value = event.target.value.toLowerCase();
    this.filteredCourses = this.courses.filter(c =>
      Object.values(c).some(v =>
        String(v).toLowerCase().includes(value)
      )
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.filteredCourses = [...this.courses];
  }

  forceRefresh() {
    this.mockData();
  }

  onCreate() {
    this.selectedCourse = null;
    this.formCourse = {};
    this.drawerVisible = true;
  }

  onEdit(course: any) {
    this.selectedCourse = course;
    this.formCourse = { ...course };
    this.drawerVisible = true;
  }

  onView(course: any) {
    alert(`Xem khóa học: ${course.course_name}`);
  }

  onDelete(course: any) {
    this.courses = this.courses.filter(c => c !== course);
    this.filteredCourses = [...this.courses];
    this.calculateStatistics();
  }

  onSave() {
    if (this.selectedCourse) {
      Object.assign(this.selectedCourse, this.formCourse);
    } else {
      this.courses.push({
        ...this.formCourse,
        id: Date.now()
      });
    }

    this.filteredCourses = [...this.courses];
    this.calculateStatistics();
    this.drawerVisible = false;
  }

  onDrawerHide() {
    this.formCourse = null;
    this.selectedCourse = null;
  }
}
