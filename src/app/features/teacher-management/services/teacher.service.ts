import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { TeacherModel, TeacherFilters, TeacherStatistics } from '../models/teacher.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private apiUrl = 'http://localhost:10093/api/teachers';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  getTeachers(filters?: TeacherFilters): Observable<TeacherModel[]> {
    let params = new HttpParams();
    
    if (filters?.search) {
      params = params.set('q', filters.search);
    }
    
    if (filters?.department) {
      params = params.set('department', filters.department);
    }
    
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    
    if (filters?.degree) {
      params = params.set('degree', filters.degree);
    }
    
    if (filters?.minExperience != null) {
      params = params.set('minExperience', String(filters.minExperience));
    }
    
    if (filters?.maxExperience != null) {
      params = params.set('maxExperience', String(filters.maxExperience));
    }

    return this.http.get<any>(this.apiUrl, { ...this.getAuthHeaders(), params }).pipe(
      map((res) => res?.data ?? res),
      catchError((error) => {
        console.error('Error fetching teachers:', error);
        throw error;
      })
    );
  }

  /** Lấy teachers theo conditions tùy chỉnh (backend generic API) */
  getTeachersByConditions(conditions: any[]): Observable<TeacherModel[]> {
    const conditionJson = encodeURIComponent(JSON.stringify(conditions || []));
    const url = `${this.apiUrl}?condition=${conditionJson}`;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res),
      catchError((error) => {
        console.error('Error fetching teachers by conditions:', error);
        throw error;
      })
    );
  }

  getTeacherById(id: number): Observable<TeacherModel> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "id",
      value: id.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.apiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        if (Array.isArray(data)) {
          const teacher = data.find(t => t.id === id);
          if (teacher) {
            return teacher;
          }
        }
        throw new Error('Teacher not found');
      }),
      catchError((error) => {
        console.error('Error fetching teacher by ID:', error);
        throw error;
      })
    );
  }

  addTeacher(teacher: TeacherModel): Observable<TeacherModel> {
    // Auto-generate teacher code if not provided
    if (!teacher.teacher_code) {
      teacher.teacher_code = this.generateTeacherCode();
    }
    
    return this.http.post<TeacherModel>(this.apiUrl, teacher, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('Error adding teacher:', error);
        throw error;
      })
    );
  }

  updateTeacher(id: number, teacher: TeacherModel): Observable<TeacherModel> {
    return this.http.put<TeacherModel>(`${this.apiUrl}/${id}`, teacher, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('Error updating teacher:', error);
        throw error;
      })
    );
  }

  deleteTeacher(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('Error deleting teacher:', error);
        throw error;
      })
    );
  }

  getTeacherStatistics(): Observable<TeacherStatistics> {
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map((res) => {
        const teachers = res?.data ?? res;
        if (Array.isArray(teachers)) {
          return this.calculateTeacherStatistics(teachers);
        }
        return this.getDefaultStatistics();
      }),
      catchError((error) => {
        console.error('Error fetching teacher statistics:', error);
        return [this.getDefaultStatistics()];
      })
    );
  }

  private calculateTeacherStatistics(teachers: any[]): TeacherStatistics {
    const total_teachers = teachers.length;
    const active_teachers = teachers.filter(t => t.status === 'Đang dạy').length;
    const inactive_teachers = teachers.filter(t => t.status === 'Đã nghỉ').length;
    const on_leave_teachers = teachers.filter(t => t.status === 'Tạm nghỉ').length;
    
    const experienceSum = teachers.reduce((sum, t) => sum + (t.experience_years || 0), 0);
    const average_experience = total_teachers > 0 ? Math.round(experienceSum / total_teachers * 10) / 10 : 0;

    // Department distribution
    const departmentCount = teachers.reduce((acc, t) => {
      const dept = t.department || 'Chưa xác định';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const department_distribution = Object.entries(departmentCount).map(([department, count]) => ({
      department,
      count: count as number
    }));

    // Degree distribution
    const degreeCount = teachers.reduce((acc, t) => {
      const degree = t.degree || 'Chưa xác định';
      acc[degree] = (acc[degree] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const degree_distribution = Object.entries(degreeCount).map(([degree, count]) => ({
      degree,
      count: count as number
    }));

    // Experience distribution
    const experienceRanges = [
      { range: '0-2 năm', min: 0, max: 2 },
      { range: '3-5 năm', min: 3, max: 5 },
      { range: '6-10 năm', min: 6, max: 10 },
      { range: 'Trên 10 năm', min: 11, max: Infinity }
    ];
    const experience_distribution = experienceRanges.map(({ range, min, max }) => ({
      range,
      count: teachers.filter(t => {
        const exp = t.experience_years || 0;
        return exp >= min && exp <= max;
      }).length
    }));

    return {
      total_teachers,
      active_teachers,
      inactive_teachers,
      on_leave_teachers,
      average_experience,
      department_distribution,
      degree_distribution,
      experience_distribution
    };
  }

  private getDefaultStatistics(): TeacherStatistics {
    return {
      total_teachers: 0,
      active_teachers: 0,
      inactive_teachers: 0,
      on_leave_teachers: 0,
      average_experience: 0,
      department_distribution: [],
      degree_distribution: [],
      experience_distribution: []
    };
  }


  validateTeacherCode(code: string): Observable<boolean> {
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map((res) => {
        const teachers = res?.data ?? res;
        if (Array.isArray(teachers)) {
          // Check if code already exists
          const existingTeacher = teachers.find((teacher: any) => teacher.teacher_code === code);
          return !existingTeacher; // Return true if code is available (not found)
        }
        return true; // If no data, assume code is available
      }),
      catchError((error) => {
        console.error('Error validating teacher code:', error);
        return [true]; // If error, assume code is available
      })
    );
  }

  generateTeacherCode(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `GV${timestamp}${random}`;
  }

}
