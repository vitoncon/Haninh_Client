import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { TeacherModel, TeacherFilters, TeacherStatistics } from '../models/teacher.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {

  // ================= MOCK DATA =================

  private teachers: TeacherModel[] = [
    {
      id: 1,
      teacher_code: 'GV001',
      teacher_name: 'Nguyễn Văn Hạo',
      gender: 'Nam',
      dob: '1990-05-12',
      phone: '0901111111',
      email: 'hao.nguyen@center.vn',
      department: 'Tiếng Trung',
      specialization: 'HSK',
      experience_years: 8,
      degree: 'Thạc sĩ',
      status: 'Đang dạy',
      avatar_url: null,
      salary: 18000000,
      hire_date: '2020-01-01',
      contract_type: 'Biên chế',
      teaching_hours_per_week: 24,
      languages: 'Trung',
      certifications: 'HSK6'
    },
    {
      id: 2,
      teacher_code: 'GV002',
      teacher_name: 'Trần Thị Mai',
      gender: 'Nữ',
      department: 'Tiếng Nhật',
      specialization: 'JLPT',
      experience_years: 5,
      degree: 'Cử nhân',
      status: 'Đang dạy',
      salary: 15000000,
      hire_date: '2022-03-01',
      contract_type: 'Hợp đồng',
      teaching_hours_per_week: 20,
      languages: 'Nhật',
      certifications: 'JLPT N1'
    },
    {
      id: 3,
      teacher_code: 'GV003',
      teacher_name: 'Park Min Soo',
      gender: 'Nam',
      department: 'Tiếng Hàn',
      specialization: 'TOPIK',
      experience_years: 10,
      degree: 'Thạc sĩ',
      status: 'Tạm nghỉ',
      salary: 22000000,
      hire_date: '2018-06-01',
      contract_type: 'Biên chế',
      teaching_hours_per_week: 22,
      languages: 'Hàn',
      certifications: 'TOPIK Level 6'
    }
  ];

  // ================= GET LIST =================

  getTeachers(filters?: TeacherFilters): Observable<TeacherModel[]> {
    let data = [...this.teachers];

    if (filters?.search) {
      const keyword = filters.search.toLowerCase();
      data = data.filter(t =>
        t.teacher_name?.toLowerCase().includes(keyword) ||
        t.teacher_code?.toLowerCase().includes(keyword)
      );
    }

    if (filters?.department) {
      data = data.filter(t => t.department === filters.department);
    }

    if (filters?.status) {
      data = data.filter(t => t.status === filters.status);
    }

    if (filters?.degree) {
      data = data.filter(t => t.degree === filters.degree);
    }

    if (filters?.minExperience != null) {
      data = data.filter(t => (t.experience_years || 0) >= filters.minExperience!);
    }

    if (filters?.maxExperience != null) {
      data = data.filter(t => (t.experience_years || 0) <= filters.maxExperience!);
    }

    return of(data);
  }

  // ================= CONDITIONS =================

  getTeachersByConditions(conditions: any[]): Observable<TeacherModel[]> {
    // Mock: trả toàn bộ (có thể nâng cấp sau)
    return of(this.teachers);
  }

  getTeacherById(id: number): Observable<TeacherModel> {
    const teacher = this.teachers.find(t => t.id === id);
    return of(teacher as TeacherModel);
  }

  // ================= CRUD =================

  addTeacher(teacher: TeacherModel): Observable<TeacherModel> {

    if (!teacher.teacher_code) {
      teacher.teacher_code = this.generateTeacherCode();
    }

    const newTeacher = {
      ...teacher,
      id: Date.now(),
      created_at: new Date().toISOString()
    };

    this.teachers.push(newTeacher);
    return of(newTeacher);
  }

  updateTeacher(id: number, teacher: TeacherModel): Observable<TeacherModel> {

    const index = this.teachers.findIndex(t => t.id === id);

    if (index >= 0) {
      this.teachers[index] = {
        ...this.teachers[index],
        ...teacher,
        updated_at: new Date().toISOString()
      };
    }

    return of(this.teachers[index]);
  }

  deleteTeacher(id: number): Observable<void> {
    this.teachers = this.teachers.filter(t => t.id !== id);
    return of(void 0);
  }

  // ================= STATISTICS =================

  getTeacherStatistics(): Observable<TeacherStatistics> {
    return of(this.calculateTeacherStatistics(this.teachers));
  }

  private calculateTeacherStatistics(teachers: TeacherModel[]): TeacherStatistics {

    const total_teachers = teachers.length;
    const active_teachers = teachers.filter(t => t.status === 'Đang dạy').length;
    const inactive_teachers = teachers.filter(t => t.status === 'Đã nghỉ').length;
    const on_leave_teachers = teachers.filter(t => t.status === 'Tạm nghỉ').length;

    const expSum = teachers.reduce((s, t) => s + (t.experience_years || 0), 0);
    const average_experience = total_teachers
      ? Math.round((expSum / total_teachers) * 10) / 10
      : 0;

    const deptMap: any = {};
    teachers.forEach(t => {
      const d = t.department || 'Chưa xác định';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });

    const degreeMap: any = {};
    teachers.forEach(t => {
      const d = t.degree || 'Chưa xác định';
      degreeMap[d] = (degreeMap[d] || 0) + 1;
    });

    const experience_distribution = [
      { range: '0-2 năm', count: teachers.filter(t => (t.experience_years || 0) <= 2).length },
      { range: '3-5 năm', count: teachers.filter(t => (t.experience_years || 0) >= 3 && (t.experience_years || 0) <= 5).length },
      { range: '6-10 năm', count: teachers.filter(t => (t.experience_years || 0) >= 6 && (t.experience_years || 0) <= 10).length },
      { range: 'Trên 10 năm', count: teachers.filter(t => (t.experience_years || 0) > 10).length }
    ];

    return {
      total_teachers,
      active_teachers,
      inactive_teachers,
      on_leave_teachers,
      average_experience,
      department_distribution: Object.keys(deptMap).map(k => ({ department: k, count: deptMap[k] })),
      degree_distribution: Object.keys(degreeMap).map(k => ({ degree: k, count: degreeMap[k] })),
      experience_distribution
    };
  }

  // ================= VALIDATE =================

  validateTeacherCode(code: string): Observable<boolean> {
    const exist = this.teachers.find(t => t.teacher_code === code);
    return of(!exist);
  }

  // ================= HELPER =================

  generateTeacherCode(): string {
    const ts = Date.now().toString().slice(-6);
    const rd = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `GV${ts}${rd}`;
  }

}
