import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StudentsModel, StudentFilters } from '../models/students.model';

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
      date_of_birth: '2003-05-10',
      email: 'an@gmail.com',
      phone: '0901111111',
      address: 'Thái Nguyên',
      status: 'Đang học'
    },
    {
      id: 2,
      student_code: 'HV002',
      full_name: 'Trần Thị Bình',
      gender: 'Nữ',
      date_of_birth: '2004-02-20',
      email: 'binh@gmail.com',
      phone: '0902222222',
      address: 'Hà Nội',
      status: 'Đang học'
    },
    {
      id: 3,
      student_code: 'HV003',
      full_name: 'Lê Văn Cường',
      gender: 'Nam',
      date_of_birth: '2002-11-01',
      email: 'cuong@gmail.com',
      phone: '0903333333',
      address: 'Bắc Ninh',
      status: 'Tạm dừng'
    },
    {
      id: 4,
      student_code: 'HV004',
      full_name: 'Phạm Thị Dung',
      gender: 'Nữ',
      date_of_birth: '2005-01-15',
      email: 'dung@gmail.com',
      phone: '0904444444',
      address: 'Hải Phòng',
      status: 'Hoàn thành'
    }
  ];

  // ================= API MOCK =================

  /** Quan trọng: PHẢI có filters optional */
  getStudents(filters?: StudentFilters): Observable<any> {

    let data = [...this.mockStudents];

    if (filters) {

      if (filters.id) {
        data = data.filter(x => x.id === filters.id);
      }

      if (filters.gender) {
        data = data.filter(x => x.gender === filters.gender);
      }

      if (filters.status) {
        data = data.filter(x => x.status === filters.status);
      }

      if (filters.search) {
        const keyword = filters.search.toLowerCase();
        data = data.filter(x =>
          x.full_name.toLowerCase().includes(keyword) ||
          x.student_code.toLowerCase().includes(keyword)
        );
      }
    }

    return of({ data });
  }

  getStudentById(id: number): Observable<any> {
    const found = this.mockStudents.find(x => x.id === id);
    return of({ data: found });
  }

  addStudent(student: StudentsModel): Observable<any> {
    student.id = Date.now();
    this.mockStudents.push(student);
    return of(student);
  }

  updateStudent(id: number, student: StudentsModel): Observable<any> {
    const index = this.mockStudents.findIndex(x => x.id === id);
    if (index !== -1) this.mockStudents[index] = student;
    return of(student);
  }

  deleteStudent(id: number): Observable<any> {
    this.mockStudents = this.mockStudents.filter(x => x.id !== id);
    return of(true);
  }

  // ================= Các API phụ =================

  getClassTeachers(classIds: number[]): Observable<any> {
    return of([]);
  }

  getClassSchedules(filters?: any): Observable<any> {
    return of([]);
  }

  getTeachersByIds(ids: number[]): Observable<any> {
    return of([]);
  }

}
