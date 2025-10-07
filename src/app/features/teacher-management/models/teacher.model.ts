export interface TeacherModel {
  id: number;
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
  degree?: 'Cử nhân' | 'Thạc sĩ' | 'Tiến sĩ' | 'Khác';
  status: 'Đang dạy' | 'Tạm nghỉ' | 'Đã nghỉ';
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}
