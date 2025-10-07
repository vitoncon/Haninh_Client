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
    const token = localStorage.getItem('accessToken') || '';
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
    return this.http.get<ClassModel>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
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
}
