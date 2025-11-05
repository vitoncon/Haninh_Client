import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ClassStudent, ClassStudentWithDetails } from '../models/class-student.model';

@Injectable({
  providedIn: 'root'
})
export class ClassStudentService {
  private apiUrl = 'http://localhost:10093/api/class_students';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || localStorage.getItem('accessToken') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // Lấy danh sách học viên trong lớp
  getStudentsByClass(classId: number): Observable<ClassStudentWithDetails[]> {
    const condition = JSON.stringify([{
      key: 'class_id',
      value: classId.toString(),
      compare: '='
    }]);
    const url = `${this.apiUrl}?condition=${encodeURIComponent(condition)}`;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        return data;
      })
    );
  }

  // Lấy danh sách lớp của học viên
  getClassesByStudent(studentId: number): Observable<ClassStudentWithDetails[]> {
    const condition = JSON.stringify([{
      key: 'student_id',
      value: studentId.toString(),
      compare: '='
    }]);
    const url = `${this.apiUrl}?condition=${encodeURIComponent(condition)}`;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Lấy tất cả enrollments (để tính toán dashboard)
  getAllClassStudents(): Observable<ClassStudent[]> {
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Thêm học viên vào lớp
  enrollStudent(classStudent: ClassStudent): Observable<ClassStudent> {
    return this.http.post<ClassStudent>(this.apiUrl, classStudent, this.getAuthHeaders());
  }

  // Cập nhật trạng thái học viên trong lớp
  updateStudentStatus(id: number, status: string, completionDate?: string | null): Observable<ClassStudent> {
    const updateData: any = { status };
    if (completionDate !== undefined) {
      updateData.completion_date = completionDate;
    }
    return this.http.put<ClassStudent>(`${this.apiUrl}/${id}`, updateData, this.getAuthHeaders());
  }

  // Xóa học viên khỏi lớp
  removeStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Lấy thống kê lớp học
  getClassStatistics(classId: number): Observable<{
    totalStudents: number;
    activeStudents: number;
    completedStudents: number;
    droppedStudents: number;
  }> {
    return this.getStudentsByClass(classId).pipe(
      map((students) => {
        const stats = {
          totalStudents: students.length,
          activeStudents: students.filter(s => s.status === 'Đang học').length,
          completedStudents: students.filter(s => s.status === 'Hoàn thành').length,
          droppedStudents: students.filter(s => s.status === 'Nghỉ học').length
        };
        return stats;
      })
    );
  }
}
