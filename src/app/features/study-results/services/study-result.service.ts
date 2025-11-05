import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, forkJoin, switchMap, of, throwError, catchError, from } from 'rxjs';
import { 
  StudyResult, 
  StudyResultWithDetails, 
  StudentStudySummary, 
  ClassStudyStatistics, 
  StudyResultFilters, 
  StudyResultStats 
} from '../models/study-results.model';
import {
  Exam,
  ExamSkill,
  ExamResult,
  ExamWithSkills,
  ExamResultWithDetails,
  ExamResultsBySkills,
  BulkExamCreation,
  ExamStatistics,
  StudentExamSummary
} from '../models/exam-results.model';
import { ExamSkillsService } from './exam-skills.service';
import { ClassStudentService } from '../../class-management/services/class-student.service';

@Injectable({
  providedIn: 'root'
})
export class StudyResultService {
  private apiUrl = 'http://localhost:10093/api/study-results';
  private baseApiUrl = 'http://localhost:10093/api';
  private examApiUrl = 'http://localhost:10093/api/exams';
  private examSkillsApiUrl = 'http://localhost:10093/api/exam_skills';

  constructor(
    private http: HttpClient,
    private classStudentService: ClassStudentService,
    private examSkillsService: ExamSkillsService
  ) {}

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('accessToken') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  // Lấy danh sách kết quả học tập với thông tin đầy đủ (sử dụng endpoint router)
  getStudyResultsWithDetails(filters?: StudyResultFilters): Observable<StudyResultWithDetails[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.student_id) params = params.set('student_id', filters.student_id.toString());
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.teacher_id) params = params.set('teacher_id', filters.teacher_id.toString());
      if (filters.exam_type) params = params.set('exam_type', filters.exam_type);
      if (filters.language) params = params.set('language', filters.language);
      if (filters.skill_type) params = params.set('skill_type', filters.skill_type);
      if (filters.level) params = params.set('level', filters.level);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Lấy danh sách kết quả học tập đơn giản (sử dụng endpoint router)
  getStudyResultsSimple(q?: string): Observable<StudyResultWithDetails[]> {
    let params = new HttpParams();
    if (q && q.trim().length > 0) {
      params = params.set('search', q.trim());
    }
    
    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Lấy danh sách kết quả học tập với bộ lọc
  getStudyResults(filters?: StudyResultFilters): Observable<StudyResultWithDetails[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.student_id) params = params.set('student_id', filters.student_id.toString());
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.teacher_id) params = params.set('teacher_id', filters.teacher_id.toString());
      if (filters.exam_type) params = params.set('exam_type', filters.exam_type);
      if (filters.language) params = params.set('language', filters.language);
      if (filters.skill_type) params = params.set('skill_type', filters.skill_type);
      if (filters.level) params = params.set('level', filters.level);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Lấy chi tiết một kết quả học tập
  getStudyResult(id: number): Observable<StudyResultWithDetails> {
    return this.http.get<StudyResultWithDetails>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Tạo mới kết quả học tập
  createStudyResult(studyResult: StudyResult): Observable<StudyResult> {
    return this.http.post<StudyResult>(this.apiUrl, studyResult, this.getAuthHeaders());
  }

  // Cập nhật kết quả học tập
  updateStudyResult(id: number, studyResult: StudyResult): Observable<StudyResult> {
    return this.http.put<StudyResult>(`${this.apiUrl}/${id}`, studyResult, this.getAuthHeaders());
  }

  // Xóa kết quả học tập
  deleteStudyResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Lấy tóm tắt kết quả học tập của một học viên
  getStudentStudySummary(studentId: number, classId?: number): Observable<StudentStudySummary> {
    let params = new HttpParams().set('student_id', studentId.toString());
    if (classId) params = params.set('class_id', classId.toString());
    
    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => {
        const results = res?.data ?? res;
        // Tính toán summary từ dữ liệu trả về
        return this.calculateStudentSummary(results, studentId);
      })
    );
  }

  // Lấy thống kê kết quả học tập của một lớp
  getClassStudyStatistics(classId: number): Observable<ClassStudyStatistics> {
    // Lấy cả study results và danh sách học viên thực tế trong lớp
    const studyResults$ = this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params: new HttpParams().set('class_id', classId.toString())
    });
    
    const classStudents$ = this.classStudentService.getStudentsByClass(classId);
    
    return forkJoin({
      studyResults: studyResults$,
      classStudents: classStudents$
    }).pipe(
      map(({ studyResults, classStudents }) => {
        const results = studyResults?.data ?? studyResults;
        const statistics = this.calculateClassStatistics(results, classId);
        
        // Cập nhật total_students từ số học viên thực tế trong lớp
        statistics.total_students = classStudents.length;
        
        return statistics;
      })
    );
  }

  // Lấy thống kê tổng quan (tính toán từ dữ liệu có sẵn)
  getStudyResultStats(filters?: StudyResultFilters): Observable<StudyResultStats> {
    // Sử dụng endpoint router để lấy tất cả study results
    let params = new HttpParams();
    
    if (filters) {
      if (filters.student_id) params = params.set('student_id', filters.student_id.toString());
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.teacher_id) params = params.set('teacher_id', filters.teacher_id.toString());
      if (filters.exam_type) params = params.set('exam_type', filters.exam_type);
      if (filters.language) params = params.set('language', filters.language);
      if (filters.skill_type) params = params.set('skill_type', filters.skill_type);
      if (filters.level) params = params.set('level', filters.level);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => {
        const results = res?.data ?? res;
        return this.calculateStats(results);
      })
    );
  }

  // Lấy kết quả học tập của học viên trong một lớp
  getClassStudentResults(classId: number): Observable<StudyResultWithDetails[]> {
    const params = new HttpParams().set('class_id', classId.toString());
    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Nhập điểm hàng loạt cho một lớp (sử dụng endpoint router)
  bulkCreateStudyResults(classId: number, results: StudyResult[]): Observable<StudyResult[]> {
    // Tạo từng study result một cách tuần tự
    const createPromises = results.map(result => 
      this.createStudyResult(result).toPromise()
    );
    
    return new Observable(observer => {
      Promise.all(createPromises)
        .then(createdResults => {
          observer.next(createdResults.filter(r => r !== undefined) as StudyResult[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  // Lấy kết quả theo kỹ năng cụ thể
  getResultsBySkill(studentId: number, skillType: string, language: string): Observable<StudyResult[]> {
    const params = new HttpParams()
      .set('student_id', studentId.toString())
      .set('skill_type', skillType)
      .set('language', language);
    
    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Tính toán trình độ hiện tại của học viên
  calculateStudentLevel(studentId: number, language: string): Observable<{ level: string; confidence: number }> {
    const params = new HttpParams()
      .set('student_id', studentId.toString())
      .set('language', language);
    
    return this.http.get<any>(this.apiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => {
        const results = res?.data ?? res;
        return this.calculateLevelFromResults(results, language);
      })
    );
  }

  // Helper method để tính toán thống kê tổng quan
  private calculateStats(results: StudyResultWithDetails[]): StudyResultStats {
    
    if (!results || results.length === 0) {
      return {
        total_results: 0,
        average_score: 0,
        pass_rate: 0,
        level_distribution: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
        language_distribution: { 'Tiếng Anh': 0, 'Tiếng Hàn': 0, 'Tiếng Trung': 0 },
        skill_type_distribution: { 'Nghe': 0, 'Nói': 0, 'Đọc': 0, 'Viết': 0, 'Tổng hợp': 0 },
        exam_type_distribution: { 'Kiểm tra định kỳ': 0, 'Kiểm tra giữa kỳ': 0, 'Kiểm tra cuối kỳ': 0, 'Kiểm tra trình độ': 0, 'Thi thử chứng chỉ': 0 }
      };
    }

    const totalResults = results.length;
    
    // Ensure percentage is a number and handle NaN cases
    const validResults = results.filter(r => {
      const percentage = typeof r.percentage === 'string' ? parseFloat(r.percentage) : r.percentage;
      return !isNaN(percentage) && isFinite(percentage);
    });
    
    const averageScore = validResults.length > 0 
      ? validResults.reduce((sum, r) => {
          const percentage = typeof r.percentage === 'string' ? parseFloat(r.percentage) : r.percentage;
          return sum + percentage;
        }, 0) / validResults.length 
      : 0;
      
    const passRate = validResults.length > 0 
      ? (validResults.filter(r => {
          const percentage = typeof r.percentage === 'string' ? parseFloat(r.percentage) : r.percentage;
          return percentage >= 60;
        }).length / validResults.length) * 100 
      : 0;

    // Level distribution
    const levelDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    results.forEach(r => {
      levelDistribution[r.level as keyof typeof levelDistribution]++;
    });

    // Language distribution
    const languageDistribution = { 'Tiếng Anh': 0, 'Tiếng Hàn': 0, 'Tiếng Trung': 0 };
    results.forEach(r => {
      languageDistribution[r.language as keyof typeof languageDistribution]++;
    });

    // Skill type distribution
    const skillTypeDistribution = { 'Nghe': 0, 'Nói': 0, 'Đọc': 0, 'Viết': 0, 'Tổng hợp': 0 };
    results.forEach(r => {
      skillTypeDistribution[r.skill_type as keyof typeof skillTypeDistribution]++;
    });

    // Exam type distribution
    const examTypeDistribution = { 'Kiểm tra định kỳ': 0, 'Kiểm tra giữa kỳ': 0, 'Kiểm tra cuối kỳ': 0, 'Kiểm tra trình độ': 0, 'Thi thử chứng chỉ': 0 };
    results.forEach(r => {
      examTypeDistribution[r.exam_type as keyof typeof examTypeDistribution]++;
    });

    return {
      total_results: totalResults,
      average_score: Math.round(averageScore * 100) / 100, // Round to 2 decimal places
      pass_rate: Math.round(passRate * 100) / 100, // Round to 2 decimal places
      level_distribution: levelDistribution,
      language_distribution: languageDistribution,
      skill_type_distribution: skillTypeDistribution,
      exam_type_distribution: examTypeDistribution
    };
  }

  // Helper method để tính toán thống kê lớp học từ danh sách study results
  private calculateClassStatistics(results: StudyResultWithDetails[], classId: number): ClassStudyStatistics {
    const firstClass = results.length > 0 ? results[0].class : null;
    const studentScores = new Map<number, { student: any; scores: number[] }>();
    
    // Group by student and calculate scores
    results.forEach(result => {
      if (!studentScores.has(result.student_id)) {
        studentScores.set(result.student_id, {
          student: result.student,
          scores: []
        });
      }
      studentScores.get(result.student_id)!.scores.push(result.percentage);
    });

    // Calculate statistics
    // Lưu ý: totalStudents sẽ được cập nhật từ API call riêng để lấy số học viên thực tế từ class_students
    const totalStudents = studentScores.size; // Tạm thời giữ nguyên, sẽ được cập nhật bởi API call
    const totalExams = results.length;
    const averageScore = totalExams > 0 ? results.reduce((sum, r) => sum + r.percentage, 0) / totalExams : 0;
    const passRate = totalExams > 0 ? (results.filter(r => r.percentage >= 60).length / totalExams) * 100 : 0;

    // Level distribution
    const levelDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    results.forEach(r => {
      levelDistribution[r.level as keyof typeof levelDistribution]++;
    });

    // Top performers and needs improvement
    const studentAverages = Array.from(studentScores.values()).map(item => ({
      student_code: item.student?.student_code || '',
      full_name: item.student?.full_name || '',
      average_score: item.scores.reduce((sum, score) => sum + score, 0) / item.scores.length
    }));

    const topPerformers = studentAverages
      .sort((a, b) => b.average_score - a.average_score)
      .slice(0, 3);

    const needsImprovement = studentAverages
      .filter(item => item.average_score < 60)
      .sort((a, b) => a.average_score - b.average_score);

    return {
      class_id: classId,
      class_name: firstClass?.class_name || 'Unknown Class',
      class_code: firstClass?.class_code || 'UNK001',
      total_students: totalStudents, // Sẽ được cập nhật bởi getClassStudyStatistics
      total_exams: totalExams,
      average_score: averageScore,
      pass_rate: passRate,
      level_distribution: levelDistribution,
      top_performers: topPerformers,
      needs_improvement: needsImprovement
    };
  }

  // Helper method để tính toán student summary
  private calculateStudentSummary(results: StudyResultWithDetails[], studentId: number): StudentStudySummary {
    const studentResults = results.filter(r => r.student_id === studentId);
    
    if (studentResults.length === 0) {
      return {
        student_id: studentId,
        student_code: '',
        full_name: '',
        class_id: 0,
        class_name: '',
        class_code: '',
        total_exams: 0,
        average_score: 0,
        highest_score: 0,
        lowest_score: 0,
        pass_rate: 0,
        level_distribution: { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 },
        recent_results: [],
        proficiency_level: 'A1',
        overall_rating: 'Cần cải thiện'
      };
    }

    const firstResult = studentResults[0];
    const scores = studentResults.map(r => r.percentage);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const passRate = (studentResults.filter(r => r.percentage >= 60).length / studentResults.length) * 100;

    // Level distribution
    const levelDistribution = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
    studentResults.forEach(r => {
      levelDistribution[r.level as keyof typeof levelDistribution]++;
    });

    // Determine proficiency level based on average score
    let proficiencyLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'A1';
    if (averageScore >= 90) proficiencyLevel = 'C2';
    else if (averageScore >= 80) proficiencyLevel = 'C1';
    else if (averageScore >= 70) proficiencyLevel = 'B2';
    else if (averageScore >= 60) proficiencyLevel = 'B1';
    else if (averageScore >= 50) proficiencyLevel = 'A2';

    // Determine overall rating
    let overallRating: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Cần cải thiện' = 'Cần cải thiện';
    if (averageScore >= 90) overallRating = 'Xuất sắc';
    else if (averageScore >= 80) overallRating = 'Giỏi';
    else if (averageScore >= 70) overallRating = 'Khá';
    else if (averageScore >= 60) overallRating = 'Trung bình';

    return {
      student_id: studentId,
      student_code: firstResult.student?.student_code || '',
      full_name: firstResult.student?.full_name || '',
      class_id: firstResult.class_id,
      class_name: firstResult.class?.class_name || '',
      class_code: firstResult.class?.class_code || '',
      course_name: firstResult.class?.course_name,
      total_exams: studentResults.length,
      average_score: averageScore,
      highest_score: Math.max(...scores),
      lowest_score: Math.min(...scores),
      pass_rate: passRate,
      level_distribution: levelDistribution,
      recent_results: studentResults.slice(-5),
      proficiency_level: proficiencyLevel,
      overall_rating: overallRating
    };
  }

  // Helper method để tính toán level từ results
  private calculateLevelFromResults(results: StudyResultWithDetails[], language: string): { level: string; confidence: number } {
    const languageResults = results.filter(r => r.language === language);
    
    if (languageResults.length === 0) {
      return { level: 'A1', confidence: 0 };
    }

    // Tính toán level dựa trên điểm trung bình
    const averageScore = languageResults.reduce((sum, r) => sum + r.percentage, 0) / languageResults.length;
    
    let level = 'A1';
    let confidence = 0;

    if (averageScore >= 90) {
      level = 'C2';
      confidence = 95;
    } else if (averageScore >= 80) {
      level = 'C1';
      confidence = 90;
    } else if (averageScore >= 70) {
      level = 'B2';
      confidence = 85;
    } else if (averageScore >= 60) {
      level = 'B1';
      confidence = 80;
    } else if (averageScore >= 50) {
      level = 'A2';
      confidence = 75;
    } else {
      level = 'A1';
      confidence = 70;
    }

    return { level, confidence };
  }

  // ===== NEW METHODS FOR NORMALIZED DATABASE STRUCTURE =====

  // Exam Management with improved error handling
  createExam(exam: Exam): Observable<any> {
    // Validate exam data before sending
    if (!this.validateExamData(exam)) {
      return throwError(() => new Error('Invalid exam data'));
    }

    return this.http.post<any>(this.examApiUrl, exam, this.getAuthHeaders()).pipe(
      map(response => {
        // Extract exam ID from nested response structure
        let examId = null;
        
        if (response?.data?.data && typeof response.data.data === 'number') {
          // Case 1: response.data.data contains exam ID
          examId = response.data.data;
        } else if (response?.data && typeof response.data === 'number') {
          // Case 2: response.data contains exam ID
          examId = response.data;
        } else if (response?.id && typeof response.id === 'number') {
          // Case 3: response.id contains exam ID
          examId = response.id;
        } else if (response?.data?.id && typeof response.data.id === 'number') {
          // Case 4: response.data.id contains exam ID
          examId = response.data.id;
        }
        
        if (examId) {
          return {
            id: examId,
            ...exam,
            ...response
          };
        } else {
          throw new Error('Could not extract exam ID from server response');
        }
      }),
      catchError(this.handleHttpError.bind(this))
    );
  }

  getExams(filters?: StudyResultFilters): Observable<ExamWithSkills[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.class_id) params = params.set('class_id', filters.class_id.toString());
      if (filters.exam_type) params = params.set('exam_type', filters.exam_type);
      if (filters.language) params = params.set('language', filters.language);
      if (filters.date_from) params = params.set('date_from', filters.date_from);
      if (filters.date_to) params = params.set('date_to', filters.date_to);
      if (filters.search) params = params.set('search', filters.search);
    }


    return this.http.get<any>(this.examApiUrl, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      switchMap((examsRes) => {
        const exams = examsRes?.data ?? examsRes;
        
        if (!exams || exams.length === 0) {
          return of([]);
        }
        
        // Get exam IDs
        const examIds = exams.map((exam: any) => exam.id);
        
        // Load exam skills for these exams
        return this.getExamSkillsByExamIds(examIds).pipe(
          map((examSkills) => {
            
        // Merge exams with their skills (filter out soft-deleted skills)
        const examsWithSkills = exams.map((exam: any) => ({
          ...exam,
          exam_skills: examSkills.filter((skill: any) => {
            const isDeleted = skill.is_deleted;
            return skill.exam_id === exam.id && 
                   (!isDeleted || (isDeleted as any) !== 1 && (isDeleted as any) !== '1' && (isDeleted as any) !== true);
          })
        }));
        
        // ✅ CLIENT-SIDE FILTERING: Đảm bảo chỉ trả về exams của đúng lớp
        const filteredExams = examsWithSkills.filter((exam: any) => {
          const matchesClass = !filters?.class_id || exam.class_id === filters.class_id;
          return matchesClass;
        });
        
        return filteredExams;
          }),
          catchError((error) => {
            // Return exams without skills if skills loading fails
            console.warn('Failed to load exam skills, returning exams without skills:', error);
            return of(exams.map((exam: any) => ({
              ...exam,
              exam_skills: []
            })));
          })
        );
      }),
      catchError(this.handleHttpError.bind(this))
    );
  }

  // Public method to update a single exam skill
  updateSingleExamSkill(skillId: number, skill: ExamSkill): Observable<ExamSkill> {
    return this.updateExamSkill(skillId, skill);
  }

  // Reactivate soft-deleted exam skill using standard PUT API
  reactivateExamSkill(skillId: number, skillData: Partial<ExamSkill>): Observable<ExamSkill> {
    return this.http.put<any>(`${this.examSkillsApiUrl}/${skillId}`, skillData, this.getAuthHeaders()).pipe(
      map(response => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data as ExamSkill;
        }
        return response as ExamSkill;
      }),
      catchError(error => {
        console.error(`❌ Error reactivating exam skill with ID: ${skillId}:`, error);
        return throwError(() => error);
      })
    );
  }

  // Bulk update exam skills using specialized API
  bulkUpdateExamSkills(examId: number, skills: Partial<ExamSkill>[]): Observable<any> {
    return this.http.put<any>(`${this.examSkillsApiUrl}/bulk`, {
      exam_id: examId,
      skills: skills
    }, this.getAuthHeaders()).pipe(
      map(response => {
        if (response && typeof response === 'object' && 'data' in response) {
          return response.data;
        }
        return response;
      }),
      catchError(error => {
        console.error('Error bulk updating exam skills:', error);
        return throwError(() => error);
      })
    );
  }
  getExamSkillsByExamIds(examIds: number[]): Observable<ExamSkill[]> {
    if (examIds.length === 0) {
      return of([]);
    }
    
    // ✅ Use ExamSkillsService instead of direct HTTP call
    return this.examSkillsService.getExamSkills({
      exam_id: examIds,
      include_deleted: true
    }).pipe(
      map(skills => {
        // Return all skills, analyzeSkillChanges will handle filtering based on is_deleted status
        return skills;
      }),
      catchError(error => {
        console.error('Error fetching exam skills:', error);
        return of([]);
      })
    );
  }

  // Update exam status
  updateExamStatus(examId: number, newStatus: string): Observable<any> {
    const url = `http://localhost:10093/api/exams/${examId}`;
    const updateData = { status: newStatus };
    
    return this.http.put(url, updateData, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.code === 'success') {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to update exam status');
        }
      }),
      catchError(error => {
        console.error('Error updating exam status:', error);
        return throwError(() => error);
      })
    );
  }

  // Get exam status history (for audit logging)
  getExamStatusHistory(examId: number): Observable<any[]> {
    const url = `http://localhost:10093/api/exams/${examId}/status-history`;
    
    return this.http.get(url, this.getAuthHeaders()).pipe(
      map((response: any) => {
        if (response.success) {
          return response.data || [];
        } else {
          throw new Error(response.message || 'Failed to get exam status history');
        }
      }),
      catchError(error => {
        console.error('Error getting exam status history:', error);
        return throwError(() => error);
      })
    );
  }

  getExamById(id: number): Observable<ExamWithSkills> {
    return this.http.get<ExamWithSkills>(`${this.examApiUrl}/${id}`, this.getAuthHeaders());
  }

  updateExam(id: number, exam: Exam): Observable<Exam> {
    return this.http.put<Exam>(`${this.examApiUrl}/${id}`, exam, this.getAuthHeaders());
  }

  // Update exam with skills
  updateExamWithSkills(examId: number, exam: Exam, skills: Omit<ExamSkill, 'id' | 'exam_id'>[]): Observable<ExamWithSkills> {
    // Step 1: Update exam basic info
    return this.updateExam(examId, exam).pipe(
      switchMap((updatedExam) => {
        
        // Step 2: Get current exam skills to compare
        return this.getExamSkillsByExamIds([examId]).pipe(
          switchMap((currentSkills) => {
            
            // Step 3: Update skills using simple approach (delete all, then create new)
            return this.updateExamSkillsSimple(examId, skills).pipe(
              map((updatedSkills) => {
                const examWithSkills: ExamWithSkills = {
                  ...updatedExam,
                  exam_skills: updatedSkills
                };
                return examWithSkills;
              })
            );
          }),
          catchError((error) => {
            console.error('Error updating skills:', error);
            // If skills update fails, return exam without skills
            return of({ ...updatedExam, exam_skills: [] } as ExamWithSkills);
          })
        );
      })
    );
  }

  // Alternative approach: Delete all skills first, then create new ones
  private updateExamSkillsSimple(examId: number, newSkills: Omit<ExamSkill, 'id' | 'exam_id'>[]): Observable<ExamSkill[]> {
    
    // Get current skills first
    return this.getExamSkillsByExamIds([examId]).pipe(
      switchMap((currentSkills) => {
        
        // Delete existing skills one by one
        let deleteChain: Observable<any> = of(null);
        for (const skill of currentSkills) {
          deleteChain = deleteChain.pipe(
            switchMap(() => this.deleteExamSkill(skill.id!))
          );
        }
        
        // Then create new skills
        return deleteChain.pipe(
          switchMap(() => {
            
            if (!newSkills || newSkills.length === 0) {
              return of([]);
            }
            
            // Create skills one by one to identify which one fails
            let createChain: Observable<any> = of([]);
            for (const skill of newSkills) {
              const skillWithExamId = {
                ...skill,
                exam_id: examId
              };
              
              createChain = createChain.pipe(
                switchMap((createdSkills: ExamSkill[]) => 
                  this.createExamSkill(skillWithExamId).pipe(
                    map(newSkill => [...createdSkills, newSkill]),
                    catchError(error => {
                      console.error(`Failed to create skill ${skill.skill_type}:`, error);
                      // Continue with other skills even if one fails
                      return of(createdSkills);
                    })
                  )
                )
              );
            }
            
            return createChain;
          })
        );
      }),
      catchError((error) => {
        console.error('Error in simple update:', error);
        return throwError(() => error);
      })
    );
  }

  // Update exam skills by comparing current vs new skills
  private updateExamSkillsComparison(examId: number, currentSkills: ExamSkill[], newSkills: Omit<ExamSkill, 'id' | 'exam_id'>[]): Observable<ExamSkill[]> {
    
    // If no new skills requested, delete all current skills
    if (!newSkills || newSkills.length === 0) {
      return this.deleteAllExamSkills(examId).pipe(
        map(() => []),
        catchError((error) => {
          console.error('Error deleting all skills:', error);
          return of([]);
        })
      );
    }
    
    // Step 1: Find skills to delete (exist in current but not in new)
    const skillsToDelete = currentSkills.filter(currentSkill => 
      !newSkills.some(newSkill => newSkill.skill_type === currentSkill.skill_type)
    );
    
    // Step 2: Find skills to create (exist in new but not in current)
    const skillsToCreate = newSkills.filter(newSkill => 
      !currentSkills.some(currentSkill => currentSkill.skill_type === newSkill.skill_type)
    );
    
    // Step 3: Find skills to update (exist in both but with different values)
    const skillsToUpdate = newSkills.filter(newSkill => {
      const currentSkill = currentSkills.find(cs => cs.skill_type === newSkill.skill_type);
      if (!currentSkill) return false;
      
      // Compare values (convert to numbers for comparison)
      const currentMaxScore = parseFloat(currentSkill.max_score.toString());
      const newMaxScore = parseFloat(newSkill.max_score.toString());
      const currentWeight = parseFloat(currentSkill.weight.toString());
      const newWeight = parseFloat(newSkill.weight.toString());
      
      return (
        Math.abs(currentMaxScore - newMaxScore) > 0.01 ||
        Math.abs(currentWeight - newWeight) > 0.01 ||
        currentSkill.order_index !== newSkill.order_index
      );
    });
    
    
    // Execute operations sequentially to avoid race conditions
    let operationChain: Observable<any> = of(null);
    
    // Delete operations first
    for (const skill of skillsToDelete) {
      operationChain = operationChain.pipe(
        switchMap(() => this.deleteExamSkill(skill.id!))
      );
    }
    
    // Then create operations
    for (const skill of skillsToCreate) {
      operationChain = operationChain.pipe(
        switchMap(() => this.createExamSkill({
          ...skill,
          exam_id: examId
        }))
      );
    }
    
    // Finally update operations
    for (const skill of skillsToUpdate) {
      const currentSkill = currentSkills.find(cs => cs.skill_type === skill.skill_type);
      if (currentSkill) {
        operationChain = operationChain.pipe(
          switchMap(() => this.updateExamSkill(currentSkill.id!, {
            ...skill,
            exam_id: examId
          }))
        );
      }
    }
    
    // If no operations needed, return current skills
    if (skillsToDelete.length === 0 && skillsToCreate.length === 0 && skillsToUpdate.length === 0) {
      return of(currentSkills);
    }
    
    // Execute all operations sequentially
    return operationChain.pipe(
      switchMap(() => {
        // Fetch updated skills from server
        return this.getExamSkillsByExamIds([examId]);
      }),
      catchError((error) => {
        console.error('Error updating exam skills:', error);
        // If update fails, return current skills as fallback
        return of(currentSkills);
      })
    );
  }

  deleteExam(id: number): Observable<void> {
    return this.http.delete<void>(`${this.examApiUrl}/${id}`, this.getAuthHeaders());
  }

  // Delete all skills for a specific exam
  private deleteExamSkills(examId: number): Observable<void> {
    // Use dynamic endpoint to delete skills by exam_id
    return this.http.delete<void>(`${this.examSkillsApiUrl}?exam_id=${examId}`, this.getAuthHeaders());
  }

  // Delete all skills for a specific exam (alternative method)
  private deleteAllExamSkills(examId: number): Observable<void> {
    // Use dynamic endpoint to delete skills by exam_id
    return this.http.delete<void>(`${this.examSkillsApiUrl}?exam_id=${examId}`, this.getAuthHeaders());
  }

  // Soft delete a single skill by ID (set is_deleted = 1)
  deleteExamSkill(skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.examSkillsApiUrl}/${skillId}`, this.getAuthHeaders()).pipe(
      map(() => {
        // Successfully deleted
      }),
      catchError(error => {
        console.error(`❌ Error soft deleting exam skill with ID: ${skillId}`, error);
        return throwError(() => error);
      })
    );
  }

  // Update a single skill by ID
  private updateExamSkill(skillId: number, skill: ExamSkill): Observable<ExamSkill> {
    return this.http.put<ExamSkill>(`${this.examSkillsApiUrl}/${skillId}`, skill, this.getAuthHeaders());
  }

  // Bulk Exam Creation with Results
  createBulkExam(bulkData: BulkExamCreation): Observable<ExamWithSkills> {
    // Step 1: Create exam first
    return this.createExam(bulkData.exam).pipe(
      switchMap((examResponse) => {
        
        // Extract exam data from response
        let createdExam;
        
        if (examResponse.data && typeof examResponse.data === 'object' && examResponse.data.id) {
          // Case 1: data contains exam object
          createdExam = examResponse.data;
        } else if (examResponse.data && typeof examResponse.data === 'number') {
          // Case 2: data contains only exam ID
          createdExam = { id: examResponse.data };
        } else if (examResponse.data && typeof examResponse.data === 'object' && examResponse.data.data && typeof examResponse.data.data === 'number') {
          // Case 2.5: nested data structure - data.data contains exam ID
          createdExam = { id: examResponse.data.data };
        } else if (examResponse.id) {
          // Case 3: examResponse is the exam object itself
          createdExam = examResponse;
        } else {
          // Case 4: Try to extract from any possible structure
          createdExam = examResponse.data || examResponse;
        }
        
        
        // Step 2: Create exam skills
        if (!createdExam.id) {
          console.error('Exam ID is missing. Full exam object:', createdExam);
          throw new Error('Exam ID is required to create skills');
        }
        
        const skillsWithExamId = bulkData.skills.map(skill => ({
          ...skill,
          exam_id: createdExam.id!
        }));
        
        
        // Create all skills
        const skillPromises = skillsWithExamId.map(skill => 
          this.createExamSkill(skill).toPromise()
        );
        
        return new Observable<ExamWithSkills>(observer => {
          Promise.all(skillPromises)
            .then((createdSkills) => {
              const examWithSkills: ExamWithSkills = {
                ...createdExam,
                exam_skills: createdSkills.filter(skill => skill !== undefined) as ExamSkill[]
              };
              observer.next(examWithSkills);
              observer.complete();
            })
            .catch(error => {
              console.error('Error creating skills:', error);
              observer.error(error);
            });
        });
      })
    );
  }

  // Helper method to create exam skill using ExamSkillsService
  createExamSkill(skill: ExamSkill): Observable<ExamSkill> {
    // Validate required fields
    if (!skill.exam_id) {
      console.error('Missing exam_id in skill:', skill);
      return throwError(() => new Error('exam_id is required'));
    }
    if (!skill.skill_type) {
      console.error('Missing skill_type in skill:', skill);
      return throwError(() => new Error('skill_type is required'));
    }
    
    // ✅ IMPROVED LOGIC: Check for existing skill first (including soft-deleted)
    return this.getExistingExamSkill(skill.exam_id, skill.skill_type).pipe(
      switchMap(existingSkill => {
        if (existingSkill) {
          if (existingSkill.is_deleted === 1) {
            // ✅ REACTIVATE SOFT-DELETED SKILL
            const dataToReactivate: Partial<ExamSkill> = {
              exam_id: skill.exam_id,
              skill_type: skill.skill_type,
              max_score: skill.max_score,
              weight: skill.weight,
              order_index: skill.order_index,
              is_deleted: 0 // ✅ Đảm bảo is_deleted = 0
            };
            
            // Lọc bỏ các giá trị undefined
            Object.keys(dataToReactivate).forEach(key => {
              if (dataToReactivate[key as keyof ExamSkill] === undefined) {
                delete dataToReactivate[key as keyof ExamSkill];
              }
            });
            
            return this.reactivateExamSkill(existingSkill.id!, dataToReactivate);
          } else {
            // Skill already exists and is active - update if needed
            
            // Check if we need to update properties
            if (existingSkill.max_score !== skill.max_score || 
                existingSkill.weight !== skill.weight || 
                existingSkill.order_index !== skill.order_index) {
              
              return this.updateSingleExamSkill(existingSkill.id!, {
                ...existingSkill,
                max_score: skill.max_score,
                weight: skill.weight,
                order_index: skill.order_index
              });
            }
            
            // Return existing skill if no changes needed
            return of(existingSkill);
          }
        } else {
          // ✅ CREATE NEW SKILL
          return this.examSkillsService.createExamSkill(skill);
        }
      }),
      map((response: ExamSkill) => {
        return response;
      }),
      catchError((error) => {
        console.error('Error creating exam skill:', error);
        console.error('Error details:', error.error);
        
        // Check if it's a duplicate entry error (fallback for edge cases)
        const isDuplicateError = error.status === 500 && (
          error.error?.error?.includes('Duplicate entry') ||
          error.error?.message?.includes('Duplicate entry') ||
          error.message?.includes('Duplicate entry') ||
          (error.error && typeof error.error === 'string' && error.error.includes('Duplicate entry')) ||
          error.error?.error?.includes('unique_exam_skill') ||
          error.error?.message?.includes('unique_exam_skill')
        );
        
        if (isDuplicateError) {
          console.warn(`⚠️ Duplicate entry detected for skill ${skill.skill_type} - attempting reactivation`);
          
          // Try to reactivate the soft-deleted skill
          return this.reactivateSoftDeletedSkill(skill);
        }
        
        return throwError(() => error);
      })
    );
  }


  // Get existing exam skill by exam_id and skill_type (public method)
  getExistingExamSkill(examId: number, skillType: string): Observable<ExamSkill | null> {
    // Validate examId
    if (!examId || examId === undefined || examId === null) {
      console.error(`❌ Invalid examId: ${examId}`);
      return of(null);
    }
    
    // Use ExamSkillsService to get existing skill (including soft-deleted)
    return this.examSkillsService.getExistingExamSkill(examId, skillType).pipe(
      map((skill: ExamSkill | null) => {
        return skill;
      }),
      catchError(error => {
        console.error(`❌ StudyResultService.getExistingExamSkill - Error:`, error);
        return of(null);
      })
    );
  }

  // ✅ NEW METHOD: Reactivate soft-deleted skill (fallback method)
  private reactivateSoftDeletedSkill(skill: ExamSkill): Observable<ExamSkill> {
    return this.getExistingExamSkill(skill.exam_id!, skill.skill_type!).pipe(
      switchMap(existingSkill => {
        if (existingSkill && existingSkill.is_deleted === 1) {
          const dataToReactivate: Partial<ExamSkill> = {
            exam_id: skill.exam_id,
            skill_type: skill.skill_type,
            max_score: skill.max_score,
            weight: skill.weight,
            order_index: skill.order_index,
            is_deleted: 0 // ✅ Đảm bảo is_deleted = 0
          };
          
          // Lọc bỏ các giá trị undefined
          Object.keys(dataToReactivate).forEach(key => {
            if (dataToReactivate[key as keyof ExamSkill] === undefined) {
              delete dataToReactivate[key as keyof ExamSkill];
            }
          });
          
          return this.reactivateExamSkill(existingSkill.id!, dataToReactivate);
        } else if (existingSkill && existingSkill.is_deleted === 0) {
          return of(existingSkill);
        } else {
          return throwError(() => new Error(`No soft-deleted skill found to reactivate: ${skill.skill_type}`));
        }
      }),
      catchError(error => {
        console.error(`❌ Error reactivating soft-deleted skill:`, error);
        return throwError(() => error);
      })
    );
  }
  getExamResultsBySkills(studentId?: number, examId?: number, classId?: number): Observable<ExamResultsBySkills[]> {
    let params = new HttpParams();
    
    if (studentId) params = params.set('student_id', studentId.toString());
    if (examId) params = params.set('exam_id', examId.toString());
    if (classId) params = params.set('class_id', classId.toString());

    return this.http.get<any>(`${this.examApiUrl}/results-by-skills`, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Get Student Exam Summary (new structure)
  getStudentExamSummary(studentId: number, classId?: number): Observable<StudentExamSummary> {
    let params = new HttpParams().set('student_id', studentId.toString());
    if (classId) params = params.set('class_id', classId.toString());
    
    return this.http.get<any>(`${this.examApiUrl}/student-summary`, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Get Class Exam Statistics (new structure)
  getClassExamStatistics(classId: number): Observable<ExamStatistics[]> {
    const params = new HttpParams().set('class_id', classId.toString());
    
    return this.http.get<any>(`${this.examApiUrl}/class-statistics`, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Individual Exam Result Management
  createExamResult(examResult: ExamResult): Observable<ExamResult> {
    return this.http.post<ExamResult>(`${this.examApiUrl}/results`, examResult, this.getAuthHeaders());
  }

  updateExamResult(id: number, examResult: ExamResult): Observable<ExamResult> {
    return this.http.put<ExamResult>(`${this.examApiUrl}/results/${id}`, examResult, this.getAuthHeaders());
  }

  deleteExamResult(id: number): Observable<void> {
    return this.http.delete<void>(`${this.examApiUrl}/results/${id}`, this.getAuthHeaders());
  }

  // Bulk Update Exam Results for a specific exam
  bulkUpdateExamResults(examId: number, results: ExamResult[]): Observable<ExamResult[]> {
    return this.http.put<ExamResult[]>(`${this.examApiUrl}/${examId}/results/bulk`, results, this.getAuthHeaders());
  }

  // Get Exam Results for a specific exam
  getExamResults(examId: number): Observable<ExamResultWithDetails[]> {
    return this.http.get<any>(`${this.examApiUrl}/${examId}/results`, this.getAuthHeaders()).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Get Student Results for a specific exam
  getStudentExamResults(examId: number, studentId: number): Observable<ExamResultWithDetails[]> {
    const params = new HttpParams()
      .set('student_id', studentId.toString());
    
    return this.http.get<any>(`${this.examApiUrl}/${examId}/results`, { 
      ...this.getAuthHeaders(), 
      params 
    }).pipe(
      map((res) => res?.data ?? res)
    );
  }

  // Helper method to convert legacy StudyResult to new structure
  convertLegacyToNew(legacyResults: StudyResultWithDetails[]): ExamResultsBySkills[] {
    const examMap = new Map<string, ExamResultsBySkills>();
    
    legacyResults.forEach(result => {
      const examKey = `${result.exam_name}_${result.exam_type}_${result.exam_date}_${result.class_id}_${result.language}`;
      
      if (!examMap.has(examKey)) {
        examMap.set(examKey, {
          exam_id: 0, // Will be set by backend
          exam_name: result.exam_name,
          exam_type: result.exam_type,
          exam_date: result.exam_date,
          language: result.language,
          listening_score: 0,
          listening_percentage: 0,
          speaking_score: 0,
          speaking_percentage: 0,
          reading_score: 0,
          reading_percentage: 0,
          writing_score: 0,
          writing_percentage: 0,
          overall_average: 0,
          overall_level: result.level
        });
      }
      
      const examResult = examMap.get(examKey)!;
      
      // Map skill types to the appropriate fields
      switch (result.skill_type) {
        case 'Nghe':
          examResult.listening_score = result.score;
          examResult.listening_percentage = result.percentage;
          break;
        case 'Nói':
          examResult.speaking_score = result.score;
          examResult.speaking_percentage = result.percentage;
          break;
        case 'Đọc':
          examResult.reading_score = result.score;
          examResult.reading_percentage = result.percentage;
          break;
        case 'Viết':
          examResult.writing_score = result.score;
          examResult.writing_percentage = result.percentage;
          break;
      }
      
      // Calculate overall average
      const scores = [
        examResult.listening_percentage,
        examResult.speaking_percentage,
        examResult.reading_percentage,
        examResult.writing_percentage
      ].filter(score => score > 0);
      
      examResult.overall_average = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
    });
    
    return Array.from(examMap.values());
  }

  // Helper method to convert new structure to legacy format (for backward compatibility)
  convertNewToLegacy(examResults: ExamResultsBySkills[]): StudyResultWithDetails[] {
    const legacyResults: StudyResultWithDetails[] = [];
    
    examResults.forEach(examResult => {
      const skills = [
        { type: 'Nghe', score: examResult.listening_score, percentage: examResult.listening_percentage },
        { type: 'Nói', score: examResult.speaking_score, percentage: examResult.speaking_percentage },
        { type: 'Đọc', score: examResult.reading_score, percentage: examResult.reading_percentage },
        { type: 'Viết', score: examResult.writing_score, percentage: examResult.writing_percentage }
      ];
      
      skills.forEach(skill => {
        if (skill.score > 0) {
          legacyResults.push({
            id: 0, // Will be set by backend
            student_id: 0, // Will be set by backend
            class_id: 0, // Will be set by backend
            exam_type: examResult.exam_type as any,
            exam_name: examResult.exam_name,
            exam_date: examResult.exam_date,
            language: examResult.language as any,
            skill_type: skill.type as any,
            score: skill.score,
            max_score: 100, // Default
            percentage: skill.percentage,
            level: examResult.overall_level as any,
            teacher_comment: '',
            student_feedback: '',
            student: { student_code: '', full_name: '' },
            class: { class_name: '', class_code: '' }
          });
        }
      });
    });
    
    return legacyResults;
  }

  // ===== VALIDATION AND ERROR HANDLING METHODS =====

  private validateExamData(exam: Exam): boolean {
    if (!exam) return false;
    if (!exam.class_id || exam.class_id <= 0) return false;
    if (!exam.exam_name || exam.exam_name.trim().length === 0) return false;
    if (!exam.exam_type) return false;
    if (!exam.language) return false;
    if (!exam.exam_date) return false;
    if (!exam.total_max_score || exam.total_max_score <= 0) return false;
    
    return true;
  }

  private handleHttpError(error: any): Observable<never> {
    console.error('HTTP Error:', error);
    
    // Create a more descriptive error object
    const errorMessage = this.getErrorMessage(error);
    const customError = new Error(errorMessage);
    
    // Add additional properties to the error
    (customError as any).status = error.status;
    (customError as any).statusText = error.statusText;
    (customError as any).url = error.url;
    
    return throwError(() => customError);
  }

  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else if (error.status === 400) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
    } else if (error.status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    } else if (error.status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này.';
    } else if (error.status === 404) {
      return 'Không tìm thấy dữ liệu yêu cầu.';
    } else if (error.status === 409) {
      return 'Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.';
    } else if (error.status === 422) {
      return 'Dữ liệu không đúng định dạng. Vui lòng kiểm tra lại.';
    } else if (error.status === 500) {
      return 'Lỗi server. Vui lòng thử lại sau.';
    } else if (error.status === 503) {
      return 'Server đang bảo trì. Vui lòng thử lại sau.';
    } else {
      return error.message || 'Đã xảy ra lỗi không xác định.';
    }
  }

  // Retry mechanism for failed requests
  private retryRequest<T>(request: Observable<T>, maxRetries: number = 3): Observable<T> {
    return request.pipe(
      catchError((error, caught) => {
        if (maxRetries > 0 && this.isRetryableError(error)) {
          return this.retryRequest(request, maxRetries - 1);
        }
        return throwError(() => error);
      })
    );
  }

  private isRetryableError(error: any): boolean {
    // Only retry on network errors or 5xx server errors
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  // ===== ORGANIZATION-LEVEL ANALYTICS METHODS =====

  // Get organization-wide summary (total classes, students, average scores)
  getOrganizationSummary(): Observable<any> {
    return forkJoin({
      classes: this.http.get<any>(`${this.baseApiUrl}/classes`, this.getAuthHeaders()),
      students: this.http.get<any>(`${this.baseApiUrl}/students`, this.getAuthHeaders()),
      exams: this.http.get<any>(`${this.examApiUrl}`, this.getAuthHeaders())
    }).pipe(
      map(({ classes, students, exams }) => {
        const classesData = classes?.data ?? classes;
        const studentsData = students?.data ?? students;
        const examsData = exams?.data ?? exams;

        const uniqueClasses = Array.isArray(classesData) ? classesData : [];
        const uniqueStudents = Array.isArray(studentsData) ? studentsData : [];
        const examsArray = Array.isArray(examsData) ? examsData : [];

        const totalStudents = uniqueStudents.length;

        const validExams = examsArray.filter((exam: any) => {
          const score = exam.average_score;
          return score != null && score !== undefined && !isNaN(score) && isFinite(score);
        });
        const totalExams = validExams.length;
        
        const averageScore = totalExams > 0
          ? validExams.reduce((sum: number, exam: any) => {
              const score = parseFloat(exam.average_score);
              return sum + (isNaN(score) ? 0 : score);
            }, 0) / totalExams
          : 0;

        const passRate = totalExams > 0
          ? (validExams.filter((exam: any) => exam.average_score >= 60).length / totalExams) * 100
          : 0;

        return {
          total_classes: uniqueClasses.length,
          total_students: totalStudents,
          total_exams: totalExams,
          average_score: Math.round(averageScore * 100) / 100,
          pass_rate: Math.round(passRate * 100) / 100
        };
      }),
      catchError(this.handleHttpError.bind(this))
    );
  }

  // Get class-level analytics with average scores
  getClassAnalytics(): Observable<any[]> {
    return forkJoin({
      classes: this.http.get<any>(`${this.baseApiUrl}/classes`, this.getAuthHeaders()),
      exams: this.http.get<any>(`${this.examApiUrl}`, this.getAuthHeaders()),
      classStudents: this.http.get<any>(`${this.baseApiUrl}/class_students`, this.getAuthHeaders())
    }).pipe(
      map(({ classes, exams, classStudents }) => {
        const classesData = Array.isArray(classes?.data) ? classes.data : Array.isArray(classes) ? classes : [];
        const examsData = Array.isArray(exams?.data) ? exams.data : Array.isArray(exams) ? exams : [];
        const classStudentsData = Array.isArray(classStudents?.data) ? classStudents.data : Array.isArray(classStudents) ? classStudents : [];

        // Group students by class
        const studentsByClass = new Map<number, number>();
        classStudentsData.forEach((cs: any) => {
          const classId = cs.class_id || cs.classId;
          if (classId) {
            studentsByClass.set(classId, (studentsByClass.get(classId) || 0) + 1);
          }
        });

        // Group exams by class and calculate statistics
        const classMap = new Map<number, any>();
        classesData.forEach((cls: any) => {
          classMap.set(cls.id, {
            id: cls.id,
            class_name: cls.class_name || '',
            class_code: cls.class_code || '',
            total_exams: 0,
            total_students: studentsByClass.get(cls.id) || 0,
            validScores: [] as number[]  // Array để lưu các điểm hợp lệ
          });
        });

        // Tính tổng số exam và điểm hợp lệ
        examsData.forEach((exam: any) => {
          const classId = exam.class_id || exam.classId;
          if (classId && classMap.has(classId)) {
            const classData = classMap.get(classId)!;
            // Chỉ tính exam có average_score hợp lệ
            if (exam.average_score != null && exam.average_score != undefined && !isNaN(exam.average_score)) {
              classData.validScores.push(parseFloat(exam.average_score));
            }
            // Tổng số bài thi (kể cả không có điểm)
            classData.total_exams++;
          }
        });

        // Tính điểm trung bình từ các điểm hợp lệ
        return Array.from(classMap.values()).map(cls => {
          let average_score = 0;
          if (cls.validScores.length > 0) {
            const sum = cls.validScores.reduce((acc: number, score: number) => acc + score, 0);
            average_score = sum / cls.validScores.length;
          }

          return {
            id: cls.id,
            class_name: cls.class_name,
            class_code: cls.class_code,
            total_students: cls.total_students,
            total_exams: cls.total_exams,
            average_score: Math.round(average_score * 100) / 100
          };
        });
      }),
      catchError(error => {
        console.error('Error getting class analytics:', error);
        return of([]);
      })
    );
  }

  // Get skill comparison across all classes
  getSkillAnalytics(): Observable<any> {
    return this.http.get<any>(`${this.examApiUrl}`, this.getAuthHeaders()).pipe(
      switchMap((examsRes) => {
        const exams = examsRes?.data ?? examsRes;
        if (!exams || exams.length === 0) {
          return of({ skill_averages: {}, skill_distribution: {} });
        }

        const examIds = exams.map((exam: any) => exam.id);
        return this.getExamSkillsByExamIds(examIds).pipe(
          map((examSkills) => {
            const skillTypes = ['Nghe', 'Nói', 'Đọc', 'Viết', 'Tổng hợp'];
            const skillAverages: any = {};
            const skillDistribution: any = {};

            skillTypes.forEach(skillType => {
              const skills = examSkills.filter((skill: any) => skill.skill_type === skillType);
              skillAverages[skillType] = skills.length;
              skillDistribution[skillType] = skills.length;
            });

            return {
              skill_averages: skillAverages,
              skill_distribution: skillDistribution
            };
          })
        );
      }),
      catchError(error => {
        console.error('Error getting skill analytics:', error);
        return of({ skill_averages: {}, skill_distribution: {} });
      })
    );
  }
}
