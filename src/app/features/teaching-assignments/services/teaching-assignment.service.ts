import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { TeachingAssignment, TeachingAssignmentWithDetails, TeachingAssignmentFilters, ClassPermission, ClassTeacherAssignment } from '../models/teaching-assignment.model';

@Injectable({
  providedIn: 'root'
})
export class TeachingAssignmentService {
  private apiUrl = 'http://localhost:10093/api/teaching-assignments';
  private classTeachersUrl = 'http://localhost:10093/api/class_teachers';
  private destroyUrl = 'http://localhost:10093/api/destroy';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  getTeachingAssignments(q?: string): Observable<TeachingAssignment[]> {
    const url = q && q.trim().length > 0 ? `${this.apiUrl}?q=${encodeURIComponent(q.trim())}` : this.apiUrl;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getTeachingAssignmentsWithDetails(filters?: TeachingAssignmentFilters): Observable<TeachingAssignmentWithDetails[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.teacher_id) params = params.set('teacher_id', filters.teacher_id.toString());
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.subject) params = params.set('subject', filters.subject);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.start_date) params = params.set('start_date', filters.start_date);
      if (filters.end_date) params = params.set('end_date', filters.end_date);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getTeachingAssignmentById(id: number): Observable<TeachingAssignment> {
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
          const assignment = data.find(a => a.id === id);
          if (assignment) {
            return assignment;
          }
        }
        throw new Error('Teaching Assignment not found');
      })
    );
  }

  getTeachingAssignmentsByTeacher(teacherId: number): Observable<TeachingAssignmentWithDetails[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "teacher_id",
      value: teacherId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.apiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getTeachingAssignmentsByClass(classId: number): Observable<TeachingAssignmentWithDetails[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "class_id",
      value: classId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.apiUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  addTeachingAssignment(assignment: TeachingAssignment): Observable<TeachingAssignment> {
    return this.http.post<TeachingAssignment>(this.apiUrl, assignment, this.getAuthHeaders());
  }

  updateTeachingAssignment(id: number, assignment: TeachingAssignment): Observable<TeachingAssignment> {
    return this.http.put<TeachingAssignment>(`${this.apiUrl}/${id}`, assignment, this.getAuthHeaders());
  }

  deleteTeachingAssignment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Helper methods for dropdowns
  getSubjects(): any[] {
    return [
      { label: 'Tiếng Anh Giao Tiếp', value: 'Tiếng Anh Giao Tiếp' },
      { label: 'Tiếng Anh Thương Mại', value: 'Tiếng Anh Thương Mại' },
      { label: 'Tiếng Anh Du Lịch', value: 'Tiếng Anh Du Lịch' },
      { label: 'Tiếng Anh Học Thuật', value: 'Tiếng Anh Học Thuật' },
      { label: 'IELTS', value: 'IELTS' },
      { label: 'TOEIC', value: 'TOEIC' },
      { label: 'TOEFL', value: 'TOEFL' },
      { label: 'Tiếng Hàn Cơ Bản', value: 'Tiếng Hàn Cơ Bản' },
      { label: 'Tiếng Hàn Trung Cấp', value: 'Tiếng Hàn Trung Cấp' },
      { label: 'Tiếng Hàn Cao Cấp', value: 'Tiếng Hàn Cao Cấp' },
      { label: 'Tiếng Trung Cơ Bản', value: 'Tiếng Trung Cơ Bản' },
      { label: 'Tiếng Trung Trung Cấp', value: 'Tiếng Trung Trung Cấp' },
      { label: 'Tiếng Trung Cao Cấp', value: 'Tiếng Trung Cao Cấp' },
      { label: 'HSK', value: 'HSK' },
      { label: 'Ngữ Pháp', value: 'Ngữ Pháp' },
      { label: 'Từ Vựng', value: 'Từ Vựng' },
      { label: 'Phát Âm', value: 'Phát Âm' },
      { label: 'Luyện Thi', value: 'Luyện Thi' }
    ];
  }

  getStatusOptions() {
    return [
      { label: 'Đang dạy', value: 'Đang dạy' },
      { label: 'Tạm dừng', value: 'Tạm dừng' },
      { label: 'Hoàn thành', value: 'Hoàn thành' },
      { label: 'Đã hủy', value: 'Đã hủy' }
    ];
  }

  // Class Teacher Assignment Methods (based on class_teachers table)
  getAllClassTeacherAssignments(): Observable<ClassTeacherAssignment[]> {
    return this.http.get<any>(this.classTeachersUrl, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  getTeacherClassAssignments(teacherId: number): Observable<ClassTeacherAssignment[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "teacher_id",
      value: teacherId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.classTeachersUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  addClassTeacherAssignment(assignment: ClassTeacherAssignment): Observable<ClassTeacherAssignment> {
    return this.http.post<ClassTeacherAssignment>(this.classTeachersUrl, assignment, this.getAuthHeaders());
  }

  createClassTeacherAssignment(assignment: ClassTeacherAssignment): Observable<ClassTeacherAssignment> {
    return this.http.post<ClassTeacherAssignment>(this.classTeachersUrl, assignment, this.getAuthHeaders());
  }

  updateClassTeacherAssignment(id: number, assignment: ClassTeacherAssignment): Observable<ClassTeacherAssignment> {
    return this.http.put<ClassTeacherAssignment>(`${this.classTeachersUrl}/${id}`, assignment, this.getAuthHeaders());
  }

  deleteClassTeacherAssignment(id: number): Observable<void> {
    // Use destroy endpoint for hard delete instead of soft delete
    // Try endpoint router first (uses GuardMiddleware): /api/class_teachers/destroy/{id}
    const endpointUrl = `${this.classTeachersUrl}/destroy/${id}`;
    
    return this.http.delete<void>(endpointUrl, this.getAuthHeaders()).pipe(
      catchError(error => {
        // Fallback to destroy router: /api/destroy/class_teachers/{id}
        const destroyUrl = `${this.destroyUrl}/class_teachers/${id}`;
        return this.http.delete<void>(destroyUrl, this.getAuthHeaders()).pipe(
          catchError(fallbackError => {
            return throwError(() => fallbackError);
          })
        );
      })
    );
  }

  // Permission management methods
  getTeacherPermissions(teacherId: number): Observable<ClassPermission[]> {
    // This should return the permissions for a teacher across all classes
    // You might need to adjust the API endpoint based on your backend implementation
    return this.http.get<any>(`${this.apiUrl}/permissions/${teacherId}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  saveTeacherPermissions(teacherId: number, permissions: ClassPermission[]): Observable<any> {
    // Save the permissions for a teacher
    return this.http.post<any>(`${this.apiUrl}/permissions/${teacherId}`, { permissions }, this.getAuthHeaders());
  }

  // Get class teacher assignments for a specific class
  getClassTeacherAssignments(classId: number): Observable<ClassTeacherAssignment[]> {
    const condition = encodeURIComponent(JSON.stringify([{
      key: "class_id",
      value: classId.toString(),
      compare: "=",
      orWhere: "and"
    }]));
    
    return this.http.get<any>(`${this.classTeachersUrl}?condition=${condition}`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Role options for class teacher assignments
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