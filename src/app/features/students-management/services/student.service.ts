import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { StudentsModel, StudentFilters, StudentStatistics } from '../models/students.model';
import { StudentCurrentClasses, StudentOverviewStats } from '../models/student-detail.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = 'http://localhost:10093/api/students';

  constructor(private http: HttpClient) {}

  /** Lấy header có token xác thực */
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  /** API: Lấy danh sách học sinh */
  getStudents(filters?: StudentFilters): Observable<any> {
    let url = this.apiUrl;
    const params = new URLSearchParams();
    
    if (filters) {
      // Nếu có filter theo ID, chuyển thành condition array
      if (filters.id) {
        const condition = JSON.stringify([{
          key: 'id',
          value: filters.id.toString(),
          compare: '='
        }]);
        params.append('condition', condition);
      } else {
        // Các filter khác xử lý như bình thường
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '' && key !== 'id') {
            params.append(key, value.toString());
          }
        });
      }
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy thông tin chi tiết học sinh theo ID */
  getStudentById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Thêm mới học sinh */
  addStudent(student: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, student, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Cập nhật thông tin học sinh */
  updateStudent(id: number, student: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, student, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Xóa học sinh */
  deleteStudent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy lớp học hiện tại của học viên */
  getCurrentClasses(studentId: number): Observable<StudentCurrentClasses[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${studentId}/current-classes`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy thống kê tổng quan của học viên */
  getOverviewStats(studentId: number): Observable<StudentOverviewStats> {
    return this.http.get<any>(`${this.apiUrl}/${studentId}/overview-stats`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy lớp học của học viên từ class_students */
  getClassStudents(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/class_students';
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy lớp học của học viên với thông tin đầy đủ (bao gồm tên lớp, giáo viên, khóa học) */
  getClassStudentsWithDetails(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/class_students';
    const params = new URLSearchParams();

    if (filters) {
      // Xử lý filter theo student_id với condition array
      if (filters.student_id) {
        const condition = JSON.stringify([{
          key: 'student_id',
          value: filters.student_id.toString(),
          compare: '='
        }]);
        params.append('condition', condition);
      }
      
      // 🚀 OPTIMIZED: Server-side join trong 1 API call
      params.append('join', 'class');
      params.append('join', 'course');
      params.append('join', 'teacher');
      
      // Xử lý các filter khác
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'student_id') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }


    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy danh sách classes với filter student_id */
  getClasses(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/classes';
    const params = new URLSearchParams();

    if (filters) {
      // Xử lý filter theo student_id với condition array
      if (filters.student_id) {
        const condition = JSON.stringify([{
          key: 'student_id',
          value: filters.student_id.toString(),
          compare: '='
        }]);
        params.append('condition', condition);
      }
      
      // Xử lý các filter khác
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'student_id') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService getClasses Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy kết quả học tập của học viên */
  getStudyResults(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/study-results';
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy chứng chỉ của học viên */
  getStudentCertificates(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/student_certificates';
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy teaching assignments theo class_ids */
  getTeachingAssignments(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/teaching-assignments';
    const params = new URLSearchParams();

    if (filters) {
      // Xử lý filter theo class_ids với IN clause
      if (filters.class_ids && Array.isArray(filters.class_ids) && filters.class_ids.length > 0) {
        const condition = JSON.stringify([{
          key: 'class_id',
          value: filters.class_ids.join(','),
          compare: 'in'
        }]);
        params.append('condition', condition);
      }
      
      // Xử lý các filter khác
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && key !== 'class_ids') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService getTeachingAssignments Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy teachers theo IDs */
  getTeachersByIds(ids: number[]): Observable<any> {
    const condition = JSON.stringify([{
      key: 'id',
      value: ids.join(','),
      compare: 'in'
    }]);
    
    const url = `http://localhost:10093/api/teachers?condition=${encodeURIComponent(condition)}`;
    
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('StudentService getTeachersByIds Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy class schedules để tìm teacher_id làm fallback */
  getClassSchedules(filters?: any): Observable<any> {
    let url = 'http://localhost:10093/api/class_schedules';
    const params = new URLSearchParams();

    if (filters) {
      if (filters.class_ids && Array.isArray(filters.class_ids) && filters.class_ids.length > 0) {
        const condition = JSON.stringify([{
          key: 'class_id',
          value: filters.class_ids.join(','),
          compare: 'in'
        }]);
        params.append('condition', condition);
      }
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res),
      catchError((error) => {
        console.error('StudentService getClassSchedules Error:', error);
        return of([]);
      })
    );
  }

  /** API: Lấy teacher assignments từ class_teachers table */
  getClassTeachers(classIds: number[]): Observable<any> {
    let url = 'http://localhost:10093/api/class_teachers';
    const params = new URLSearchParams();

    if (classIds.length > 0) {
      const condition = JSON.stringify([{
        key: 'class_id',
        value: classIds.join(','),
        compare: 'in'
      }]);
      params.append('condition', condition);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res),
      catchError((error) => {
        console.error('StudentService getClassTeachers Error:', error);
        return of([]);
      })
    );
  }

}
