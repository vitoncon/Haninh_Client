import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = '/api/attendance';

  constructor(private http: HttpClient) {}

  markAttendance(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark`, data);
  }

  getTeacherClasses(): Observable<any> {
    return this.http.get(`${this.apiUrl}/teacher/classes`).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getAttendanceByClass(classId: number, date?: string): Observable<any> {

    return this.http.post(`${this.apiUrl}/class/${classId}`, { date }).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getAttendanceByStudent(studentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/student/${studentId}`, {}).pipe(
      map((res: any) => res?.data ?? res)
    );
  }

  getAttendanceAnalytics(filters: any = {}): Observable<any> {
    return this.http.post(`${this.apiUrl}/analytics`, filters);
  }
}
