import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  StudyResult,
  StudyResultWithDetails,
  StudentStudySummary,
  ClassStudyStatistics,
  StudyResultStats,
  ClassExamSummary,
  StudyResultFilters
} from '../models/study-results.model';

@Injectable({
  providedIn: 'root'
})
export class StudyResultService {

  constructor() {}

  /* ===============================
   * DASHBOARD SUMMARY
   * =============================== */
  getOrganizationSummary(): Observable<any> {
    return of({
      total_classes: 3,
      total_students: 75,
      average_score: 7.6,
      pass_rate: 86
    });
  }

  /* ===============================
   * CLASS ANALYTICS (TABLE + CHART)
   * =============================== */
  getClassAnalytics(): Observable<any[]> {
    return of([
      {
        id: 1,
        class_id: 1,
        class_code: 'CLS001',
        class_name: 'IELTS Foundation',
        total_students: 25,
        total_exams: 3,
        average_score: 7.2,
        pass_rate: 80
      },
      {
        id: 2,
        class_id: 2,
        class_code: 'CLS002',
        class_name: 'TOEIC Intensive',
        total_students: 30,
        total_exams: 4,
        average_score: 6.9,
        pass_rate: 78
      },
      {
        id: 3,
        class_id: 3,
        class_code: 'CLS003',
        class_name: 'IELTS Advanced',
        total_students: 20,
        total_exams: 5,
        average_score: 8.1,
        pass_rate: 92
      }
    ]);
  }

  /* ===============================
   * STUDY RESULTS LIST
   * =============================== */
  getStudyResults(filters?: StudyResultFilters): Observable<StudyResultWithDetails[]> {
    return of([
      {
        id: 1,
        student_id: 1,
        class_id: 1,
        exam_type: 'Kiểm tra giữa kỳ',
        exam_name: 'Midterm Test',
        exam_date: '2025-03-15',
        language: 'Tiếng Anh',
        skill_type: 'Tổng hợp',
        score: 78,
        max_score: 100,
        percentage: 78,
        level: 'B1',
        teacher_comment: 'Tiến bộ tốt',
        created_at: '2025-03-15',

        student: {
          student_code: 'HV001',
          full_name: 'Nguyễn Văn A',
          email: 'a@gmail.com'
        },
        class: {
          class_code: 'CLS001',
          class_name: 'IELTS Foundation',
          course_name: 'IELTS'
        },
        teacher: {
          id: 1,
          full_name: 'Trần Thị B'
        }
      },
      {
        id: 2,
        student_id: 2,
        class_id: 2,
        exam_type: 'Kiểm tra cuối kỳ',
        exam_name: 'Final Test',
        exam_date: '2025-04-10',
        language: 'Tiếng Anh',
        skill_type: 'Tổng hợp',
        score: 85,
        max_score: 100,
        percentage: 85,
        level: 'B2',
        teacher_comment: 'Kết quả rất tốt',
        created_at: '2025-04-10',

        student: {
          student_code: 'HV002',
          full_name: 'Lê Thị C'
        },
        class: {
          class_code: 'CLS003',
          class_name: 'IELTS Advanced',
          course_name: 'IELTS'
        },
        teacher: {
          id: 2,
          full_name: 'Phạm Văn D'
        }
      }
    ]);
  }

  /* ===============================
   * STUDENT SUMMARY
   * =============================== */
  getStudentStudySummary(studentId: number): Observable<StudentStudySummary> {
    return of({
      student_id: studentId,
      student_code: 'HV001',
      full_name: 'Nguyễn Văn A',
      class_id: 1,
      class_code: 'CLS001',
      class_name: 'IELTS Foundation',
      course_name: 'IELTS',

      total_exams: 3,
      average_score: 7.5,
      highest_score: 8.5,
      lowest_score: 6.5,
      pass_rate: 85,

      level_distribution: {
        A1: 0,
        A2: 1,
        B1: 2,
        B2: 0,
        C1: 0,
        C2: 0
      },

      recent_results: [
        {
          student_id: studentId,
          class_id: 1,
          exam_type: 'Kiểm tra định kỳ',
          exam_name: 'Quiz 1',
          exam_date: '2025-02-01',
          language: 'Tiếng Anh',
          skill_type: 'Tổng hợp',
          score: 75,
          max_score: 100,
          percentage: 75,
          level: 'B1'
        }
      ],

      proficiency_level: 'B1',
      overall_rating: 'Khá'
    });
  }

  /* ===============================
   * CLASS STATISTICS
   * =============================== */
  getClassStatistics(classId: number): Observable<ClassStudyStatistics> {
    return of({
      class_id: classId,
      class_code: 'CLS001',
      class_name: 'IELTS Foundation',

      total_students: 25,
      total_exams: 3,
      average_score: 7.2,
      pass_rate: 80,

      level_distribution: {
        A1: 2,
        A2: 5,
        B1: 10,
        B2: 8,
        C1: 0,
        C2: 0
      },

      top_performers: [
        {
          student_code: 'HV005',
          full_name: 'Nguyễn Văn E',
          average_score: 8.6
        }
      ],
      needs_improvement: [
        {
          student_code: 'HV010',
          full_name: 'Trần Văn F',
          average_score: 5.2
        }
      ]
    });
  }

  /* ===============================
   * GLOBAL STATS (CHART)
   * =============================== */
  getStudyResultStats(): Observable<StudyResultStats> {
    return of({
      total_results: 12,
      average_score: 7.6,
      pass_rate: 86,

      level_distribution: {
        A1: 1,
        A2: 3,
        B1: 4,
        B2: 3,
        C1: 1,
        C2: 0
      },

      language_distribution: {
        'Tiếng Anh': 10,
        'Tiếng Hàn': 1,
        'Tiếng Trung': 1
      },

      skill_type_distribution: {
        'Nghe': 3,
        'Nói': 3,
        'Đọc': 3,
        'Viết': 2,
        'Tổng hợp': 1
      },

      exam_type_distribution: {
        'Kiểm tra định kỳ': 4,
        'Kiểm tra giữa kỳ': 4,
        'Kiểm tra cuối kỳ': 3,
        'Kiểm tra tổng hợp': 1
      }
    });
  }

  /* ===============================
   * EXAM SUMMARY
   * =============================== */
  getClassExamSummary(classId: number): Observable<ClassExamSummary[]> {
    return of([
      {
        id: 1,
        exam_name: 'Midterm Test',
        exam_type: 'Kiểm tra giữa kỳ',
        skill_type: 'Tổng hợp',
        exam_date: '2025-03-15',
        language: 'Tiếng Anh',
        class_id: classId,
        total_students: 25,
        total_submitted: 25,
        average_score: 7.3,
        pass_rate: 82
      }
    ]);
  }
}
