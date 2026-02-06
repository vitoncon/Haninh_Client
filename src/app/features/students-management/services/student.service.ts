import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

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
    address: 'Quận 1, TP.HCM',
    enrollment_date: '2024-09-01',
    avatar_url: null,
    status: 'Đang học',
    note: 'Học viên mới',
    created_at: '2024-09-01T08:00:00',
    updated_at: '2024-09-10T10:30:00',
    is_deleted: 0
  },
  {
    id: 2,
    student_code: 'HV002',
    full_name: 'Trần Thị Bình',
    gender: 'Nữ',
    date_of_birth: '2001-11-20',
    email: 'binh.tran@gmail.com',
    phone: '0912345678',
    address: 'Quận Bình Thạnh, TP.HCM',
    enrollment_date: '2024-10-15',
    avatar_url: null,
    status: 'Đang học',
    note: null,
    created_at: '2024-10-15T09:00:00',
    updated_at: '2024-10-20T14:00:00',
    is_deleted: 0
  },
  {
    id: 3,
    student_code: 'HV003',
    full_name: 'Lê Minh Châu',
    gender: 'Khác',
    date_of_birth: '1999-02-03',
    email: 'chau.le@gmail.com',
    phone: '0923456789',
    address: 'Quận 7, TP.HCM',
    enrollment_date: '2024-06-05',
    avatar_url: null,
    status: 'Tạm dừng',
    note: 'Tạm dừng vì lý do cá nhân',
    created_at: '2024-06-05T08:30:00',
    updated_at: '2024-12-01T16:45:00',
    is_deleted: 0
  },
  {
    id: 4,
    student_code: 'HV004',
    full_name: 'Phạm Quốc Dũng',
    gender: 'Nam',
    date_of_birth: '1998-08-12',
    email: 'dung.pham@gmail.com',
    phone: '0934567890',
    address: 'Thủ Đức, TP.HCM',
    enrollment_date: '2023-03-20',
    avatar_url: null,
    status: 'Hoàn thành',
    note: 'Đã hoàn thành khóa học',
    created_at: '2023-03-20T08:00:00',
    updated_at: '2024-03-20T17:00:00',
    is_deleted: 0
  }
];


  // ================= GET =================
  getStudents(filters?: any): Observable<{ data: any[] }> {
    let data = [...this.mockStudents];

    if (filters?.id) {
      data = data.filter(s => s.id === filters.id);
    }

    return of({ data });
  }

  // ================= ADD =================
  addStudent(payload: any): Observable<{ data: any }> {
    const newStudent = {
      ...payload,
      id: Date.now()
    };
    this.mockStudents.push(newStudent);
    return of({ data: newStudent });
  }

  // ================= UPDATE =================
  updateStudent(id: number, payload: any): Observable<{ data: any }> {
    const index = this.mockStudents.findIndex(s => s.id === id);
    if (index !== -1) {
      this.mockStudents[index] = {
        ...this.mockStudents[index],
        ...payload
      };
    }
    return of({ data: this.mockStudents[index] });
  }

  // ================= DELETE =================
  deleteStudent(id: number): Observable<{ data: boolean }> {
    this.mockStudents = this.mockStudents.filter(s => s.id !== id);
    return of({ data: true });
  }

  // ================= EXTRA APIs (component đang gọi) =================
  getClassTeachers(classIds: number[]): Observable<{ data: any[] }> {
    return of({
      data: [
        { id: 1, name: 'GV Nguyễn Văn X' },
        { id: 2, name: 'GV Trần Thị Y' }
      ]
    });
  }

  getClassSchedules(params: any): Observable<{ data: any[] }> {
    return of({
      data: [
        {
          id: 1,
          class_id: params?.class_ids?.[0] ?? 1,
          date: '2025-02-20',
          start_time: '18:00',
          end_time: '20:00',
          room_name: 'P101',
          status: 'Đã Lên Lịch'
        }
      ]
    });
  }

  getTeachersByIds(ids: number[]): Observable<{ data: any[] }> {
    return of({
      data: ids.map(id => ({
        id,
        name: `Giảng viên ${id}`
      }))
    });
  }
}

