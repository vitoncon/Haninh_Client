import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ScheduleModel } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private schedulesApiUrl = 'http://localhost:10093/api/schedules';
  private classScheduleApiUrl = 'http://localhost:10093/api/class_schedules';

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

  // Schedule template methods (for table 'schedule')
  getScheduleTemplates(): Observable<ScheduleModel[]> {
    return this.http.get<any>(this.schedulesApiUrl, this.getAuthHeaders()).pipe(
      map(res => res?.data ?? res)
    );
  }

  // Backward compatibility - returns class schedules (not schedule templates)
  getSchedules(): Observable<ScheduleModel[]> {
    return this.http.get<any>(this.classScheduleApiUrl, this.getAuthHeaders()).pipe(
      map(res => res?.data ?? res)
    );
  }

  getScheduleById(id: number): Observable<ScheduleModel> {
    return this.http.get<ScheduleModel>(`${this.schedulesApiUrl}/${id}`, this.getAuthHeaders());
  }

  addScheduleTemplate(schedule: any): Observable<ScheduleModel> {
    // Format date for server to handle timezone properly (UTC+7 for Vietnam)
    const formattedSchedule = this.formatScheduleForServer(schedule);
    return this.http.post<ScheduleModel>(this.schedulesApiUrl, formattedSchedule, this.getAuthHeaders());
  }

  updateScheduleTemplate(id: number, schedule: any): Observable<ScheduleModel> {
    // Format date for server to handle timezone properly (UTC+7 for Vietnam)
    const formattedSchedule = this.formatScheduleForServer(schedule);
    return this.http.put<ScheduleModel>(`${this.schedulesApiUrl}/${id}`, formattedSchedule, this.getAuthHeaders());
  }

  deleteScheduleTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.schedulesApiUrl}/${id}`, this.getAuthHeaders());
  }

  // Class schedule methods (for table 'class_schedule') - backward compatibility
  addSchedule(schedule: any): Observable<ScheduleModel> {
    // Format date for server to handle timezone properly (UTC+7 for Vietnam)
    const formattedSchedule = this.formatScheduleForServer(schedule);
    return this.http.post<ScheduleModel>(this.classScheduleApiUrl, formattedSchedule, this.getAuthHeaders());
  }

  updateSchedule(id: number, schedule: any): Observable<ScheduleModel> {
    // Format date for server to handle timezone properly (UTC+7 for Vietnam)
    const formattedSchedule = this.formatScheduleForServer(schedule);
    return this.http.put<ScheduleModel>(`${this.classScheduleApiUrl}/${id}`, formattedSchedule, this.getAuthHeaders());
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.classScheduleApiUrl}/${id}`, this.getAuthHeaders());
  }

  // Create class schedules for a specific class
  createClassSchedules(classId: number, scheduleData: any): Observable<any> {
    // Format date for server to handle timezone properly (UTC+7 for Vietnam)
    const formattedScheduleData = this.formatScheduleForServer(scheduleData);
    return this.http.post<any>(this.classScheduleApiUrl, {
      class_id: classId,
      ...formattedScheduleData
    }, this.getAuthHeaders());
  }

  // Get class schedules by class ID (only active ones)
  getClassSchedulesByClass(classId: number): Observable<any[]> {
    if (!classId || classId <= 0) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    
    const condition = JSON.stringify([{
      key: 'class_id',
      value: classId.toString(),
      compare: '='
    }]);
    const url = `${this.classScheduleApiUrl}?condition=${encodeURIComponent(condition)}`;
    
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map(res => {
        const data = res?.data ?? res;
        return data;
      })
    );
  }

  // Get ALL class schedules by class ID (including deleted ones)
  getAllClassSchedulesByClass(classId: number): Observable<any[]> {
    if (!classId || classId <= 0) {
      return new Observable(observer => {
        observer.next([]);
        observer.complete();
      });
    }
    
    const condition = JSON.stringify([
      {
        key: 'class_id',
        value: classId.toString(),
        compare: '='
      },
      {
        key: 'include_deleted',
        value: 'true',
        compare: '='
      }
    ]);
    const url = `${this.classScheduleApiUrl}?condition=${encodeURIComponent(condition)}`;
    
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      map(res => {
        const data = res?.data ?? res;
        return data;
      })
    );
  }

  // Get class schedule by ID
  getClassScheduleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.classScheduleApiUrl}/${id}`, this.getAuthHeaders());
  }

  // Get all class schedules
  getClassSchedules(): Observable<any[]> {
    return this.http.get<any>(this.classScheduleApiUrl, this.getAuthHeaders()).pipe(
      map(res => res?.data ?? res)
    );
  }

  // Helper method to format schedule data for server with timezone handling
  private formatScheduleForServer(schedule: any): any {
    const formattedSchedule = { ...schedule };
    
    // Format date fields if they exist
    if (formattedSchedule.date) {
      formattedSchedule.date = this.formatDateForServer(formattedSchedule.date);
    }
    
    if (formattedSchedule.start_date) {
      formattedSchedule.start_date = this.formatDateForServer(formattedSchedule.start_date);
    }
    
    if (formattedSchedule.end_date) {
      formattedSchedule.end_date = this.formatDateForServer(formattedSchedule.end_date);
    }
    
    return formattedSchedule;
  }

  // Helper method to format date for server with explicit Vietnam timezone (UTC+7)
  private formatDateForServer(dateValue: any): string {
    // Use the new ensureVietnamDate method to handle all cases properly
    return this.ensureVietnamDate(dateValue);
  }

  // Helper method to convert any date to Vietnam timezone (UTC+7)
  private convertToVietnamTimezone(date: Date): Date {
    // Get the date in Vietnam timezone
    const vietnamOffset = 7 * 60; // Vietnam is UTC+7 (7 hours = 420 minutes)
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const vietnamTime = new Date(utc + (vietnamOffset * 60000));
    return vietnamTime;
  }

  // Helper method to ensure date is interpreted as Vietnam date
  private ensureVietnamDate(dateValue: any): string {
    if (!dateValue) return '';
    
    // If it's a string in YYYY-MM-DD format, treat it as Vietnam date
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    
    // If it's a Date object, treat it as Vietnam date by using local date components
    if (dateValue instanceof Date) {
      // Use the local date components directly (this is what user selected)
      const year = dateValue.getFullYear();
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const day = String(dateValue.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // For other formats, try to parse and convert
    try {
      const parsedDate = new Date(dateValue);
      return this.ensureVietnamDate(parsedDate);
    } catch (error) {
      console.error('Invalid date format:', dateValue);
      return String(dateValue);
    }
  }

  // Helper method to parse date string to local date (avoiding timezone issues)
  private parseDateStringToLocal(dateStr: string): Date {
    // Handle different date formats
    const cleanDateStr = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    
    // Parse date manually to avoid timezone issues
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      // Create date in local timezone to avoid UTC conversion issues
      return new Date(year, month, day, 12, 0, 0); // Use noon to avoid DST issues
    } else {
      return new Date(cleanDateStr);
    }
  }

}
