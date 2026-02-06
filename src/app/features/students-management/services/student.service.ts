import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StudentsModel, StudentStatistics } from '../models/students.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor() {}

  // =========================
  // MOCK STUDENTS LIST
  // =========================
  getStudents(): Observable<any> {

    const now = new Date().toISOString();

    return of({
      data: [
        {
          id: 1,
          student_code: 'ST001',
          full_name: 'Nguyễn Văn An',
          gender: 'Nam',
          date_of_birth: '2005-05-10',
          email: 'an@gmail.com',
          phone: '0901111111',
          address: 'Thái Nguyên',
          enrollment_date: '2026-01-10',
          avatar_url: '',
          status: 'Đang học',
          note: '',
          created_at: now,
          updated_at: now,
          is_deleted: 0
        },
        {
          id: 2,
          student_code: 'ST002',
          full_name: 'Trần Thị Bình',
          gender: 'Nữ',
          date_of_birth: '2004-09-20',
          email: 'binh@gmail.com',
          phone: '0902222222',
          address: 'Hà Nội',
          enrollment_date: '2026-01-15',
          avatar_url: '',
          status: 'Đang học',
          note: '',
          created_at: now,
          updated_at: now,
          is_deleted: 0
        },
        {
          id: 3,
          student_code: 'ST003',
          full_name: 'Lê Văn Cường',
          gender: 'Nam',
          date_of_birth: '2003-12-01',
          email: 'cuong@gmail.com',
          phone: '0903333333',
          address: 'Bắc Ninh',
          enrollment_date: '2026-01-20',
          avatar_url: '',
          status: 'Tạm dừng',
          note: 'Nghỉ tạm',
          created_at: now,
          updated_at: now,
          is_deleted: 0
        },
        {
          id: 4,
          student_code: 'ST004',
          full_name: 'Phạm Thị Dung',
          gender: 'Nữ',
          date_of_birth: '2006-03-11',
          email: 'dung@gmail.com',
          phone: '0904444444',
          address: 'Vĩnh Phúc',
          enrollment_date: '2026-02-01',
          avatar_url: '',
          status: 'Đang học',
          note: '',
          created_at: now,
          updated_at: now,
          is_deleted: 0
        }
      ]
    });

  }

  // =========================
  // MOCK STUDENT BY ID
  // =========================
  getStudentById(id: number): Observable<any> {
    return this.getStudents();
  }

  // =========================
  // MOCK ADD / UPDATE / DELETE
  // =========================
  addStudent(student: any): Observable<any> {
    console.log('Mock add student', student);
    return of(student);
  }

  updateStudent(id: number, student: any): Observable<any> {
    console.log('Mock update student', id, student);
    return of(student);
  }

  deleteStudent(id: number): Observable<any> {
    console.log('Mock delete student', id);
    return of(true);
  }

  // =========================
  // MOCK STATISTICS
  // =========================
  getStudentStatistics(): Observable<StudentStatistics> {

    return of({
      total_students: 4,
      active_students: 3,
      inactive_students: 1,
      graduated_students: 0,

      gender_distribution: [
        { gender: 'Nam', count: 2 },
        { gender: 'Nữ', count: 2 }
      ],

      language_distribution: [
        { language: 'Tiếng Anh', count: 2 },
        { language: 'Tiếng Trung', count: 1 },
        { language: 'Tiếng Hàn', count: 1 }
      ],

      level_distribution: [
        { level: 'Beginner', count: 2 },
        { level: 'Intermediate', count: 1 },
        { level: 'Advanced', count: 1 }
      ],

      status_distribution: [
        { status: 'Đang học', count: 3 },
        { status: 'Tạm dừng', count: 1 }
      ],

      average_age: 20,

      enrollment_by_month: [
        { month: '2025-12', count: 1 },
        { month: '2026-01', count: 2 },
        { month: '2026-02', count: 1 }
      ]
    });

  }

  // =========================
  // MOCK CLASSES OF STUDENT
  // =========================
  getCurrentClasses(): Observable<any[]> {
    return of([
      {
        class_name: 'IELTS Basic',
        teacher_name: 'Nguyễn Văn A',
        schedule: 'T2 - T4 - T6'
      }
    ]);
  }

  // =========================
  // MOCK OVERVIEW
  // =========================
  getOverviewStats(): Observable<any> {
    return of({
      total_classes: 2,
      completed_classes: 1,
      current_classes: 1
    });
  }

  // =========================
  // MOCK OTHER API
  // =========================
  getClassStudents(): Observable<any[]> {
    return of([]);
  }

  getClassStudentsWithDetails(): Observable<any[]> {
    return of([]);
  }

  getClasses(): Observable<any[]> {
    return of([]);
  }

  getStudyResults(): Observable<any[]> {
    return of([]);
  }

  getStudentCertificates(): Observable<any[]> {
    return of([]);
  }

  getTeachingAssignments(): Observable<any[]> {
    return of([]);
  }

  getTeachersByIds(): Observable<any[]> {
    return of([]);
  }

  getClassSchedules(): Observable<any[]> {
    return of([]);
  }

  getClassTeachers(): Observable<any[]> {
    return of([]);
  }

}
