export interface ClassScheduleModel {
  id: number;
  class_id: number;
  schedule_id?: number | null; // Reference to schedule template
  date: string; // Specific date (e.g., 2025-10-20)
  day_of_week: number; // 0-6 (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday) - JavaScript format
  start_time: string;
  end_time: string;
  teacher_id?: number | null;
  room_name?: string | null;
  status: 'Đã Lên Lịch' | 'Đã Dạy' | 'Đã Hủy' | 'Dời Lịch';
  note?: string | null;
  
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  is_deleted: number;
  deleted_by: number;

  // Optional joined data
  class_name?: string;
  teacher_name?: string;
  course_name?: string;
}
