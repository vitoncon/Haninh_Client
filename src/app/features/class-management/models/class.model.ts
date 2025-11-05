export interface ClassModel {
  id?: number;
  class_code: string;
  class_name: string;
  course_id: number;
  start_date?: string | null;
  end_date?: string | null;
  room?: string;
  max_students?: number;
  
  // Schedule template fields (for creating class)
  schedule_template?: {
    day_of_week: number[];
    start_time: string;
    end_time: string;
    teacher_id?: number;
    room_name?: string;
  }[];
  status?: 'Mở đăng ký' | 'Đang diễn ra' | 'Hoàn thành' | 'Đã hủy';
  description?: string;
  learning_outcomes?: string;
  is_deleted?: number;

  // Dữ liệu join thêm (read-only, không insert trực tiếp)
  course_name?: string;
  language?: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung'; // Join từ Course table
  lecturers?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  }[];
}
