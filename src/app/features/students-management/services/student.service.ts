import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor() {}

  getStudents(): Observable<any[]> {
    return of([
      {
        id: 1,
        student_code: 'HV001',
        full_name: 'Nguyễn Văn A',
        gender: 'Nam',
        date_of_birth: '2003-11-01',
        phone: '0912345678',
        email: 'a@gmail.com',
        enrollment_date: '2025-01-10',   // ⭐ QUAN TRỌNG
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
        enrollment_date: '2025-02-15',   // ⭐ QUAN TRỌNG
        status: 'Tạm dừng',
        avatar_url: null,
        note: ''
      },
      {
        id: 3,
        student_code: 'HV003',
        full_name: 'Lê Văn C',
        gender: 'Nam',
        date_of_birth: '2002-09-20',
        phone: '0977777777',
        email: 'c@gmail.com',
        enrollment_date: '2024-12-01',   // ⭐ QUAN TRỌNG
        status: 'Hoàn thành',
        avatar_url: null,
        note: ''
      }
    ]);
  }

  getStatistics(): Observable<any> {
    return of({
      total_students: 3,
      active_students: 1,
      inactive_students: 1,
      graduated_students: 1
    });
  }
}
