import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ClassModel } from '../models/class.model';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private apiUrl = 'http://localhost:10093/api/classes';

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

  getClasses(q?: string): Observable<ClassModel[]> {
    const url = q && q.trim().length > 0 ? `${this.apiUrl}?q=${encodeURIComponent(q.trim())}` : this.apiUrl;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)  // nếu API trả về { data: [...] }
    );
  }

  getClassById(id: number): Observable<ClassModel> {
    // Sử dụng condition parameter thay vì endpoint không tồn tại
    const condition = JSON.stringify([{
      key: 'id',
      value: id.toString(),
      compare: '='
    }]);
    const url = `${this.apiUrl}?condition=${encodeURIComponent(condition)}`;
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        // Trả về item đầu tiên vì chỉ có 1 class với ID này
        return Array.isArray(data) ? data[0] : data;
      })
    );
  }

  getClassesByIds(ids: number[]): Observable<ClassModel[]> {
    // Lấy nhiều classes theo danh sách IDs
    // Sử dụng whereIn condition để lấy tất cả classes có ID trong danh sách
    const condition = JSON.stringify([{
      key: 'id',
      value: ids.join(','),
      compare: 'in'
    }]);
    
    const url = `${this.apiUrl}?condition=${encodeURIComponent(condition)}`;
    
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map((res) => {
        const data = res?.data ?? res;
        return data;
      })
    );
  }

  addClass(classItem: ClassModel): Observable<ClassModel> {
    return this.http.post<ClassModel>(this.apiUrl, classItem, this.getAuthHeaders());
  }

  updateClass(id: number, classItem: ClassModel): Observable<ClassModel> {
    return this.http.put<ClassModel>(`${this.apiUrl}/${id}`, classItem, this.getAuthHeaders());
  }

  deleteClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Create class with schedule generation
  createClassWithSchedule(classData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/with-schedule`, classData, this.getAuthHeaders());
  }
}
