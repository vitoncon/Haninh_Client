export interface ScheduleModel {
  id?: number;
  class_id: number;
  teacher_id?: number | null;
  
  // Day of week (1 = Monday, 2 = Tuesday, ..., 0 = Sunday)
  day_of_week: number;
  
  // Time fields
  start_time: string;
  end_time: string;
  
  // Date range for schedule template
  start_date: string;
  end_date: string;
  
  // Room and notes
  room_name?: string | null;
  note?: string | null;
  
  // Status enum matching database
  status: 'Đã Lên Lịch' | 'Đã Dạy' | 'Đã Hủy' | 'Dời Lịch';
  
  // Audit fields
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;

  // Optional joined data for display
  class_name?: string;
  teacher_name?: string;
}
