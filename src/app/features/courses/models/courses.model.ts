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
  
  // New essential fields
  prerequisites?: string; // Điều kiện tiên quyết
  learning_objectives?: string; // Mục tiêu học tập
  category?: string; // Danh mục khóa học
  
  created_at?: Date;
  updated_at?: Date;
}

export interface CourseFilters {
  language?: string;
  level?: string;
  status?: string;
  minDuration?: number;
  maxDuration?: number;
  minTuitionFee?: number;
  maxTuitionFee?: number;
  createdDateFrom?: string;
  createdDateTo?: string;
  search?: string;
}

export interface CourseStatistics {
  total_courses: number;
  active_courses: number;
  inactive_courses: number;
  language_distribution: Array<{
    language: string;
    count: number;
  }>;
  level_distribution: Array<{
    level: string;
    count: number;
  }>;
  average_tuition_fee: number;
  average_duration_weeks: number;
  average_total_hours: number;
}
