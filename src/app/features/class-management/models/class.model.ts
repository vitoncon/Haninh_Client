export interface ClassModel {
  id?: number;
  class_code: string;
  class_name: string;
  course_id: number;
  start_date?: string | null;
  end_date?: string | null;
  room?: string;
  schedule?: string;
  max_students?: number;
  status?: 'Mở đăng ký' | 'Đang diễn ra' | 'Hoàn thành' | 'Đã hủy';
  description?: string;
  learning_outcomes?: string;
  is_deleted?: number;

  // Dữ liệu join thêm (read-only, không insert trực tiếp)
  course_name?: string;
  lecturers?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  }[];
}
