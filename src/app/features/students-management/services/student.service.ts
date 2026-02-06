import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  StudentsModel,
  StudentFilters,
  StudentStatistics,
  StudentWithDetails
} from '../models/students.model';

interface ApiResponse<T> {
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor() {}

  // ================= MOCK DATA =================

  private mockStudents: StudentsModel[] = [
    {
      id: 1,
      student_code: 'HV001',
      full_name: 'Nguyễn Văn An',
      gender: 'Nam',
      date_of_birth: '2002-05-15',
      email: 'an.nguyen@gmail.com',
      phone: '0901234567',
      address: 'Quận 1',
      enrollment_date: '2024-09-01',
      avatar_url: null,
      status: 'Đang học',
      note: null,
      created_at: '2024-09-01T08:00:00',
      updated_at: '2024-09-01T08:00:00',
      is_deleted: 0
    },
    {
      id: 2,
      student_code: 'HV002',
      full_name: 'Trần Thị Bình',
      gender: 'Nữ',
      date_of_birth: '2001-11-20',
      email: 'binh@gmail.com',
      phone: '0911111111',
      address: 'Thủ Đức',
      enrollment_date: '2024-10-15',
      avatar_url: null,
      status: 'Đang học',
      note: null,
      created_at: '2024-10-15T08:00:00',
      updated_at: '2024-10-15T08:00:00',
      is_deleted: 0
    },
    {
      id: 3,
      student_code: 'HV003',
      full_name: 'Lê Minh Châu',
      gender: 'Khác',
      date_of_birth: '1999-02-03',
      email: 'chau@gmail.com',
      phone: '0922222222',
      address: 'Quận 7',
      enrollment_date: '2024-06-05',
      avatar_url: null,
      status: 'Tạm dừng',
      note: null,
      created_at: '2024-06-05T08:00:00',
      updated_at: '2024-06-05T08:00:00',
      is_deleted: 0
    },
    {
      id: 4,
      student_code: 'HV004',
      full_name: 'Phạm Quốc Dũng',
      gender: 'Nam',
      date_of_birth: '1998-08-12',
      email: 'dung@gmail.com',
      phone: '0933333333',
      address: 'Hà Nội',
      enrollment_date: '2023-03-20',
      avatar_url: null,
      status: 'Hoàn thành',
      note: null,
      created_at: '2023-03-20T08:00:00',
      updated_at: '2023-03-20T08:00:00',
      is_deleted: 0
    }
  ];

  // ================= GET LIST =================

  getStudents(filters?: StudentFilters): Observable<ApiResponse<StudentsModel[]>> {
    let data = [...this.mockStudents];

    if (filters?.id) {
      data = data.filter(s => s.id === filters.id);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      data = data.filter(s =>
        s.full_name?.toLowerCase().includes(search) ||
        s.student_code?.toLowerCase().includes(search)
      );
    }

    if (filters?.gender) {
      data = data.filter(s => s.gender === filters.gender);
    }

    if (filters?.status) {
      data = data.filter(s => s.status === filters.status);
    }

    return of({ data });
  }

  // ================= CRUD MOCK =================

  addStudent(student: StudentsModel): Observable<ApiResponse<StudentsModel>> {
    const newStudent = {
      ...student,
      id: Date.now()
    };
    this.mockStudents.unshift(newStudent);
    return of({ data: newStudent });
  }

  updateStudent(id: number, student: StudentsModel): Observable<ApiResponse<StudentsModel>> {
    const index = this.mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
      this.mockStudents[index] = { ...this.mockStudents[index], ...student };
    }
    return of({ data: this.mockStudents[index] });
  }

  deleteStudent(id: number): Observable<ApiResponse<boolean>> {
    this.mockStudents = this.mockStudents.filter(s => s.id !== id);
    return of({ data: true });
  }

  // ================= EXTRA METHODS (Fix build error) =================

  getClassTeachers(classIds?: number[]): Observable<ApiResponse<any[]>> {
    return of({ data: [] });
  }

  getClassSchedules(params?: any): Observable<ApiResponse<any[]>> {
    return of({ data: [] });
  }

  getTeachersByIds(ids?: number[]): Observable<ApiResponse<any[]>> {
    return of({ data: [] });
  }

}
