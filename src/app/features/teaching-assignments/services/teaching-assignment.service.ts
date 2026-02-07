import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  TeachingAssignment,
  TeachingAssignmentWithDetails,
  TeachingAssignmentFilters,
  ClassPermission,
  ClassTeacherAssignment
} from '../models/teaching-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class TeachingAssignmentService {

  // ================= MOCK MASTER =================

  private teachers = [
    { id: 1, name: 'Nguyễn Văn Hạo', email: 'hao@center.vn', phone: '0901111111' },
    { id: 2, name: 'Trần Thị Mai', email: 'mai@center.vn', phone: '0902222222' },
    { id: 3, name: 'Park Min Soo', email: 'park@center.vn', phone: '0903333333' }
  ];

  private classes = [
    { id: 101, name: 'HSK 3 K1', code: 'HSK3-K1', course: 'Tiếng Trung' },
    { id: 102, name: 'JLPT N3 K2', code: 'N3-K2', course: 'Tiếng Nhật' },
    { id: 103, name: 'TOPIK 2 K1', code: 'TOPIK2-K1', course: 'Tiếng Hàn' }
  ];

  // ================= CLASS TEACHER =================

  private classTeachers: ClassTeacherAssignment[] = [
    {
      id: 1,
      class_id: 101,
      teacher_id: 1,
      role: 'Giáo viên giảng dạy',
      assign_date: '2025-01-01',
      status: 'Đang dạy',
      teacher_name: 'Nguyễn Văn Hạo',
      class_name: 'HSK 3 K1',
      class_code: 'HSK3-K1',
      course_name: 'Tiếng Trung'
    }
  ];

  // ================= TEACHING ASSIGNMENTS =================

  private assignments: TeachingAssignmentWithDetails[] = [
    {
      id: 1,
      teacher_id: 1,
      class_id: 101,
      subject: 'HSK Nghe',
      schedule: 'Thứ 2 - Thứ 4',
      room: 'A101',
      status: 'Dang day',
      start_date: '2025-01-01',

      teacher_name: 'Nguyễn Văn Hạo',
      teacher_email: 'hao@center.vn',
      class_name: 'HSK 3 K1',
      class_code: 'HSK3-K1',
      course_name: 'Tiếng Trung'
    }
  ];

  // ================= BASIC GET =================

  getTeachingAssignments(q?: string): Observable<TeachingAssignment[]> {

    let data = [...this.assignments];

    if (q) {
      const keyword = q.toLowerCase();
      data = data.filter(x =>
        x.subject?.toLowerCase().includes(keyword) ||
        x.teacher_name?.toLowerCase().includes(keyword) ||
        x.class_name?.toLowerCase().includes(keyword)
      );
    }

    return of(data);
  }

  getTeachingAssignmentsWithDetails(filters?: TeachingAssignmentFilters)
    : Observable<TeachingAssignmentWithDetails[]> {

    let data = [...this.assignments];

    if (filters?.teacher_id) {
      data = data.filter(x => x.teacher_id === filters.teacher_id);
    }

    if (filters?.class_id) {
      data = data.filter(x => x.class_id === filters.class_id);
    }

    if (filters?.subject) {
      data = data.filter(x => x.subject === filters.subject);
    }

    if (filters?.status) {
      data = data.filter(x => x.status === filters.status);
    }

    if (filters?.search) {
      const k = filters.search.toLowerCase();
      data = data.filter(x =>
        x.subject?.toLowerCase().includes(k) ||
        x.teacher_name?.toLowerCase().includes(k)
      );
    }

    return of(data);
  }

  getTeachingAssignmentById(id: number): Observable<TeachingAssignment> {
    const found = this.assignments.find(x => x.id === id);
    return of(found as TeachingAssignment);
  }

  getTeachingAssignmentsByTeacher(teacherId: number)
    : Observable<TeachingAssignmentWithDetails[]> {

    return of(this.assignments.filter(x => x.teacher_id === teacherId));
  }

  getTeachingAssignmentsByClass(classId: number)
    : Observable<TeachingAssignmentWithDetails[]> {

    return of(this.assignments.filter(x => x.class_id === classId));
  }

  // ================= CRUD =================

  addTeachingAssignment(a: TeachingAssignment): Observable<TeachingAssignment> {

    const newItem: any = {
      ...a,
      id: Date.now(),
      created_at: new Date().toISOString()
    };

    this.assignments.push(newItem);
    return of(newItem);
  }

  updateTeachingAssignment(id: number, a: TeachingAssignment)
    : Observable<TeachingAssignment> {

    const index = this.assignments.findIndex(x => x.id === id);

    if (index >= 0) {
      this.assignments[index] = {
        ...this.assignments[index],
        ...a,
        updated_at: new Date().toISOString()
      };
    }

    return of(this.assignments[index]);
  }

  deleteTeachingAssignment(id: number): Observable<void> {
    this.assignments = this.assignments.filter(x => x.id !== id);
    return of(void 0);
  }

  // ================= DROPDOWN =================

  getSubjects() {
    return [
      { label: 'HSK', value: 'HSK' },
      { label: 'JLPT', value: 'JLPT' },
      { label: 'TOPIK', value: 'TOPIK' },
      { label: 'Ngữ pháp', value: 'Ngữ pháp' },
      { label: 'Nghe', value: 'Nghe' },
      { label: 'Nói', value: 'Nói' }
    ];
  }

  getStatusOptions() {
    return [
      { label: 'Đang dạy', value: 'Dang day' },
      { label: 'Tạm dừng', value: 'Tam dừng' },
      { label: 'Hoàn thành', value: 'Hoàn thành' },
      { label: 'Đã hủy', value: 'Đã hủy' }
    ];
  }

  // ================= CLASS TEACHER =================

  getAllClassTeacherAssignments(): Observable<ClassTeacherAssignment[]> {
    return of(this.classTeachers);
  }

  getTeacherClassAssignments(teacherId: number)
    : Observable<ClassTeacherAssignment[]> {

    return of(this.classTeachers.filter(x => x.teacher_id === teacherId));
  }

  addClassTeacherAssignment(a: ClassTeacherAssignment)
    : Observable<ClassTeacherAssignment> {

    const newItem = {
      ...a,
      id: Date.now()
    };

    this.classTeachers.push(newItem);
    return of(newItem);
  }

  createClassTeacherAssignment(a: ClassTeacherAssignment)
    : Observable<ClassTeacherAssignment> {

    return this.addClassTeacherAssignment(a);
  }

  updateClassTeacherAssignment(id: number, a: ClassTeacherAssignment)
    : Observable<ClassTeacherAssignment> {

    const index = this.classTeachers.findIndex(x => x.id === id);

    if (index >= 0) {
      this.classTeachers[index] = {
        ...this.classTeachers[index],
        ...a
      };
    }

    return of(this.classTeachers[index]);
  }

  deleteClassTeacherAssignment(id: number): Observable<void> {
    this.classTeachers = this.classTeachers.filter(x => x.id !== id);
    return of(void 0);
  }

  getClassTeacherAssignments(classId: number)
    : Observable<ClassTeacherAssignment[]> {

    return of(this.classTeachers.filter(x => x.class_id === classId));
  }

  // ================= PERMISSION =================

  getTeacherPermissions(teacherId: number): Observable<ClassPermission[]> {

    const data: ClassPermission[] = this.classes.map(c => ({
      class_id: c.id,
      class_name: c.name,
      can_assign_homework: true,
      can_grade_assignments: true,
      can_manage_students: teacherId === 1
    }));

    return of(data);
  }

  saveTeacherPermissions(
    teacherId: number,
    permissions: ClassPermission[]
  ): Observable<any> {

    return of({ success: true });
  }

  // ================= OPTIONS =================

  getRoleOptions() {
    return [
      { label: 'Giáo viên chủ nhiệm', value: 'Giáo viên chủ nhiệm' },
      { label: 'Giáo viên giảng dạy', value: 'Giáo viên giảng dạy' },
      { label: 'Trợ giảng', value: 'Trợ giảng' }
    ];
  }

  getClassTeacherStatusOptions() {
    return [
      { label: 'Đang dạy', value: 'Đang dạy' },
      { label: 'Hoàn thành', value: 'Hoàn thành' },
      { label: 'Nghỉ dạy', value: 'Nghỉ dạy' }
    ];
  }

}
