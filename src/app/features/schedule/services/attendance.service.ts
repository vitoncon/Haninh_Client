import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface AttendanceModel {
  id?: number;
  class_id?: number;
  student_id: number;
  schedule_id: number;
  status: string; // 'Có mặt', 'Vắng mặt', 'Đến muộn', 'Có phép', 'Không phép'
  note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'http://localhost:10093/api/attendance'; 

  constructor(private http: HttpClient) {}

  // Lấy điểm danh theo schedule_id
  getAttendanceBySchedule(scheduleId: number): Observable<{ data: AttendanceModel[] }> {
    return this.http.get<{ data: AttendanceModel[] }>(`${this.apiUrl}?schedule_id=${scheduleId}`);
  }

  // Cập nhật điểm danh 1 học viên
  updateAttendance(id: number, data: AttendanceModel): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  // Tạo mới điểm danh cho 1 học viên
  createAttendance(data: AttendanceModel): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }
}
