import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor() {}

  // =====================
  // MOCK: Danh sách học viên
  // =====================
  getStudents(filters?: any): Observable<any[]> {
    return of([
      {
        id: 1,
        student_code: 'HV001',
        full_name: 'Nguyễn Văn A',
        gender: 'Nam',
        date_of_birth: '2003-11-01',
        phone: '0912345678',
        email: 'a@gmail.com',
        enrollment_date: '2025-01-10',
        status: 'Đang học',
        avatar_url: null,
        note: ''
      },
      {
        id: 2,
        student_code: 'HV002',
        full_name: 'Trần Thị B',
        gender: 'Nữ',
        date_of_birth: '2004-05-12',
        phone: '0988888888',
        email: 'b@gmail.com',
        enrollment_date: '2025-02-15',
        status: 'Tạm dừng',
        avatar_url: null,
        note: ''
      }
    ]);
  }

  // =====================
  // MOCK: thống kê dashboard
  // =====================
  getStudentStatistics(): Observable<any> {
    return of({
      total_students: 2,
      active_students: 1,
      inactive_students: 1,
      graduated_students: 0
    });
  }

  // =====================
  // MOCK: chi tiết
  // =====================
  getStudentById(id: number): Observable<any> {
    return this.getStudents().pipe(
      // đơn giản cho mock
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (source: any) => source
    );
  }

  // =====================
  // MOCK: các hàm phụ để không vỡ build
  // =====================
  getClassTeachers(classIds: number[]): Observable<any[]> {
    return of([]);
  }

  getClassSchedules(filters?: any): Observable<any[]> {
    return of([]);
  }

  getTeachersByIds(ids: number[]): Observable<any[]> {
    return of([]);
  }
}
