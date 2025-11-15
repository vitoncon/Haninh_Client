export interface TeacherModel {
  id?: number;
  teacher_code: string;
  teacher_name: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  dob?: string | null; // ISO date string, ví dụ '1990-05-12'
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  department?: string | null;
  specialization?: string | null;
  experience_years?: number;
  degree?: 'Cử nhân' | 'Thạc sĩ' | 'Tiến sĩ' | 'Giáo sư' | 'Trung cấp';
  status: 'Đang dạy' | 'Tạm nghỉ' | 'Đã nghỉ';
  note?: string | null;
  created_at?: string;
  updated_at?: string;
  
  // Các trường mới sẽ được thêm sau khi chạy migration
  avatar_url?: string | null; // URL hình đại diện - CẦN MIGRATION
  salary?: number | null; // Lương cơ bản - CẦN MIGRATION
  hire_date?: string | null; // Ngày tuyển dụng - CẦN MIGRATION
  contract_type?: 'Hợp đồng' | 'Biên chế' | 'Thời vụ' | null; // CẦN MIGRATION
  teaching_hours_per_week?: number | null; // Số giờ dạy/tuần - CẦN MIGRATION
  languages?: string | null; // Ngôn ngữ có thể dạy - CẦN MIGRATION
  certifications?: string | null; // Chứng chỉ chuyên môn - CẦN MIGRATION
}

export interface TeacherFilters {
  department?: string;
  status?: string;
  degree?: string;
  minExperience?: number;
  maxExperience?: number;
  contractType?: string;
  hireDateFrom?: string;
  hireDateTo?: string;
  search?: string;
}

export interface TeacherStatistics {
  total_teachers: number;
  active_teachers: number;
  inactive_teachers: number;
  on_leave_teachers: number;
  average_experience: number;
  department_distribution: Array<{
    department: string;
    count: number;
  }>;
  degree_distribution: Array<{
    degree: string;
    count: number;
  }>;
  experience_distribution: Array<{
    range: string;
    count: number;
  }>;
}
