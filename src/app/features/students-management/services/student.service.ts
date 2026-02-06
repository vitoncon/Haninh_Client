import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  // ================= MOCK DATA =================
  private mockStudents = [
    {
      id: 1,
      student_code: 'HV001',
      full_name: 'Nguyễn Văn A',
      gender: 'Nam',
      phone: '0900000001',
      email: 'a@gmail.com',
      date_of_entry: '2024-09-01',
      status: 'Đang học'
    },
    {
      id: 2,
      student_code: 'HV002',
      full_name: 'Trần Thị B',
      gender: 'Nữ',
      phone: '0900000002',
      email: 'b@gmail.com',
      date_of_entry: '2024-10-15',
      status: 'Đang học'
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

