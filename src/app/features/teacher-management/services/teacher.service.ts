import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TeacherModel } from '../models/teacher.model';

@Injectable({
  providedIn: 'root'
})
export class TeacherService {
  private apiUrl = 'http://localhost:10093/api/teachers';

  constructor(private http: HttpClient) {}

  /** Lấy header có token xác thực */
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  /** Lấy danh sách giảng viên */
  getTeachers(q?: string): Observable<TeacherModel[]> {
    const url = q && q.trim().length > 0 ? `${this.apiUrl}?q=${encodeURIComponent(q.trim())}` : this.apiUrl;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  /** Lấy thông tin chi tiết giảng viên theo ID */
  getTeacherById(id: number): Observable<TeacherModel> {
    return this.http.get<TeacherModel>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  /** Thêm mới giảng viên */
  addTeacher(teacher: TeacherModel): Observable<TeacherModel> {
    return this.http.post<TeacherModel>(this.apiUrl, teacher, this.getAuthHeaders());
  }

  /** Cập nhật thông tin giảng viên */
  updateTeacher(id: number, teacher: TeacherModel): Observable<TeacherModel> {
    return this.http.put<TeacherModel>(`${this.apiUrl}/${id}`, teacher, this.getAuthHeaders());
  }

  /** Xóa giảng viên */
  deleteTeacher(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
