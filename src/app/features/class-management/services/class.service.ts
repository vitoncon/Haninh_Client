import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ClassModel } from '../models/class.model';

@Injectable({
  providedIn: 'root'
})
export class ClassService {

  constructor() {}

  // ================= MOCK DATA =================
  private mockClasses: ClassModel[] = [
    {
      id: 1,
      class_code: 'ENG-01',
      class_name: 'Lớp Tiếng Anh Giao Tiếp',
      course_id: 1,
      start_date: '2026-02-01',
      end_date: '2026-04-30',
      room: 'P101',
      max_students: 25,
      status: 'Đang diễn ra',
      course_name: 'English Communication Basic',
      language: 'Tiếng Anh',
      lecturers: [
        {
          id: 1,
          name: 'Nguyễn Văn A',
          email: 'a@gmail.com'
        }
      ]
    },
    {
      id: 2,
      class_code: 'KOR-01',
      class_name: 'Lớp Tiếng Hàn Sơ Cấp',
      course_id: 2,
      start_date: '2026-03-01',
      end_date: '2026-06-01',
      room: 'P202',
      max_students: 20,
      status: 'Mở đăng ký',
      course_name: 'Korean Beginner',
      language: 'Tiếng Hàn'
    },
    {
      id: 3,
      class_code: 'CHI-01',
      class_name: 'Lớp Tiếng Trung HSK1',
      course_id: 3,
      start_date: '2026-01-10',
      end_date: '2026-03-20',
      room: 'P303',
      max_students: 30,
      status: 'Hoàn thành',
      course_name: 'Chinese HSK1',
      language: 'Tiếng Trung'
    }
  ];

  // ================= GET ALL =================
  getClasses(q?: string): Observable<ClassModel[]> {
    let data = this.mockClasses;

    if (q && q.trim().length > 0) {
      const keyword = q.toLowerCase();
      data = data.filter(c =>
        c.class_name?.toLowerCase().includes(keyword) ||
        c.class_code?.toLowerCase().includes(keyword) ||
        c.course_name?.toLowerCase().includes(keyword)
      );
    }

    return of(data);
  }

  // ================= GET BY ID =================
  getClassById(id: number): Observable<ClassModel> {
    const found = this.mockClasses.find(c => c.id === id);
    return of(found as ClassModel);
  }

  // ================= GET BY IDS =================
  getClassesByIds(ids: number[]): Observable<ClassModel[]> {
    return of(this.mockClasses.filter(c => ids.includes(c.id!)));
  }

  // ================= ADD =================
  addClass(classItem: ClassModel): Observable<ClassModel> {
    const newItem = {
      ...classItem,
      id: Math.floor(Math.random() * 100000)
    };
    this.mockClasses.unshift(newItem);
    return of(newItem);
  }

  // ================= UPDATE =================
  updateClass(id: number, classItem: ClassModel): Observable<ClassModel> {
    const index = this.mockClasses.findIndex(c => c.id === id);
    if (index > -1) {
      this.mockClasses[index] = { ...classItem, id };
    }
    return of(this.mockClasses[index]);
  }

  // ================= DELETE =================
  deleteClass(id: number): Observable<void> {
    this.mockClasses = this.mockClasses.filter(c => c.id !== id);
    return of(void 0);
  }

  // ================= CREATE WITH SCHEDULE =================
  createClassWithSchedule(classData: any): Observable<any> {
    const newClass = {
      ...classData,
      id: Math.floor(Math.random() * 100000)
    };

    this.mockClasses.unshift(newClass);
    return of(newClass);
  }
}
