import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StudyResultService {

  constructor() {}

  // =====================
  // Exams
  // =====================

  getExams(params: any): Observable<any[]> {
    return of([
      {
        id: 1,
        class_id: params?.class_id || 1,
        name: 'Giữa kỳ',
        date: new Date(),
        status: 'ACTIVE'
      },
      {
        id: 2,
        class_id: params?.class_id || 1,
        name: 'Cuối kỳ',
        date: new Date(),
        status: 'ACTIVE'
      }
    ]);
  }

  createExam(data: any): Observable<any> {
    return of({
      id: Date.now(),
      ...data
    });
  }

  updateExam(id: number, data: any): Observable<any> {
    return of({
      id,
      ...data
    });
  }

  deleteExam(id: number): Observable<boolean> {
    return of(true);
  }

  createBulkExam(data: any): Observable<any> {
    return of({ success: true, data });
  }

  updateExamStatus(id: number, status: any): Observable<any> {
    return of({ id, status });
  }

  getExamStatusHistory(id: number): Observable<any[]> {
    return of([
      { status: 'CREATED', date: new Date() },
      { status: 'ACTIVE', date: new Date() }
    ]);
  }

  // =====================
  // Study Results
  // =====================

  bulkCreateStudyResults(classId: number, data: any[]): Observable<any> {
    return of({ classId, created: data.length });
  }

  getStudyResultsWithDetails(params: any): Observable<any[]> {
    return of([
      {
        student_id: 1,
        student_name: 'Nguyễn Văn A',
        score: 8.5,
        exam_id: params?.exam_id || 1
      }
    ]);
  }

  createExamResult(data: any): Observable<any> {
    return of({ id: Date.now(), ...data });
  }

  // =====================
  // Exam Skills
  // =====================

  getExamSkillsByExamIds(ids: number[]): Observable<any[]> {
    return of([
      {
        id: 1,
        exam_id: ids[0],
        skill_type: 'LISTENING',
        max_score: 10
      },
      {
        id: 2,
        exam_id: ids[0],
        skill_type: 'READING',
        max_score: 10
      }
    ]);
  }

  createExamSkill(data: any): Observable<any> {
    return of({ id: Date.now(), ...data });
  }

  updateSingleExamSkill(id: number, data: any): Observable<any> {
    return of({ id, ...data });
  }

  deleteExamSkill(id: number): Observable<boolean> {
    return of(true);
  }

  reactivateExamSkill(id: number, data: any): Observable<any> {
    return of({ id, ...data, active: true });
  }

  getExistingExamSkill(examId: number, skillType: string): Observable<any> {
    return of({
      id: 999,
      exam_id: examId,
      skill_type: skillType,
      max_score: 10
    });
  }
    getOrganizationSummary(): Observable<any> {
  return of({
    total_classes: 5,
    total_students: 120,
    total_exams: 45,
    average_score: 7.6,
    pass_rate: 86
  }).pipe(delay(300));
}
getClassAnalytics(): Observable<any[]> {
  return of([
    {
      id: 1,
      class_name: 'Lớp TOPIK 1',
      class_code: 'KR-01',
      total_students: 25,
      total_exams: 8,
      average_score: 7.8
    },
    {
      id: 2,
      class_name: 'Lớp IELTS Basic',
      class_code: 'EN-02',
      total_students: 30,
      total_exams: 10,
      average_score: 7.2
    },
    {
      id: 3,
      class_name: 'Lớp HSK 3',
      class_code: 'CN-03',
      total_students: 20,
      total_exams: 6,
      average_score: 8.1
    }
  ]).pipe(delay(300));
}


  // =====================
  // Analytics
  // =====================

  getSkillAnalytics(): Observable<any[]> {
    return of([
      { skill: 'LISTENING', average: 7.5 },
      { skill: 'READING', average: 8.2 },
      { skill: 'WRITING', average: 7.0 },
      { skill: 'SPEAKING', average: 8.0 }
    ]);
  }

  getStudyResultStats(): Observable<any> {
    return of({
      total_classes: 5,
      total_students: 120,
      average_score: 7.8,
      pass_rate: 0.85
    });
  }
}
