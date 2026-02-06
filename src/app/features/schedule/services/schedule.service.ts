import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ScheduleModel } from '../models/schedule.model';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor() {}

  // ================= MOCK SCHEDULE TEMPLATE =================
  private mockScheduleTemplates: ScheduleModel[] = [
    {
      id: 1,
      class_id: 1,
      day_of_week: 1,
      start_time: '18:00',
      end_time: '20:00',
      start_date: '2026-02-01',
      end_date: '2026-04-30',
      room_name: 'P101',
      status: 'Đã Lên Lịch',
      teacher_name: 'Nguyễn Văn A',
      class_name: 'ENG-01'
    },
    {
      id: 2,
      class_id: 2,
      day_of_week: 3,
      start_time: '18:00',
      end_time: '20:00',
      start_date: '2026-03-01',
      end_date: '2026-06-01',
      room_name: 'P202',
      status: 'Đã Lên Lịch',
      teacher_name: 'Trần Thị B',
      class_name: 'KOR-01'
    }
  ];

  // ================= MOCK CLASS SCHEDULE =================
  private mockClassSchedules: ScheduleModel[] = [
    {
      id: 101,
      class_id: 1,
      day_of_week: 1,
      start_time: '18:00',
      end_time: '20:00',
      start_date: '2026-02-10',
      end_date: '2026-02-10',
      room_name: 'P101',
      status: 'Đã Dạy',
      teacher_name: 'Nguyễn Văn A',
      class_name: 'ENG-01'
    },
    {
      id: 102,
      class_id: 1,
      day_of_week: 3,
      start_time: '18:00',
      end_time: '20:00',
      start_date: '2026-02-12',
      end_date: '2026-02-12',
      room_name: 'P101',
      status: 'Đã Lên Lịch',
      teacher_name: 'Nguyễn Văn A',
      class_name: 'ENG-01'
    }
  ];

  // ================= TEMPLATE METHODS =================
  getScheduleTemplates(): Observable<ScheduleModel[]> {
    return of(this.mockScheduleTemplates);
  }

  // ================= BACKWARD METHODS =================
  getSchedules(): Observable<ScheduleModel[]> {
    return of(this.mockClassSchedules);
  }

  getScheduleById(id: number): Observable<ScheduleModel> {
    const found = this.mockScheduleTemplates.find(x => x.id === id);
    return of(found as ScheduleModel);
  }

  addScheduleTemplate(schedule: any): Observable<ScheduleModel> {
    const newItem = {
      ...schedule,
      id: Math.floor(Math.random() * 100000)
    };
    this.mockScheduleTemplates.unshift(newItem);
    return of(newItem);
  }

  updateScheduleTemplate(id: number, schedule: any): Observable<ScheduleModel> {
    const index = this.mockScheduleTemplates.findIndex(x => x.id === id);
    if (index > -1) {
      this.mockScheduleTemplates[index] = { ...schedule, id };
    }
    return of(this.mockScheduleTemplates[index]);
  }

  deleteScheduleTemplate(id: number): Observable<void> {
    this.mockScheduleTemplates =
      this.mockScheduleTemplates.filter(x => x.id !== id);
    return of(void 0);
  }

  // ================= CLASS SCHEDULE =================
  addSchedule(schedule: any): Observable<ScheduleModel> {
    const newItem = {
      ...schedule,
      id: Math.floor(Math.random() * 100000)
    };
    this.mockClassSchedules.unshift(newItem);
    return of(newItem);
  }

  updateSchedule(id: number, schedule: any): Observable<ScheduleModel> {
    const index = this.mockClassSchedules.findIndex(x => x.id === id);
    if (index > -1) {
      this.mockClassSchedules[index] = { ...schedule, id };
    }
    return of(this.mockClassSchedules[index]);
  }

  deleteSchedule(id: number): Observable<void> {
    this.mockClassSchedules =
      this.mockClassSchedules.filter(x => x.id !== id);
    return of(void 0);
  }

  createClassSchedules(classId: number, scheduleData: any): Observable<any> {
    const newItem = {
      ...scheduleData,
      class_id: classId,
      id: Math.floor(Math.random() * 100000)
    };
    this.mockClassSchedules.unshift(newItem);
    return of(newItem);
  }

  getClassSchedulesByClass(classId: number): Observable<any[]> {
    if (!classId) return of([]);
    return of(this.mockClassSchedules.filter(x => x.class_id === classId));
  }

  getAllClassSchedulesByClass(classId: number): Observable<any[]> {
    if (!classId) return of([]);
    return of(this.mockClassSchedules.filter(x => x.class_id === classId));
  }

  getClassScheduleById(id: number): Observable<any> {
    const found = this.mockClassSchedules.find(x => x.id === id);
    return of(found);
  }

  getClassSchedules(): Observable<any[]> {
    return of(this.mockClassSchedules);
  }
}
