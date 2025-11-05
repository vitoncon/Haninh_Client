// Models for Student Detail Page

export interface StudentCurrentClasses {
  id: number;
  class_id: number;
  class_name: string;        // "Lớp TOEIC 450"
  class_code: string;        // "TOEIC450-001"
  course_name: string;       // "TOEIC 450"
  language: 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung' | 'Chưa biết' | 'Đang tải...'; // "Tiếng Anh"
  teacher_name: string;      // "Nguyễn Văn A"
  enroll_date: string;       // "2024-01-15"
  completion_date?: string;  // "2024-06-15" (nếu đã hoàn thành/nghỉ)
  status: 'Đang học' | 'Đang diễn ra' | 'Hoàn thành' | 'Nghỉ học';
  note?: string;             // Ghi chú riêng cho lớp học này
}

export interface StudentOverviewStats {
  totalClasses: number;      // Tổng lớp đã tham gia
  currentClasses: number;    // Lớp đang học
  completedClasses: number;  // Lớp đã hoàn thành
  lastClassDate: string;     // Ngày học gần nhất
}

// Model riêng cho Student Detail - không phụ thuộc vào class-management
export interface ClassStudentForDetail {
  id?: number;
  class_id: number;
  student_id: number;
  enroll_date: string;
  status: 'Đang học' | 'Đang diễn ra' | 'Hoàn thành' | 'Nghỉ học';
  completion_date?: string;
  note?: string;
  
  // Dữ liệu join từ API
  class_name?: string;
  class_code?: string;
  course_name?: string;
  teacher_name?: string;
  language?: string;
}