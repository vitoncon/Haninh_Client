import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ScheduleModel } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor() {}

  // =============================
  // MOCK SCHEDULE TEMPLATE
  // =============================
  getScheduleTemplates(): Observable<ScheduleModel[]> {

    const now = new Date().toISOString();

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
        note: 'Template sáng',

        created_at: now,
        updated_at: now,
        created_by: 1,
        updated_by: 1,
        is_deleted: 0
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
        note: 'Template tối',

        created_at: now,
        updated_at: now,
        created_by: 1,
        updated_by: 1,
        is_deleted: 0
      }
    ]);
  }

  // =============================
  // MOCK CLASS SCHEDULE (CALENDAR)
  // =============================
  getSchedules(): Observable<any[]> {

    const now = new Date().toISOString();

    return of([
      {
        id: 1,
        class_id: 1,
        schedule_id: 1,
        date: '2026-02-06',
        day_of_week: 5,
        start_time: '08:00',
        end_time: '10:00',
        teacher_id: 1,
        room_name: 'Phòng A1',
        status: 'Đã Lên Lịch',
        note: 'Mock lịch học',

        created_at: now,
        updated_at: now,
        created_by: 1,
        updated_by: 1,
        is_deleted: 0,
        deleted_by: 0,

        class_name: 'IELTS Basic',
        teacher_name: 'Nguyễn Văn A',
        course_name: 'English Basic'
      },
      {
        id: 2,
        class_id: 2,
        schedule_id: 2,
        date: '2026-02-07',
        day_of_week: 6,
        start_time: '18:00',
        end_time: '20:00',
        teacher_id: 2,
        room_name: 'Phòng B2',
        status: 'Đã Lên Lịch',
        note: 'Mock tối',

        created_at: now,
        updated_at: now,
        created_by: 1,
        updated_by: 1,
        is_deleted: 0,
        deleted_by: 0,

        class_name: 'HSK 3',
        teacher_name: 'Trần Thị B',
        course_name: 'Chinese HSK'
      }
    ]);
  }

  // =============================
  // MOCK CRUD
  // =============================
  addScheduleTemplate(schedule: any): Observable<any> {
    console.log('Mock add schedule template', schedule);
    return of(schedule);
  }

  updateScheduleTemplate(id: number, schedule: any): Observable<any> {
    console.log('Mock update schedule template', id, schedule);
    return of(schedule);
  }

  deleteScheduleTemplate(id: number): Observable<any> {
    console.log('Mock delete schedule template', id);
    return of(true);
  }

  addSchedule(schedule: any): Observable<any> {
    console.log('Mock add class schedule', schedule);
    return of(schedule);
  }

  updateSchedule(id: number, schedule: any): Observable<any> {
    console.log('Mock update class schedule', id, schedule);
    return of(schedule);
  }

  deleteSchedule(id: number): Observable<any> {
    console.log('Mock delete class schedule', id);
    return of(true);
  }

  // =============================
  // MOCK GET BY CLASS
  // =============================
  getClassSchedulesByClass(classId: number): Observable<any[]> {
    return this.getSchedules();
  }

  getAllClassSchedulesByClass(classId: number): Observable<any[]> {
    return this.getSchedules();
  }

  getClassScheduleById(id: number): Observable<any> {
    return this.getSchedules();
  }

  getClassSchedules(): Observable<any[]> {
    return this.getSchedules();
  }

}
