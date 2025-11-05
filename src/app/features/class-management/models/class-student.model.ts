export interface ClassStudent {
  id?: number;
  class_id: number;
  student_id: number;
  enroll_date: string;
  status: 'Đang học' | 'Hoàn thành' | 'Nghỉ học';
  completion_date?: string;
  note?: string;
  
  // Dữ liệu join (read-only)
  student_name?: string;
  student_code?: string;
  student_email?: string;
  student_phone?: string;
  class_name?: string;
}

export interface ClassStudentWithDetails extends ClassStudent {
  student: {
    id: number;
    student_code: string;
    full_name: string;
    email?: string;
    phone?: string;
    gender: 'Nam' | 'Nữ' | 'Khác';
    status: 'Đang học' | 'Tạm dừng' | 'Tốt nghiệp' | 'Nghỉ học';
  };
  selected?: boolean; // For bulk operations
}
