import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Course, CourseFilters, CourseStatistics } from '../models/courses.model';

@Injectable({
  providedIn: 'root'
})
export class CoursesService {

  private courses: Course[] = [
    {
      id: 1,
      course_code: 'KH2024001',
      course_name: 'Tiếng Anh giao tiếp',
      description: 'Khóa học tiếng Anh cho người mới',
      language: 'Tiếng Anh',
      level: 'Sơ cấp',
      duration_weeks: 12,
      total_hours: 36,
      tuition_fee: 2500000,
      status: 'Đang hoạt động',
      prerequisites: 'Không yêu cầu',
      learning_objectives: 'Giao tiếp cơ bản',
      category: 'Ngoại ngữ',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 2,
      course_code: 'KH2024002',
      course_name: 'Tiếng Hàn TOPIK I',
      description: 'Luyện thi TOPIK I',
      language: 'Tiếng Hàn',
      level: 'Trung cấp',
      duration_weeks: 16,
      total_hours: 48,
      tuition_fee: 3200000,
      status: 'Đang hoạt động',
      prerequisites: 'Biết bảng chữ cái',
      learning_objectives: 'Đạt TOPIK I',
      category: 'Ngoại ngữ',
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: 3,
      course_code: 'KH2024003',
      course_name: 'Tiếng Trung HSK 3',
      description: 'Luyện thi HSK 3',
      language: 'Tiếng Trung',
      level: 'Cao cấp',
      duration_weeks: 20,
      total_hours: 60,
      tuition_fee: 4500000,
      status: 'Không hoạt động',
      prerequisites: 'HSK 2',
      learning_objectives: 'Đạt HSK 3',
      category: 'Ngoại ngữ',
      created_at: new Date(),
      updated_at: new Date()
    }
  ];

  private autoId = 4;

  getCourses(filters?: CourseFilters): Observable<Course[]> {
    let data = [...this.courses];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(c =>
        c.course_code.toLowerCase().includes(q) ||
        c.course_name.toLowerCase().includes(q)
      );
    }

    if (filters?.language) {
      data = data.filter(c => c.language === filters.language);
    }

    if (filters?.level) {
      data = data.filter(c => c.level === filters.level);
    }

    if (filters?.status) {
      data = data.filter(c => c.status === filters.status);
    }

    return of(data).pipe(delay(300));
  }

  getCourseById(id: number): Observable<Course> {
    const course = this.courses.find(c => c.id === id);
    return course
      ? of(course).pipe(delay(200))
      : throwError(() => new Error('Course not found'));
  }

  getCoursesByIds(ids: number[]): Observable<Course[]> {
    return of(this.courses.filter(c => c.id && ids.includes(c.id))).pipe(delay(200));
  }

  addCourse(course: Course): Observable<Course> {
    const newCourse: Course = {
      ...course,
      id: this.autoId++,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.courses.unshift(newCourse);
    return of(newCourse).pipe(delay(300));
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    const index = this.courses.findIndex(c => c.id === id);
    if (index === -1) {
      return throwError(() => new Error('Course not found'));
    }

    this.courses[index] = {
      ...this.courses[index],
      ...course,
      updated_at: new Date()
    };

    return of(this.courses[index]).pipe(delay(300));
  }

  deleteCourse(id: number): Observable<void> {
    this.courses = this.courses.filter(c => c.id !== id);
    return of(void 0).pipe(delay(300));
  }

  getCourseStatistics(): Observable<CourseStatistics> {
    return of(this.calculateCourseStatistics(this.courses)).pipe(delay(300));
  }

  private calculateCourseStatistics(courses: Course[]): CourseStatistics {
    const total_courses = courses.length;
    const active_courses = courses.filter(c => c.status === 'Đang hoạt động').length;
    const inactive_courses = courses.filter(c => c.status === 'Không hoạt động').length;

    const tuitionFees = courses.map(c => c.tuition_fee || 0).filter(v => v > 0);
    const durations = courses.map(c => c.duration_weeks || 0).filter(v => v > 0);
    const hours = courses.map(c => c.total_hours || 0).filter(v => v > 0);

    const language_distribution = Object.entries(
      courses.reduce<Record<string, number>>((acc, c) => {
        acc[c.language] = (acc[c.language] || 0) + 1;
        return acc;
      }, {})
    ).map(([language, count]) => ({
      language,
      count
    }));

    const level_distribution = Object.entries(
      courses.reduce<Record<string, number>>((acc, c) => {
        acc[c.level] = (acc[c.level] || 0) + 1;
        return acc;
      }, {})
    ).map(([level, count]) => ({
      level,
      count
    }));

    return {
      total_courses,
      active_courses,
      inactive_courses,
      language_distribution,
      level_distribution,
      average_tuition_fee: tuitionFees.length ? Math.round(tuitionFees.reduce((a, b) => a + b) / tuitionFees.length) : 0,
      average_duration_weeks: durations.length ? Math.round(durations.reduce((a, b) => a + b) / durations.length) : 0,
      average_total_hours: hours.length ? Math.round(hours.reduce((a, b) => a + b) / hours.length) : 0
    };
  }

  validateCourseCode(code: string): Observable<boolean> {
    const exists = this.courses.some(c => c.course_code === code);
    return of(!exists).pipe(delay(200));
  }

  generateCourseCode(): string {
    const year = new Date().getFullYear();
    return `KH${year}${String(this.autoId).padStart(3, '0')}`;
  }
}
