import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import {
  StudyResultWithDetails,
  StudentStudySummary,
  ClassStudyStatistics,
  StudyResultStats
} from '../models/study-results.model';

@Injectable({
  providedIn: 'root'
})
export class StudyResultService {

  constructor() {}

  // ================= MOCK DATA =================

  private mockStudyResults: StudyResultWithDetails[] = [
    {
      id: 1,
      student_id: 101,
      class_id: 10,
      exam_type: 'Kiểm tra giữa kỳ',
      exam_name: 'Midterm Listening',
      exam_date: '2025-03-15',
      language: 'Tiếng Anh',
      skill_type: 'Nghe',
      score: 82,
      max_score: 100,
      percentage: 82,
      level: 'B1',
      teacher_comment: 'Nghe tốt',

      student: {
        student_code: 'HV001',
        full_name: 'Nguyễn Văn An'
      },
      class: {
        class_name: 'English B1 Morning',
        class_code: 'ENG-B1-01'
      }
    },
    {
      id: 2,
      student_id: 102,
      class_id: 10,
      exam_type: 'Kiểm tra cuối kỳ',
      exam_name: 'Final Writing',
      exam_date: '2025-05-20',
      language: 'Tiếng Anh',
      skill_type: 'Viết',
      score: 75,
      max_score: 100,
      percentage: 75,
      level: 'B1',

      student: {
        student_code: 'HV002',
        full_name: 'Lê Thị Mai'
      },
      class: {
        class_name: 'English B1 Morning',
        class_code: 'ENG-B1-01'
      }
    }
  ];

  private mockStudentSummary: StudentStudySummary = {
    student_id: 101,
    student_code: 'HV001',
    full_name: 'Nguyễn Văn An',
    class_id: 10,
    class_name: 'English B1 Morning',
    class_code: 'ENG-B1-01',
    total_exams: 5,
    average_score: 80,
    highest_score: 92,
    lowest_score: 70,
    pass_rate: 100,

    level_distribution: {
      A1: 0,
      A2: 0,
      B1: 4,
      B2: 1,
      C1: 0,
      C2: 0
    },

    recent_results: [],
    proficiency_level: 'B1',
    overall_rating: 'Giỏi'
  };

  private mockClassStats: ClassStudyStatistics = {
    class_id: 10,
    class_name: 'English B1 Morning',
    class_code: 'ENG-B1-01',
    total_students: 25,
    total_exams: 120,
    average_score: 78,
    pass_rate: 92,

    level_distribution: {
      A1: 0,
      A2: 2,
      B1: 15,
      B2: 8,
      C1: 0,
      C2: 0
    },

    top_performers: [
      {
        student_code: 'HV002',
        full_name: 'Lê Thị Mai',
        average_score: 90
      }
    ],

    needs_improvement: []
  };

  private mockStats: StudyResultStats = {
    total_results: 120,
    average_score: 78,
    pass_rate: 92,

    level_distribution: {
      A1: 0,
      A2: 2,
      B1: 60,
      B2: 50,
      C1: 8,
      C2: 0
    },

    language_distribution: {
      'Tiếng Anh': 80,
      'Tiếng Hàn': 25,
      'Tiếng Trung': 15
    },

    skill_type_distribution: {
      'Nghe': 30,
      'Nói': 25,
      'Đọc': 35,
      'Viết': 20,
      'Tổng hợp': 10
    },

    exam_type_distribution: {
      'Kiểm tra định kỳ': 50,
      'Kiểm tra giữa kỳ': 30,
      'Kiểm tra cuối kỳ': 40
    }
  };

  // ================= METHODS =================

  getStudyResults(): Observable<StudyResultWithDetails[]> {
    return of(this.mockStudyResults);
  }

  getStudentSummary(): Observable<StudentStudySummary> {
    return of(this.mockStudentSummary);
  }

  getClassStatistics(): Observable<ClassStudyStatistics> {
    return of(this.mockClassStats);
  }

  getStats(): Observable<StudyResultStats> {
    return of(this.mockStats);
  }

}
