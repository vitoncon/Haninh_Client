import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ScheduleModel } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor() {}

  // ===== MOCK SCHEDULE TEMPLATE =====
  getScheduleTemplates(): Observable<ScheduleModel[]> {
    return of([
      {
        id: 1,
        class_id: 1,
        teacher_id: 1,
        day_of_week: 1,
        start_time: '08:00',
        end_time: '10:00',
        start_date: '2026-02-01',
        end_date: '2026-03-01',
        room_name: 'Phòng A1',
        status: 'Đã Lên Lịch',
        note: 'Mock lịch sáng'
      },
      {
        id: 2,
        class_id: 2,
        teacher_id: 2,
        day_of_week: 3,
        start_time: '18:00',
        end_time: '20:00',
        start_date: '2026-02-01',
        end_date: '2026-03-01',
        room_name: 'Phòng B2',
        status: 'Đã Lên Lịch',
        note: 'Mock lịch tối'
      }
    ]);
  }

  // Backward compatibility
  getSchedules(): Observable<ScheduleModel[]> {
    return this.getScheduleTemplates();
  }

  // ===== MOCK CRUD =====
  addScheduleTemplate(schedule: any): Observable<ScheduleModel> {
    return of(schedule);
  }

  updateScheduleTemplate(id: number, schedule: any): Observable<ScheduleModel> {
    return of(schedule);
  }

  deleteScheduleTemplate(id: number): Observable<void> {
    return of(void 0);
  }

  addSchedule(schedule: any): Observable<ScheduleModel> {
    return of(schedule);
  }

  updateSchedule(id: number, schedule: any): Observable<ScheduleModel> {
    return of(schedule);
  }

  deleteSchedule(id: number): Observable<void> {
    return of(void 0);
  }

  // ===== MOCK CLASS SCHEDULE =====
  createClassSchedules(classId: number, scheduleData: any): Observable<any> {
    return of({
      class_id: classId,
      ...scheduleData
    });
  }

  getClassSchedulesByClass(classId: number): Observable<any[]> {
    return of([
      {
        id: 1,
        class_id: classId,
        teacher_id: 1,
        day_of_week: 1,
        start_time: '08:00',
        end_time: '10:00',
        room_name: 'Phòng A1',
        status: 'Đã Lên Lịch'
      }
    ]);
  }

  getAllClassSchedulesByClass(classId: number): Observable<any[]> {
    return this.getClassSchedulesByClass(classId);
  }

  getClassScheduleById(id: number): Observable<any> {
    return of({
      id,
      class_id: 1,
      teacher_id: 1,
      day_of_week: 2,
      start_time: '08:00',
      end_time: '10:00',
      room_name: 'Phòng A1',
      status: 'Đã Lên Lịch'
    });
  }

  getClassSchedules(): Observable<any[]> {
    return this.getScheduleTemplates();
  }
}
