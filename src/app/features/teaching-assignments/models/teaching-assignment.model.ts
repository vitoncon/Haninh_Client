// Class Teacher Assignment - based on class_teachers table schema
export interface ClassTeacherAssignment {
  id?: number;
  class_id: number;
  teacher_id: number;
  role: 'Giáo viên chủ nhiệm' | 'Giáo viên giảng dạy' | 'Trợ giảng';
  assign_date: string;
  status: 'Đang dạy' | 'Hoàn thành' | 'Nghỉ dạy';
  created_at?: string;
  updated_at?: string;
  // Additional fields for UI
  teacher_name?: string;
  teacher_email?: string;
  class_name?: string;
  class_code?: string;
  course_name?: string;
}

// Teaching Assignment - based on teaching_assignments table schema
export interface TeachingAssignment {
  id?: number;
  teacher_id: number;
  class_id: number;
  subject: string;
  description?: string;
  schedule?: string;
  room?: string;
  start_time?: string;
  end_time?: string;
  status: 'Dang day' | 'Tam dừng' | 'Hoàn thành' | 'Đã hủy';
  start_date?: string;
  end_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  is_deleted?: number;
  deleted_by?: number;
}

// Teacher permissions in class
export interface ClassPermission {
  class_id: number;
  class_name: string;
  can_assign_homework: boolean;
  can_grade_assignments: boolean;
  can_manage_students: boolean;
}

export interface TeachingAssignmentWithDetails extends TeachingAssignment {
  teacher_name?: string;
  teacher_email?: string;
  teacher_phone?: string;
  class_name?: string;
  class_code?: string;
  course_name?: string;
  course_code?: string;
}

export interface TeachingAssignmentFilters {
  teacher_id?: number;
  class_id?: number;
  subject?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}
