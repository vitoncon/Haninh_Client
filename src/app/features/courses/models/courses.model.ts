export interface Course {
  id?: number;
  course_code: string;
  course_name: string;
  description?: string;
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung';
  level: 'Sơ cấp' | 'Trung cấp' | 'Cao cấp';
  duration_weeks?: number | null; 
  total_hours?: number | null;
  tuition_fee?: number | null;
  status?: 'Đang hoạt động' | 'Không hoạt động';
  created_at?: Date;
}
