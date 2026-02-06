import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudyResultService {

  // ================= MOCK STORAGE =================
  private exams: any[] = [
    {
      id: 1,
      class_id: 1,
      exam_name: 'Midterm Test',
      exam_type: 'Kiểm tra giữa kỳ',
      skill_type: 'Tổng hợp',
      language: 'Tiếng Anh',
      exam_date: '2026-01-10'
    }
  ];

  private studyResults: any[] = [];

  private examSkills: any[] = [];

  constructor() {}

  // ================= EXAM =================

  getExams(filters?: any): Observable<any[]> {
    return of(this.exams);
  }

  createExam(data: any): Observable<any> {
    const newExam = {
      id: Date.now(),
      ...data
    };
    this.exams.push(newExam);
    return of(newExam);
  }

  updateExam(id: number, data: any): Observable<any> {
    const index = this.exams.findIndex(e => e.id === id);
    if (index !== -1) {
      this.exams[index] = { ...this.exams[index], ...data };
      return of(this.exams[index]);
    }
    return of(null);
  }

  deleteExam(id: number): Observable<any> {
    this.exams = this.exams.filter(e => e.id !== id);
    return of(true);
  }

  createBulkExam(data: any): Observable<any> {
    return of(data);
  }

  // ================= STUDY RESULT =================

  getStudyResultsWithDetails(filters?: any): Observable<any[]> {
    return of(this.studyResults);
  }

  bulkCreateStudyResults(classId: number, data: any[]): Observable<any> {
    this.studyResults.push(...data);
    return of(data);
  }

  createExamResult(data: any): Observable<any> {
    const result = { id: Date.now(), ...data };
    this.studyResults.push(result);
    return of(result);
  }

  // ================= EXAM SKILL =================

  getExamSkillsByExamIds(ids: number[]): Observable<any[]> {
    return of(this.examSkills.filter(s => ids.includes(s.exam_id)));
  }

  createExamSkill(data: any): Observable<any> {
    const skill = { id: Date.now(), ...data };
    this.examSkills.push(skill);
    return of(skill);
  }

  updateSingleExamSkill(id: number, data: any): Observable<any> {
    const index = this.examSkills.findIndex(s => s.id === id);
    if (index !== -1) {
      this.examSkills[index] = { ...this.examSkills[index], ...data };
      return of(this.examSkills[index]);
    }
    return of(null);
  }

  deleteExamSkill(id: number): Observable<any> {
    this.examSkills = this.examSkills.filter(s => s.id !== id);
    return of(true);
  }

  reactivateExamSkill(id: number, data: any): Observable<any> {
    return of({ id, ...data });
  }

  getExistingExamSkill(examId: number, skillType: string): Observable<any> {
    const skill = this.examSkills.find(
      s => s.exam_id === examId && s.skill_type === skillType
    );
    return of(skill || null);
  }

  // ================= EXAM STATUS =================

  updateExamStatus(examId: number, status: string): Observable<any> {
    return of({ examId, status });
  }

  getExamStatusHistory(examId: number): Observable<any[]> {
    return of([]);
  }

  // ================= ANALYTICS =================

  getOrganizationSummary(): Observable<any> {
    return of({
      total_students: 120,
      average_score: 78,
      pass_rate: 85
    });
  }

  getClassAnalytics(): Observable<any[]> {
    return of([]);
  }

  getSkillAnalytics(): Observable<any[]> {
    return of([]);
  }
}
