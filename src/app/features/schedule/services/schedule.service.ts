import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ScheduleModel } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = 'http://localhost:10093/api/schedules';

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

  getSchedules(): Observable<ScheduleModel[]> {
    return this.http.get<any>(this.apiUrl, this.getAuthHeaders()).pipe(
      map(res => res?.data ?? res)
    );
  }

  getScheduleById(id: number): Observable<ScheduleModel> {
    return this.http.get<ScheduleModel>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  addSchedule(schedule: ScheduleModel): Observable<ScheduleModel> {
    return this.http.post<ScheduleModel>(this.apiUrl, schedule, this.getAuthHeaders());
  }

  updateSchedule(id: number, schedule: ScheduleModel): Observable<ScheduleModel> {
    return this.http.put<ScheduleModel>(`${this.apiUrl}/${id}`, schedule, this.getAuthHeaders());
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
