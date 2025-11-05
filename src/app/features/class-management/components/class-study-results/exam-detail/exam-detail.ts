import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, Observable, forkJoin, throwError, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Services and Models
import { StudyResultService } from '../../../../study-results/services/study-result.service';
import { ClassService } from '../../../services/class.service';
import { ClassStudentService } from '../../../services/class-student.service';
import { StudentService } from '../../../../students-management/services/student.service'; 
import { ExamManagementService } from '../../../services/exam-management.service';
import { ExamService } from '../../../services/exam.service';
import { ExamResultsService } from '../../../services/exam-results.service';
import { ExamSkillsService } from '../../../../study-results/services/exam-skills.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ExamSkill } from '../../../../study-results/models/exam-results.model';

interface ExamDetailData {
  id: number;
  exam_name: string;
  exam_type: string;
  skill_type: string;
  exam_date: string;
  language: string;
  max_score: number;
  class_id: number;
  class_name: string;
  status: 'draft' | 'in_progress' | 'review' | 'published';
  approved_by?: number;
  approved_at?: string;
  approved_by_name?: string;
}

interface StudentScore {
  student_id: number;
  student_code: string;
  full_name: string;
  email: string;
  score: number;
  percentage: number;
  teacher_comment: string;
  student_feedback: string;
  // Điểm các kỹ năng (nếu bài kiểm tra có nhiều kỹ năng)
  listening_score?: number;
  listening_percentage?: number;
  speaking_score?: number;
  speaking_percentage?: number;
  reading_score?: number;
  reading_percentage?: number;
  writing_score?: number;
  writing_percentage?: number;
  synthesis_score?: number;  // Điểm Tổng hợp
  synthesis_percentage?: number;
}

@Component({
  selector: 'app-exam-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    RippleModule,
    TagModule,
    ToastModule,
    TableModule,
    InputNumberModule,
    CardModule,
    InputTextModule,
    ConfirmDialogModule
  ],
  templateUrl: './exam-detail.html',
  styleUrls: ['./exam-detail.scss'],
  providers: [ConfirmationService]
})
export class ExamDetail implements OnInit, OnDestroy {
  examDetail: ExamDetailData | null = null;
  studentScores: StudentScore[] = [];
  loading: boolean = false;
  classId: number | null = null;
  examId: number | null = null;
  examSkillId: number | null = null;
  
  // Danh sách skills của bài kiểm tra
  examSkills: ExamSkill[] = [];
  hasMultipleSkills: boolean = false;
  
  // Edit mode
  isEditMode: boolean = false;
  editedScores: { [key: number | string]: number } = {};
  editedComments: { [key: number]: string } = {};
  
  // Statistics
  averageScore: number = 0;
  passRate: number = 0;
  totalStudents: number = 0;
  studentsWithScores: number = 0;
  
  // User role and permissions
  currentUserRole: number | null = null;
  isAdmin: boolean = false;
  isTeacher: boolean = false;
  
  // Special edit mode for admin
  isSpecialEditMode: boolean = false;
  specialEditReason: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studyResultService: StudyResultService,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private studentService: StudentService,
    private examManagementService: ExamManagementService,
    private examService: ExamService,
    private examResultsService: ExamResultsService,
    private examSkillsService: ExamSkillsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Load user role first
    this.loadUserRole();
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        // Reset state before loading new data to prevent data overlap
        this.resetComponentState();
        
        this.classId = +params['id'];
        this.examId = +params['examId'];
        this.examSkillId = +params['examSkillId'] || null;
        
        if (this.examSkillId) {
          // Nếu có examSkillId, load từ exam_skills để xem kỹ năng nào và lớp nào
          this.loadExamDetailFromSkill();
        } else if (this.classId && this.examId) {
          // Nếu không có examSkillId, load từ exam ID với class context
          this.loadExamDetail();
        }
      });
  }

  private resetComponentState(): void {
    // Reset all component state to prevent data overlap
    this.examDetail = null;
    this.studentScores = [];
    this.examSkills = [];
    this.hasMultipleSkills = false;
    this.isEditMode = false;
    this.editedScores = {};
    this.editedComments = {};
    this.averageScore = 0;
    this.passRate = 0;
    this.totalStudents = 0;
    this.studentsWithScores = 0;
    this.isSpecialEditMode = false;
    this.specialEditReason = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserRole(): void {
    this.currentUserRole = this.authService.getRole();
    
    // Giả định: Role 1 = Admin, Role 2 = Teacher (có thể cần điều chỉnh theo hệ thống)
    this.isAdmin = this.currentUserRole === 1;
    this.isTeacher = this.currentUserRole === 2;
  }

  loadExamDetailFromSkill(): void {
    if (!this.examSkillId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID kỹ năng bài kiểm tra'
      });
      return;
    }

    this.loading = true;
    
    // Lấy thông tin từ exam_skills trước
    this.examSkillsService.getExamSkillById(this.examSkillId).subscribe({
      next: (examSkill) => {
        // Lấy thông tin exam từ exam_id
        this.examService.getExamById(examSkill.exam_id).subscribe({
          next: (exam) => {
            
            // Lấy thông tin lớp học
            this.classService.getClassById(exam.class_id).subscribe({
              next: (classData) => {
                this.examDetail = {
                  id: exam.id,
                  exam_name: exam.exam_name,
                  exam_type: exam.exam_type,
                  skill_type: examSkill.skill_type,
                  exam_date: exam.exam_date,
                  language: exam.language,
                  max_score: this.formatScore(examSkill.max_score),
                  class_id: exam.class_id,
                  class_name: classData?.class_name || 'Không xác định',
                  status: this.mapExamStatus(exam.status),
                  approved_by: exam.approved_by,
                  approved_at: exam.approved_at,
                  approved_by_name: exam.approved_by_name
                };
                
                // Set classId và examId để load student scores
                this.classId = exam.class_id;
                this.examId = exam.id;
                
                this.loadStudentScoresFromSkill();
              },
              error: (error) => {
                this.loading = false;
                this.messageService.add({
                  severity: 'error',
                  summary: 'Lỗi',
                  detail: 'Không thể tải thông tin lớp học: ' + (error.message || 'Lỗi không xác định')
                });
              }
            });
          },
          error: (error) => {
            this.loading = false;
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể tải thông tin bài kiểm tra: ' + (error.message || 'Lỗi không xác định')
            });
          }
        });
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin kỹ năng bài kiểm tra: ' + (error.message || 'Lỗi không xác định')
        });
      }
    });
  }

  loadExamDetailFromStudyResults(): void {
    if (!this.examId || !this.classId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID bài kiểm tra hoặc ID lớp học'
      });
      return;
    }

    this.loading = true;
    
    // Lấy từ study_results thay vì exams
    this.studyResultService.getStudyResultsWithDetails({ 
      class_id: this.classId!,
      search: this.examId?.toString() || ''
    }).subscribe({
      next: (studyResults) => {
        if (studyResults.length > 0) {
          const firstResult = studyResults[0];
          
          this.examDetail = {
            id: (firstResult as any).exam_id || this.examId!,
            exam_name: firstResult.exam_name || 'Không xác định',
            exam_type: firstResult.exam_type || 'Không xác định',
            skill_type: firstResult.skill_type || 'Tổng hợp',
            exam_date: firstResult.exam_date || '',
            language: firstResult.language || 'Không xác định',
            max_score: this.formatScore(firstResult.max_score || 100),
            class_id: firstResult.class_id || this.classId!,
            class_name: 'Không xác định',
            status: 'in_progress', // Map from 'active' to 'in_progress'
            approved_by: undefined,
            approved_at: undefined,
            approved_by_name: undefined
          };
          
          // Get class name
          this.classService.getClassById(this.classId!).subscribe({
            next: (classData) => {
              if (this.examDetail) {
                this.examDetail.class_name = classData?.class_name || 'Không xác định';
              }
            },
            error: (error) => {
              // Class details loading error handled silently
            }
          });
          
          this.loadStudentScores();
        } else {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Lỗi',
            detail: 'Không tìm thấy dữ liệu bài kiểm tra'
          });
          this.examDetail = null;
        }
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải thông tin bài kiểm tra: ' + (error.message || 'Lỗi không xác định')
        });
        
        this.examDetail = null;
      }
    });
  }

  loadExamDetail(): void {
    if (!this.examId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID bài kiểm tra'
      });
      return;
    }

    this.loading = true;
    
    // Force fresh data load - invalidate any cached data
    // Clear cached student scores and exam data to prevent overlap
    this.studentScores = [];
    this.examDetail = null;
    
    // Thử lấy từ exams trước
    this.examService.getExamById(this.examId).subscribe({
      next: (exam) => {
        // Lấy thông tin lớp học
        this.classService.getClassById(this.classId!).subscribe({
          next: (classData) => {
    this.examDetail = {
              id: exam.id,
              exam_name: exam.exam_name,
              exam_type: exam.exam_type,
              skill_type: 'Tổng hợp', // Default, có thể lấy từ exam_skills
              exam_date: exam.exam_date,
              language: exam.language,
              max_score: exam.max_score,
              class_id: exam.class_id,
              class_name: classData?.class_name || 'Không xác định',
              status: this.mapExamStatus(exam.status),
              approved_by: exam.approved_by,
              approved_at: exam.approved_at,
              approved_by_name: exam.approved_by_name
    };
    
    // Load exam skills to check if exam has multiple skills
    this.examSkillsService.getExamSkills({ exam_id: this.examId! }).subscribe({
      next: (skills) => {
        // Sort skills by order_index to ensure consistent display
        this.examSkills = skills.sort((a: ExamSkill, b: ExamSkill) => 
          (a.order_index || 0) - (b.order_index || 0)
        );
        this.hasMultipleSkills = skills.length > 1;
    
    this.loading = false;
    
    // Load student scores after loading exam detail
    this.loadStudentScores();
      },
      error: (error) => {
        this.examSkills = [];
        this.hasMultipleSkills = false;
        
        // Show error but continue loading
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Không thể tải thông tin kỹ năng. Đang tải điểm số học viên...'
        });
        
        this.loading = false;
        
        // Load student scores anyway
        this.loadStudentScores();
      }
            });
          },
          error: (error) => {
            this.loading = false;
            
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể tải thông tin lớp học: ' + (error.message || 'Lỗi không xác định')
            });
          }
        });
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không tìm thấy bài kiểm tra với ID ' + this.examId
        });
        
        this.examDetail = null;
      }
    });
  }

  loadStudentScores(): void {
    if (!this.classId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID lớp học'
      });
      return;
    }

    // Clear existing student scores before loading new data to prevent overlap
    this.studentScores = [];

    this.loading = true;
    
    // First, get all students in the class
    this.classStudentService.getStudentsByClass(this.classId).subscribe({
      next: (classStudents) => {
        
        // Extract student IDs
        const studentIds = classStudents.map((cs: any) => cs.student_id);
        
        // Get detailed student information
        this.studentService.getStudents({}).subscribe({
          next: (studentsResponse: any) => {
            let students: any[] = [];
            
            if (Array.isArray(studentsResponse)) {
              students = studentsResponse;
            } else if (studentsResponse?.data) {
              students = Array.isArray(studentsResponse.data) ? studentsResponse.data : [studentsResponse.data];
            }
            
            
            // Filter students that are in this class
            const classStudentsDetails = students.filter(student => 
              studentIds.includes(student.id)
            );
            
            // Query exam_results for each skill separately (same as updateMultiSkillResults does)
            const examSkillIds = this.examSkills.map(s => s.id);
            
            const getResultPromises = examSkillIds.map(skillId => 
              this.examResultsService.getExamResultsWithDetails({ exam_skill_id: skillId })
            );
            
            forkJoin(getResultPromises).subscribe({
              next: (responses: any[][]) => {
                // Merge all results from all skills
                const examResults = responses.flat();
                
                // Process results if found
                if (examResults.length > 0 && this.hasMultipleSkills && this.examSkills.length > 0) {
                  // Create map of exam_skill_id to skill_type for quick lookup
                  const examSkillMap = new Map();
                  this.examSkills.forEach(skill => {
                    examSkillMap.set(skill.id, skill.skill_type);
                  });
                  
                  // Group results by student_id
                  const studentResultsMap = new Map();
                  examResults.forEach((result: any) => {
                    if (!studentResultsMap.has(result.student_id)) {
                      studentResultsMap.set(result.student_id, []);
                    }
                    studentResultsMap.get(result.student_id).push(result);
                  });
                  
                  // Combine class students with their exam results
                  this.studentScores = classStudentsDetails.map((student: any) => {
                    const studentResults = studentResultsMap.get(student.id) || [];
                    
                    // Initialize result object
                    const studentScore: StudentScore = {
                      student_id: student.id,
                      student_code: student.student_code || '',
                      full_name: student.full_name || '',
                      email: student.email || '',
                      score: 0,
                      percentage: 0,
                      teacher_comment: '',
                      student_feedback: ''
                    };
                    
                    // Aggregate scores by skill
                    studentResults.forEach((result: any) => {
                      const skillType = examSkillMap.get(result.exam_skill_id);
                      
                      if (skillType) {
                        const skill = this.examSkills.find(s => s.skill_type === skillType);
                        
                        switch(skillType) {
                          case 'Nghe':
                            studentScore.listening_score = parseFloat(result.score) || 0;
                            studentScore.listening_percentage = skill?.max_score 
                              ? (studentScore.listening_score / skill.max_score) * 100 
                              : 0;
                            break;
                          case 'Nói':
                            studentScore.speaking_score = parseFloat(result.score) || 0;
                            studentScore.speaking_percentage = skill?.max_score 
                              ? (studentScore.speaking_score / skill.max_score) * 100 
                              : 0;
                            break;
                          case 'Đọc':
                            studentScore.reading_score = parseFloat(result.score) || 0;
                            studentScore.reading_percentage = skill?.max_score 
                              ? (studentScore.reading_score / skill.max_score) * 100 
                              : 0;
                            break;
                          case 'Viết':
                            studentScore.writing_score = parseFloat(result.score) || 0;
                            studentScore.writing_percentage = skill?.max_score 
                              ? (studentScore.writing_score / skill.max_score) * 100 
                              : 0;
                            break;
                          case 'Tổng hợp':
                            studentScore.synthesis_score = parseFloat(result.score) || 0;
                            studentScore.synthesis_percentage = skill?.max_score 
                              ? (studentScore.synthesis_score / skill.max_score) * 100 
                              : 0;
                            break;
                        }
                      }
                      
                      if (!studentScore.teacher_comment && result.teacher_comment) {
                        studentScore.teacher_comment = result.teacher_comment;
                      }
                      if (!studentScore.student_feedback && result.student_feedback) {
                        studentScore.student_feedback = result.student_feedback;
                      }
                    });
                    
                    // Calculate averages
                    const skillScores = [];
                    if (studentScore.listening_score) skillScores.push(studentScore.listening_score);
                    if (studentScore.speaking_score) skillScores.push(studentScore.speaking_score);
                    if (studentScore.reading_score) skillScores.push(studentScore.reading_score);
                    if (studentScore.writing_score) skillScores.push(studentScore.writing_score);
                    if (studentScore.synthesis_score) skillScores.push(studentScore.synthesis_score);
                    
                    if (skillScores.length > 0) {
                      studentScore.score = skillScores.reduce((sum, s) => sum + s, 0) / skillScores.length;
                      
                      const skillPercentages = [];
                      if (studentScore.listening_percentage !== undefined) skillPercentages.push(studentScore.listening_percentage);
                      if (studentScore.speaking_percentage !== undefined) skillPercentages.push(studentScore.speaking_percentage);
                      if (studentScore.reading_percentage !== undefined) skillPercentages.push(studentScore.reading_percentage);
                      if (studentScore.writing_percentage !== undefined) skillPercentages.push(studentScore.writing_percentage);
                      
                      if (skillPercentages.length > 0) {
                        studentScore.percentage = skillPercentages.reduce((sum, p) => sum + p, 0) / skillPercentages.length;
                      }
                    }
                    
                    return studentScore;
                  });
                  
                  this.calculateStatistics();
                  this.loading = false;
                  
                } else if (examResults.length === 0) {
                  // Fallback: use old method if no results found
                  this.examResultsService.getExamResultsWithDetails({ 
                    class_id: this.classId!
                  }).subscribe({
                    next: (allExamResults) => {
                      // Create a map to aggregate results by student_id and skill
                      if (this.hasMultipleSkills && this.examSkills.length > 0) {
                        
                        // Use examResults directly (already filtered by skill)
                      const filteredResults = allExamResults;
                      
                        // Create map of exam_skill_id to skill_type for quick lookup
                        const examSkillMap = new Map();
                        this.examSkills.forEach(skill => {
                          examSkillMap.set(skill.id, skill.skill_type);
                        });
                        
                        // Group results by student_id
                        const studentResultsMap = new Map();
                        filteredResults.forEach((result: any) => {
                          if (!studentResultsMap.has(result.student_id)) {
                            studentResultsMap.set(result.student_id, []);
                          }
                          studentResultsMap.get(result.student_id).push(result);
                        });
                        
                        // Combine class students with their exam results
                        this.studentScores = classStudentsDetails.map((student: any) => {
                          const studentResults = studentResultsMap.get(student.id) || [];
                          
                          // Initialize result object
                          const studentScore: StudentScore = {
                            student_id: student.id,
                            student_code: student.student_code || '',
                            full_name: student.full_name || '',
                            email: student.email || '',
                            score: 0,
                            percentage: 0,
                            teacher_comment: '',
                            student_feedback: ''
                          };
                          
                          // Aggregate scores by skill using exam_skill_id to get skill_type
                          studentResults.forEach((result: any) => {
                            // Get skill_type from examSkillMap using exam_skill_id
                            const skillType = examSkillMap.get(result.exam_skill_id);
                            
                            if (skillType) {
                              // Find the skill to get max_score
                              const skill = this.examSkills.find(s => s.skill_type === skillType);
                            
                            switch(skillType) {
                              case 'Nghe':
                                studentScore.listening_score = parseFloat(result.score) || 0;
                                  // Recalculate percentage based on skill's max_score
                                  studentScore.listening_percentage = skill?.max_score 
                                    ? (studentScore.listening_score / skill.max_score) * 100 
                                    : parseFloat(result.percentage) || 0;
                                break;
                              case 'Nói':
                                studentScore.speaking_score = parseFloat(result.score) || 0;
                                  studentScore.speaking_percentage = skill?.max_score 
                                    ? (studentScore.speaking_score / skill.max_score) * 100 
                                    : parseFloat(result.percentage) || 0;
                                break;
                              case 'Đọc':
                                studentScore.reading_score = parseFloat(result.score) || 0;
                                  studentScore.reading_percentage = skill?.max_score 
                                    ? (studentScore.reading_score / skill.max_score) * 100 
                                    : parseFloat(result.percentage) || 0;
                                break;
                              case 'Viết':
                                studentScore.writing_score = parseFloat(result.score) || 0;
                                  studentScore.writing_percentage = skill?.max_score 
                                    ? (studentScore.writing_score / skill.max_score) * 100 
                                    : parseFloat(result.percentage) || 0;
                                break;
                              }
                            }
                            
                            // Use first non-empty comment
                            if (!studentScore.teacher_comment && result.teacher_comment) {
                              studentScore.teacher_comment = result.teacher_comment;
                            }
                            if (!studentScore.student_feedback && result.student_feedback) {
                              studentScore.student_feedback = result.student_feedback;
                            }
                          });
                          
                          // Calculate overall average score if we have skill scores
                          const skillScores = [];
                          if (studentScore.listening_score) skillScores.push(studentScore.listening_score);
                          if (studentScore.speaking_score) skillScores.push(studentScore.speaking_score);
                          if (studentScore.reading_score) skillScores.push(studentScore.reading_score);
                          if (studentScore.writing_score) skillScores.push(studentScore.writing_score);
                          
                          if (skillScores.length > 0) {
                            // Calculate average of all skills
                            studentScore.score = skillScores.reduce((sum, s) => sum + s, 0) / skillScores.length;
                            
                            // Also calculate overall percentage from skill percentages (weighted average)
                            const skillPercentages = [];
                            if (studentScore.listening_percentage !== undefined) skillPercentages.push(studentScore.listening_percentage);
                            if (studentScore.speaking_percentage !== undefined) skillPercentages.push(studentScore.speaking_percentage);
                            if (studentScore.reading_percentage !== undefined) skillPercentages.push(studentScore.reading_percentage);
                            if (studentScore.writing_percentage !== undefined) skillPercentages.push(studentScore.writing_percentage);
                            
                            if (skillPercentages.length > 0) {
                              studentScore.percentage = skillPercentages.reduce((sum, p) => sum + p, 0) / skillPercentages.length;
                            }
                          }
                          
                          return studentScore;
                        });
                      } else {
                        // Single skill logic (original)
                      const examResultsMap = new Map();
                      allExamResults.forEach((result: any) => {
                        examResultsMap.set(result.student_id, result);
                      });
                      
                      this.studentScores = classStudentsDetails.map((student: any) => {
                        const examResult = examResultsMap.get(student.id);
                        
                        return {
                          student_id: student.id,
                          student_code: student.student_code || '',
                          full_name: student.full_name || '',
                          email: student.email || '',
                          score: examResult?.score || 0,
                          percentage: examResult?.percentage || 0,
                          teacher_comment: examResult?.teacher_comment || '',
                          student_feedback: examResult?.student_feedback || ''
                        };
                      });
                      }
                      
                      this.calculateStatistics();
                      this.loading = false;
                      

                    },
                    error: (error) => {
                      // If all exam results fail, still show students without scores
                      this.studentScores = classStudentsDetails.map((student: any) => ({
                        student_id: student.id,
                        student_code: student.student_code || '',
                        full_name: student.full_name || '',
                        email: student.email || '',
                        score: 0,
                        percentage: 0,
                        teacher_comment: '',
                        student_feedback: ''
                      }));
                      
                      this.calculateStatistics();
                      this.loading = false;
                      
                      this.messageService.add({
                        severity: 'warn',
                        summary: 'Cảnh báo',
                        detail: 'Đã tải danh sách học viên nhưng không thể tải điểm số'
                      });
                    }
                  });
                } else {
                  // Original logic when exam results are found
                  const examResultsMap = new Map();
                  examResults.forEach((result: any) => {
                    examResultsMap.set(result.student_id, result);
                  });
                  
                  // Combine class students with their exam results
                  this.studentScores = classStudentsDetails.map((student: any) => {
                    const examResult = examResultsMap.get(student.id);
                    
                    return {
                      student_id: student.id,
                      student_code: student.student_code || '',
                      full_name: student.full_name || '',
                      email: student.email || '',
                      score: examResult?.score || 0,
                      percentage: examResult?.percentage || 0,
                      teacher_comment: examResult?.teacher_comment || '',
                      student_feedback: examResult?.student_feedback || ''
                    };
                  });
                  
                  this.calculateStatistics();
                  this.loading = false;
                  
                  this.messageService.add({
                    severity: 'success',
                    summary: 'Thành công',
                    detail: `Đã tải danh sách ${this.studentScores.length} học viên của lớp`
                  });
                }
              },
              error: (error) => {
                
                // If exam results fail, still show students without scores
                this.studentScores = classStudentsDetails.map((student: any) => ({
                  student_id: student.id,
                  student_code: student.student_code || '',
                  full_name: student.full_name || '',
                  email: student.email || '',
        score: 0,
        percentage: 0,
        teacher_comment: '',
        student_feedback: ''
                }));
    
    this.calculateStatistics();
    this.loading = false;
    
    this.messageService.add({
                  severity: 'warn',
                  summary: 'Cảnh báo',
                  detail: 'Đã tải danh sách học viên nhưng không thể tải điểm số'
                });
              }
            });
          },
          error: (error: any) => {
            this.loading = false;
            
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể tải thông tin chi tiết học viên: ' + (error.message || 'Lỗi không xác định')
            });
          }
        });
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách học viên: ' + (error.message || 'Lỗi không xác định')
        });
      }
    });
  }

  loadStudentScoresFromSkill(): void {
    if (!this.classId || !this.examSkillId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID lớp học hoặc ID kỹ năng'
      });
      return;
    }

    // Clear existing student scores before loading new data to prevent overlap
    this.studentScores = [];

    this.loading = true;
    
    // First, get all students in the class
    this.classStudentService.getStudentsByClass(this.classId).subscribe({
      next: (classStudents) => {
        
        // Extract student IDs
        const studentIds = classStudents.map((cs: any) => cs.student_id);
        
        // Get detailed student information
        this.studentService.getStudents({}).subscribe({
          next: (studentsResponse: any) => {
            let students: any[] = [];
            
            if (Array.isArray(studentsResponse)) {
              students = studentsResponse;
            } else if (studentsResponse?.data) {
              students = Array.isArray(studentsResponse.data) ? studentsResponse.data : [studentsResponse.data];
            }
            
            // Filter students that are in this class
            const classStudentsDetails = students.filter(student => 
              studentIds.includes(student.id)
            );
            
            // Then get exam results for this skill
            this.examResultsService.getExamResultsWithDetails({ 
              exam_skill_id: this.examSkillId!
            }).subscribe({
              next: (examResults) => {
                // Create a map of exam results by student_id for quick lookup
                const examResultsMap = new Map();
                examResults.forEach((result: any) => {
                  examResultsMap.set(result.student_id, result);
                });
                
                // Combine class students with their exam results
                this.studentScores = classStudentsDetails.map((student: any) => {
                  const examResult = examResultsMap.get(student.id);
                  
                  return {
                    student_id: student.id,
                    student_code: student.student_code || '',
                    full_name: student.full_name || '',
                    email: student.email || '',
                    score: examResult?.score || 0,
                    percentage: examResult?.percentage || 0,
                    teacher_comment: examResult?.teacher_comment || '',
                    student_feedback: examResult?.student_feedback || ''
                  };
                });
                
                this.calculateStatistics();
                this.loading = false;
                
                this.messageService.add({
                  severity: 'success',
                  summary: 'Thành công',
                  detail: `Đã tải danh sách ${this.studentScores.length} học viên của lớp`
                });
              },
              error: (error) => {
                
                // If exam results fail, still show students without scores
                this.studentScores = classStudentsDetails.map((student: any) => ({
                  student_id: student.id,
                  student_code: student.student_code || '',
                  full_name: student.full_name || '',
                  email: student.email || '',
                  score: 0,
                  percentage: 0,
                  teacher_comment: '',
                  student_feedback: ''
                }));
                
                this.calculateStatistics();
                this.loading = false;
                
                this.messageService.add({
                  severity: 'warn',
                  summary: 'Cảnh báo',
                  detail: 'Đã tải danh sách học viên nhưng không thể tải điểm số'
                });
              }
            });
          },
          error: (error: any) => {
            this.loading = false;
            
            this.messageService.add({
              severity: 'error',
              summary: 'Lỗi',
              detail: 'Không thể tải thông tin chi tiết học viên: ' + (error.message || 'Lỗi không xác định')
            });
          }
        });
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách học viên: ' + (error.message || 'Lỗi không xác định')
        });
      }
    });
  }

  calculateStatistics(): void {
    this.totalStudents = this.studentScores.length;
    
    if (this.hasMultipleSkills) {
      // For exams with multiple skills, calculate average across all skills for each student
      const studentsWithAnyScore = this.studentScores.filter(s => 
        (s.listening_score && s.listening_score > 0) ||
        (s.speaking_score && s.speaking_score > 0) ||
        (s.reading_score && s.reading_score > 0) ||
        (s.writing_score && s.writing_score > 0)
      );
      
      this.studentsWithScores = studentsWithAnyScore.length;
      
      if (this.studentsWithScores > 0) {
        // Calculate overall average percentage for each student (average of all skills)
        const totalPercentage = studentsWithAnyScore.reduce((sum, s) => {
          const percentages = [];
          
          // Get percentage for each skill using getSkillPercentage method
          if (this.examSkills.find(sk => sk.skill_type === 'Nghe')) {
            const nghePct = this.getSkillPercentage(s, 'Nghe');
            if (nghePct > 0) percentages.push(nghePct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Nói')) {
            const noiPct = this.getSkillPercentage(s, 'Nói');
            if (noiPct > 0) percentages.push(noiPct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Đọc')) {
            const docPct = this.getSkillPercentage(s, 'Đọc');
            if (docPct > 0) percentages.push(docPct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Viết')) {
            const vietPct = this.getSkillPercentage(s, 'Viết');
            if (vietPct > 0) percentages.push(vietPct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Tổng hợp')) {
            const tongHopPct = this.getSkillPercentage(s, 'Tổng hợp');
            if (tongHopPct > 0) percentages.push(tongHopPct);
          }
          
          const avg = percentages.length > 0
            ? percentages.reduce((a, b) => a + b, 0) / percentages.length 
            : 0;
          return sum + avg;
        }, 0);
        
        this.averageScore = totalPercentage / this.studentsWithScores;
        
        const passedStudents = studentsWithAnyScore.filter(s => {
          const percentages = [];
          
          // Get percentage for each skill using getSkillPercentage method
          if (this.examSkills.find(sk => sk.skill_type === 'Nghe')) {
            const nghePct = this.getSkillPercentage(s, 'Nghe');
            if (nghePct > 0) percentages.push(nghePct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Nói')) {
            const noiPct = this.getSkillPercentage(s, 'Nói');
            if (noiPct > 0) percentages.push(noiPct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Đọc')) {
            const docPct = this.getSkillPercentage(s, 'Đọc');
            if (docPct > 0) percentages.push(docPct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Viết')) {
            const vietPct = this.getSkillPercentage(s, 'Viết');
            if (vietPct > 0) percentages.push(vietPct);
          }
          if (this.examSkills.find(sk => sk.skill_type === 'Tổng hợp')) {
            const tongHopPct = this.getSkillPercentage(s, 'Tổng hợp');
            if (tongHopPct > 0) percentages.push(tongHopPct);
          }
          
          const avg = percentages.length > 0 
            ? percentages.reduce((a, b) => a + b, 0) / percentages.length 
            : 0;
          return avg >= 60;
        }).length;
        
        this.passRate = (passedStudents / this.totalStudents) * 100;
      } else {
        this.averageScore = 0;
        this.passRate = 0;
      }
    } else {
      // For single skill exams, use the original logic
    this.studentsWithScores = this.studentScores.filter(s => s.score > 0).length;
    
    if (this.studentsWithScores > 0) {
      const totalScore = this.studentScores
        .filter(s => s.score > 0)
        .reduce((sum, s) => sum + s.score, 0);
      this.averageScore = totalScore / this.studentsWithScores;
      
      const passedStudents = this.studentScores.filter(s => s.percentage >= 60).length;
      this.passRate = (passedStudents / this.totalStudents) * 100;
    } else {
      this.averageScore = 0;
      this.passRate = 0;
      }
    }
  }

  onEdit(): void {
    this.isEditMode = true;
    
    // Initialize edit data
    this.studentScores.forEach(student => {
      if (this.hasMultipleSkills) {
        // For multiple skills, initialize each skill score
        this.examSkills.forEach(skill => {
          const skillKey = this.getSkillKey(student.student_id, skill.skill_type);
          const skillScore = this.getSkillScore(student, skill.skill_type);
          this.editedScores[skillKey] = skillScore;
        });
      } else {
        // For single skill, use the regular score
        this.editedScores[student.student_id] = student.score;
      }
      this.editedComments[student.student_id] = student.teacher_comment;
    });
  }

  onCancel(): void {
    this.isEditMode = false;
    this.editedScores = {};
    this.editedComments = {};
  }

  onSave(): void {
    if (!this.examId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không tìm thấy ID bài kiểm tra'
      });
      return;
    }

    this.loading = true;
    
    // For multi-skill exams, prepare results for each skill separately
    if (this.hasMultipleSkills && this.examSkills.length > 0) {
      this.updateMultiSkillResults();
      return;
    }
    
    // For single skill exams, use original logic
    const updatedResults = this.studentScores
      .filter(student => 
        this.editedScores[student.student_id] !== undefined || 
        this.editedComments[student.student_id] !== undefined ||
        student.score > 0
      )
      .map(student => ({
        student_id: student.student_id,
        class_id: this.classId!,
        exam_type: (this.examDetail?.exam_type as 'Kiểm tra định kỳ' | 'Kiểm tra giữa kỳ' | 'Kiểm tra cuối kỳ' | 'Kiểm tra tổng hợp') || 'Kiểm tra định kỳ',
        exam_name: this.examDetail?.exam_name || 'Bài kiểm tra',
        exam_date: this.examDetail?.exam_date || new Date().toISOString().split('T')[0],
        language: (this.examDetail?.language as 'Tiếng Anh' | 'Tiếng Hàn' | 'Tiếng Trung') || 'Tiếng Anh',
        skill_type: (this.examDetail?.skill_type as 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp') || 'Tổng hợp',
        score: this.editedScores[student.student_id] !== undefined 
          ? this.formatScore(this.editedScores[student.student_id])
          : this.formatScore(student.score),
        max_score: this.formatScore(this.examDetail?.max_score || 100),
        percentage: this.editedScores[student.student_id] !== undefined 
          ? this.calculatePercentage(this.editedScores[student.student_id])
          : student.percentage,
        level: this.getPerformanceLevel(student.percentage),
        teacher_comment: this.editedComments[student.student_id] !== undefined 
          ? this.editedComments[student.student_id] 
          : student.teacher_comment,
        student_feedback: student.student_feedback || ''
      }));

    // Call API to update exam results
    // For special edit mode, update using exam_results table
    if (this.isSpecialEditMode) {
      // Update exam_results table directly
      this.updateExamResults(updatedResults).subscribe({
        next: (response) => {
          // Handle success
          this.handleSaveSuccess();
        },
        error: (error) => {
          this.handleSaveError(error);
        }
      });
    } else {
      // Normal mode - use study_results table
      this.studyResultService.bulkCreateStudyResults(this.classId!, updatedResults).subscribe({
      next: (response) => {
        this.loading = false;
        
        // Handle different edit modes
        if (this.isSpecialEditMode) {
          // Admin special edit mode - keep in special mode
          this.messageService.add({
            severity: 'success',
            summary: 'Thành công',
            detail: 'Đã lưu điểm trong chế độ sửa đặc biệt. Thay đổi đã được ghi lại.'
          });
        } else {
          // Normal edit mode - exit edit mode
          this.isEditMode = false;
          this.editedScores = {};
          this.editedComments = {};
    
    this.messageService.add({
      severity: 'success',
      summary: 'Thành công',
      detail: 'Đã lưu điểm và nhận xét cho tất cả học viên'
    });
        }
        
        // Reload data from database to ensure UI shows the saved data
        this.loadStudentScores();
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể lưu điểm số: ' + (error.message || 'Lỗi không xác định')
        });
      }
      });
    }
  }

  updateMultiSkillResults(): void {
    // Get all existing exam_results for this exam and class
    const examSkillIds = this.examSkills.map(s => s.id);
    
    // Query each exam_skill_id separately (same as loadStudentScoresFromSkill does for single skill)
    const getResultPromises = examSkillIds.map(skillId => 
      this.examResultsService.getExamResultsWithDetails({ exam_skill_id: skillId }      ).pipe(
        catchError(error => {
          return of([]); // Return empty array on error
        })
      )
    );
    
    forkJoin(getResultPromises).pipe(
      switchMap((responses: any[][]) => {
        // Merge all results from all skills
        const examResults = responses.flat();
        
        // Prepare updates for each student and each skill
        const updatePromises: Observable<any>[] = [];
        
        this.studentScores.forEach(student => {
          this.examSkills.forEach(skill => {
            // Get the score for this skill from editedScores or student data
            let skillScore = 0;
            let skillPercentage = 0;
            
            // Check if there's an edited score
            const skillKey = this.getSkillKey(student.student_id, skill.skill_type);
            const editedScore = this.editedScores[skillKey];
            
            if (editedScore !== undefined && editedScore !== null) {
              // Use edited score if available
              skillScore = parseFloat(String(editedScore ?? 0)) || 0;
              
              // Find max_score for this skill
              const skillMaxScore = skill.max_score || 100;
              skillPercentage = (skillScore / skillMaxScore) * 100;
            } else {
              // Use existing student data
              switch(skill.skill_type) {
                case 'Nghe':
                  skillScore = student.listening_score || 0;
                  skillPercentage = student.listening_percentage || 0;
                  break;
                case 'Nói':
                  skillScore = student.speaking_score || 0;
                  skillPercentage = student.speaking_percentage || 0;
                  break;
                case 'Đọc':
                  skillScore = student.reading_score || 0;
                  skillPercentage = student.reading_percentage || 0;
                  break;
                case 'Viết':
                  skillScore = student.writing_score || 0;
                  skillPercentage = student.writing_percentage || 0;
                  break;
                case 'Tổng hợp':
                  skillScore = student.synthesis_score || 0;
                  skillPercentage = student.synthesis_percentage || 0;
                  break;
              }
            }
            
            // Find existing exam_result for this student and skill
            const existingResult = examResults.find((r: any) => {
              // Convert to numbers for comparison to avoid type mismatch
              const rStudentId = Number(r.student_id);
              const rExamSkillId = Number(r.exam_skill_id);
              const studentId = Number(student.student_id);
              const skillId = Number(skill.id);
              
              const matches = rStudentId === studentId && rExamSkillId === skillId;
              return matches;
            });
            
            if (existingResult && existingResult.id) {
              // Update existing record (even if score = 0 to preserve it)
              updatePromises.push(
                this.examResultsService.updateExamResult(existingResult.id, {
                  score: skillScore,
                  level: this.getPerformanceLevel(skillPercentage),
                  teacher_comment: this.editedComments[student.student_id] || student.teacher_comment || '',
                  is_passed: skillPercentage >= 60,
                  grade_point: this.calculateGradePoint(skillPercentage)
                })
              );
            } else if (skillScore >= 0) {
              // Record doesn't exist in DB but user entered score
              // This should not happen in normal workflow (teacher already pushed scores)
              // But we'll still try to create it for flexibility
              const createPromise = this.examResultsService.createExamResult({
                exam_skill_id: skill.id,
                student_id: student.student_id,
                score: skillScore,
                level: this.getPerformanceLevel(skillPercentage),
                teacher_comment: this.editedComments[student.student_id] || student.teacher_comment || '',
                is_passed: skillPercentage >= 60,
                grade_point: this.calculateGradePoint(skillPercentage)
              }).pipe(
                catchError((error) => {
                  // If duplicate entry, it means record was created between our query and create attempt
                  // Just return success
                  if (error.error && typeof error.error === 'object' && error.error.error && 
                      error.error.error.includes('unique_exam_skill_student')) {
                    return of({ success: true, message: 'Record already exists' });
                  }
                  return throwError(() => error);
                })
              );
              updatePromises.push(createPromise);
            }
          });
        });
        
        if (updatePromises.length === 0) {
          return of([]);
        }
        
        return forkJoin(updatePromises);
      })
    ).subscribe({
      next: (response) => {
        this.handleSaveSuccess();
      },
      error: (error) => {
        this.handleSaveError(error);
      }
    });
  }

  calculateGradePoint(percentage: number): number {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.5;
    if (percentage >= 70) return 3.0;
    if (percentage >= 60) return 2.5;
    if (percentage >= 50) return 2.0;
    return 0.0;
  }

  updateExamResults(updatedResults: any[]): Observable<any> {
    // Get exam_skills for this exam to get skill IDs
    return this.examSkillsService.getExamSkills({ exam_id: this.examId! }).pipe(
      switchMap((skills) => {
        if (skills.length === 0) {
          return throwError(() => new Error('Không tìm thấy kỹ năng cho bài kiểm tra này'));
        }
        
        // Get all exam_results for this exam to find the correct IDs
        return this.examResultsService.getExamResults({
          exam_skill_id: skills[0].id // Use first skill to get results
        }).pipe(
          switchMap((response) => {
            // Handle response format (could be { data: [...], total: ... } or [...])
            const examResults = response?.data || response || [];
            // Update each student's exam result using the correct exam_result_id
            const updatePromises = updatedResults.map(result => {
              // Find the exam_result_id by matching student_id
              const examResult = examResults.find((er: any) => er.student_id === result.student_id);
              
              if (!examResult || !examResult.id) {
                return of(null); // Skip if not found
              }
              
              return this.examResultsService.updateExamResult(
                examResult.id, // Use the correct exam_result_id
                {
                  score: result.score,
                  // percentage will be calculated in backend from score and max_score
                  level: result.level,
                  teacher_comment: result.teacher_comment || '',
                  is_passed: result.percentage >= 60
                }
              );
            });
            
            return forkJoin(updatePromises.filter(p => p !== null));
          })
        );
      })
    );
  }

  handleSaveSuccess(): void {
    this.loading = false;
    
    // Handle different edit modes
    if (this.isSpecialEditMode) {
      // Admin special edit mode - keep in special mode
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã lưu điểm trong chế độ sửa đặc biệt. Thay đổi đã được ghi lại.'
      });
    } else {
      // Normal edit mode - exit edit mode
      this.isEditMode = false;
      this.editedScores = {};
      this.editedComments = {};
      
      this.messageService.add({
        severity: 'success',
        summary: 'Thành công',
        detail: 'Đã lưu điểm và nhận xét cho tất cả học viên'
      });
    }
    
    // Reload data from database to ensure UI shows the saved data
    this.loadStudentScores();
  }

  handleSaveError(error: any): void {
    this.loading = false;
    
    this.messageService.add({
      severity: 'error',
      summary: 'Lỗi',
      detail: 'Không thể lưu điểm số: ' + (error.message || 'Lỗi không xác định')
    });
  }

  calculatePercentage(score: number): number {
    if (!this.examDetail || this.examDetail.max_score === 0) return 0;
    return (score / this.examDetail.max_score) * 100;
  }

  getScoreSeverity(percentage: number | string): 'success' | 'info' | 'warn' | 'secondary' | 'danger' {
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(numPercentage)) {
      return 'danger';
    }
    
    // International grading scale:
    // >= 90%: Excellent (Green/Success)
    // >= 80% và < 90%: Good (Blue/Info)
    // >= 70% và < 80%: Average (Orange/Warn)
    // >= 60% và < 70%: Pass (Secondary/Grey)
    // < 60%: Fail (Red/Danger)
    
    if (numPercentage >= 90) return 'success';  // Xuất sắc - Green
    if (numPercentage >= 80) return 'info';      // Giỏi - Blue
    if (numPercentage >= 70) return 'warn';     // Khá - Orange
    if (numPercentage >= 60) return 'secondary'; // Trung bình - Grey
    return 'danger';                              // Cần cải thiện - Red
  }

  getPerformanceLevel(percentage: number | string): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(numPercentage)) {
      return 'A1';
    }
    
    if (numPercentage >= 90) return 'C2';
    if (numPercentage >= 80) return 'C1';
    if (numPercentage >= 70) return 'B2';
    if (numPercentage >= 60) return 'B1';
    if (numPercentage >= 50) return 'A2';
    return 'A1';
  }

  getPerformanceLevelText(percentage: number | string): string {
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(numPercentage)) {
      return 'Cần cải thiện';
    }
    
    if (numPercentage >= 90) return 'Xuất sắc';
    if (numPercentage >= 80) return 'Giỏi';
    if (numPercentage >= 70) return 'Khá';
    if (numPercentage >= 60) return 'Trung bình';
    return 'Cần cải thiện';
  }

  formatScore(score: number | string): number {
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (isNaN(numScore)) {
      return 0;
    }
    return Math.round(numScore); // Làm tròn thành số nguyên
  }

  formatPercentage(percentage: number | string): string {
    const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (isNaN(numPercentage)) {
      return '0.0%';
    }
    return `${numPercentage.toFixed(1)}%`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  onBack(): void {
    if (this.classId) {
      this.router.navigate(['/features/class', this.classId, 'study-results']);
    } else {
      this.router.navigate(['/features/class']);
    }
  }

  // Quick edit methods
  onScoreChange(studentId: number, score: number): void {
    this.editedScores[studentId] = score;
  }

  onCommentChange(studentId: number, comment: string): void {
    this.editedComments[studentId] = comment;
  }

  getEditedScore(studentId: number): number {
    return this.editedScores[studentId] !== undefined ? this.editedScores[studentId] : 0;
  }

  getEditedComment(studentId: number): string {
    return this.editedComments[studentId] !== undefined ? this.editedComments[studentId] : '';
  }

  // Helper methods for multi-skill exam display
  getSkillScore(student: StudentScore, skillType: string): number {
    switch(skillType) {
      case 'Nghe':
        return this.formatScore(student.listening_score || 0);
      case 'Nói':
        return this.formatScore(student.speaking_score || 0);
      case 'Đọc':
        return this.formatScore(student.reading_score || 0);
      case 'Viết':
        return this.formatScore(student.writing_score || 0);
      case 'Tổng hợp':
        return this.formatScore(student.synthesis_score || 0);
      default:
        return 0;
    }
  }

  getSkillPercentage(student: StudentScore, skillType: string): number {
    // Find the skill to get its max_score
    const skill = this.examSkills.find(s => s.skill_type === skillType);
    if (!skill) return 0;
    
    let score = 0;
    switch(skillType) {
      case 'Nghe':
        score = student.listening_score || 0;
        break;
      case 'Nói':
        score = student.speaking_score || 0;
        break;
      case 'Đọc':
        score = student.reading_score || 0;
        break;
      case 'Viết':
        score = student.writing_score || 0;
        break;
      case 'Tổng hợp':
        score = student.synthesis_score || 0;
        break;
      default:
        return 0;
    }
    
    // Calculate percentage based on skill's max_score
    const maxScore = skill.max_score || 100;
    const percentage = (score / maxScore) * 100;
    
    // Round to 2 decimal places for consistency
    return Math.round(percentage * 100) / 100;
  }

  getTotalMaxScore(): number {
    // Always check if we have skills loaded first
    if (this.examSkills && this.examSkills.length > 0) {
      // Calculate total max score from all skills
      const total = this.examSkills.reduce((sum, skill) => {
        // Force convert to number to avoid string concatenation
        const maxScore = Number(skill.max_score) || 0;
        return sum + maxScore;
      }, 0);
      
      // Return total if we have multiple skills OR if total > 0
      if (this.hasMultipleSkills || total > 0) {
        return total;
      }
    }
    
    // Fallback: for single skill, use exam max_score if it's set
    if (this.examDetail && this.examDetail.max_score && this.examDetail.max_score > 0) {
      return Number(this.examDetail.max_score);
    }
    
    return 0;
  }

  getSkillSeverity(skillType: string): 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' {
    // Map skill types to severity for PrimeNG tags
    const skillSeverityMap: { [key: string]: 'success' | 'secondary' | 'info' | 'warn' | 'danger' | 'contrast' } = {
      'Nghe': 'info',
      'Nói': 'success',
      'Đọc': 'warn',
      'Viết': 'danger',
      'Tổng hợp': 'contrast'
    };
    return skillSeverityMap[skillType] || 'secondary';
  }

  getSkillKey(studentId: number, skillType: string): string {
    return `${studentId}_${skillType}`;
  }

  onSkillScoreChange(studentId: number, skillType: string, score: number | string | null | undefined): void {
    const key = this.getSkillKey(studentId, skillType);
    
    // Handle null, undefined, or invalid values
    if (score === null || score === undefined || score === '') {
      return;
    }
    
    // Convert to number
    const numScore = typeof score === 'string' ? parseFloat(score) : score;
    if (isNaN(numScore)) {
      return;
    }
    
    // Limit score to max
    const skill = this.examSkills.find(s => s.skill_type === skillType);
    if (skill && numScore > skill.max_score) {
      this.editedScores[key] = skill.max_score;
    } else {
      this.editedScores[key] = numScore;
    }
  }

  onSkillScoreBlur(studentId: number, skillType: string, maxScore: number): void {
    const key = this.getSkillKey(studentId, skillType);
    const currentScore = this.editedScores[key];
    
    // If score exceeds max, set it to max
    if (currentScore !== undefined && currentScore > maxScore) {
      this.editedScores[key] = maxScore;
    }
  }

  // Status management methods
  getStatusBadge(): { label: string; severity: 'success' | 'info' | 'warn' | 'secondary' | 'danger' } {
    if (!this.examDetail) return { label: '', severity: 'secondary' };
    
    switch (this.examDetail.status) {
      case 'draft':
        return { label: 'Nháp', severity: 'secondary' };
      case 'in_progress':
        return { label: 'Đang nhập điểm', severity: 'warn' };
      case 'review':
        return { label: 'Chờ duyệt', severity: 'info' };
      case 'published':
        return { label: 'Đã công bố', severity: 'success' };
      default:
        return { label: 'Không xác định', severity: 'secondary' };
    }
  }

  canEdit(): boolean {
    // Giảng viên có thể chỉnh sửa điểm bình thường ở trạng thái draft và in_progress
    if (this.isTeacher) {
      return this.examDetail?.status === 'draft' || this.examDetail?.status === 'in_progress';
    }
    
    // Admin có thể sửa trong chế độ đặc biệt (khi có đơn xin xem xét)
    if (this.isAdmin && this.isSpecialEditMode) {
      return true; // Admin có thể sửa bất kỳ trạng thái nào trong chế độ đặc biệt
    }
    
    return false;
  }

  canApprove(): boolean {
    // Chỉ admin mới có thể duyệt điểm
    if (!this.isAdmin) {
      return false;
    }
    const canApprove = this.examDetail?.status === 'review';
    return canApprove;
  }

  canUnlock(): boolean {
    // Chỉ admin mới có thể mở khóa
    if (!this.isAdmin) {
      return false;
    }
    const canUnlock = this.examDetail?.status === 'published';
    return canUnlock;
  }

  canImportExcel(): boolean {
    // Giảng viên có thể import Excel khi bài kiểm tra ở trạng thái draft hoặc in_progress
    if (!this.isTeacher) return false;
    return this.examDetail?.status === 'draft' || this.examDetail?.status === 'in_progress';
  }

  canEnterSpecialEditMode(): boolean {
    // Admin có thể vào chế độ sửa đặc biệt khi có đơn xin xem xét
    if (!this.isAdmin) return false;
    return !this.isSpecialEditMode; // Chỉ hiển thị khi chưa ở chế độ đặc biệt
  }

  // Import Excel functionality
  onImportExcel(): void {
    // TODO: Implement Excel import functionality
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Tính năng import Excel sẽ được triển khai trong phiên bản tiếp theo'
    });
  }

  // Special edit mode for admin
  onEnterSpecialEditMode(): void {
    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn vào chế độ sửa điểm đặc biệt? Điều này chỉ được thực hiện khi có đơn xin xem xét của học viên.',
      header: 'Xác nhận chế độ sửa đặc biệt',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xác nhận',
      rejectLabel: 'Hủy',
      rejectIcon: 'pi pi-times',
      acceptIcon: 'pi pi-check',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.isSpecialEditMode = true;
        this.isEditMode = true;
        this.messageService.add({
          severity: 'warn',
          summary: 'Cảnh báo',
          detail: 'Bạn đang ở chế độ sửa điểm đặc biệt. Mọi thay đổi sẽ được ghi lại.'
        });
      }
    });
  }

  onExitSpecialEditMode(): void {
    this.isSpecialEditMode = false;
    this.isEditMode = false;
    this.editedScores = {};
    this.editedComments = {};
    this.specialEditReason = '';
    
    this.messageService.add({
      severity: 'info',
      summary: 'Thông báo',
      detail: 'Đã thoát chế độ sửa điểm đặc biệt'
    });
  }

  // Admin actions
  onApprove(): void {
    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn duyệt và công bố điểm cho bài kiểm tra này? Sau khi công bố, điểm sẽ không thể chỉnh sửa.',
      header: 'Xác nhận duyệt điểm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Duyệt',
      rejectLabel: 'Hủy',
      rejectIcon: 'pi pi-times',
      acceptIcon: 'pi pi-check',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.approveExam();
      }
    });
  }

  onUnlock(): void {
    this.confirmationService.confirm({
      message: 'Bạn có chắc chắn muốn mở khóa bài kiểm tra này để chỉnh sửa? Điều này sẽ chuyển trạng thái về "Chờ duyệt".',
      header: 'Xác nhận mở khóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Mở khóa',
      rejectLabel: 'Hủy',
      rejectIcon: 'pi pi-times',
      acceptIcon: 'pi pi-check',
      rejectButtonStyleClass: 'p-button-text',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.unlockExam();
      }
    });
  }

  private approveExam(): void {
    if (!this.examDetail) return;
    
    this.loading = true;
    
    // Sử dụng ExamService để duyệt bài kiểm tra
    const approveData = {
      approved_by: this.currentUserRole || 0,
      approved_by_name: 'Admin' // TODO: Lấy tên admin thực tế
    };
    
    this.examService.approveExam(this.examId!, approveData).subscribe({
      next: (exam) => {
        // Cập nhật local data
        if (this.examDetail) {
          this.examDetail.status = this.mapExamStatus(exam.status);
          this.examDetail.approved_by = exam.approved_by;
          this.examDetail.approved_at = exam.approved_at;
          this.examDetail.approved_by_name = exam.approved_by_name;
        }
        
        this.loading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã duyệt và công bố điểm thành công'
        });
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể duyệt bài kiểm tra: ' + (error.message || 'Lỗi không xác định')
        });
      }
    });
  }

  private unlockExam(): void {
    if (!this.examDetail) return;
    
    this.loading = true;
    
    // Sử dụng ExamService để mở khóa bài kiểm tra
    this.examService.unlockExam(this.examId!).subscribe({
      next: (exam) => {
        // Cập nhật local data
        if (this.examDetail) {
          this.examDetail.status = this.mapExamStatus(exam.status);
          this.examDetail.approved_by = exam.approved_by;
          this.examDetail.approved_at = exam.approved_at;
          this.examDetail.approved_by_name = exam.approved_by_name;
        }
        
        this.loading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Đã mở khóa bài kiểm tra thành công'
        });
      },
      error: (error) => {
        this.loading = false;
        
        this.messageService.add({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể mở khóa bài kiểm tra: ' + (error.message || 'Lỗi không xác định')
        });
      }
    });
  }

  formatApprovalDate(date: string): string {
    return new Date(date).toLocaleString('vi-VN');
  }

  // Map database status to component status (now 1-to-1 mapping)
  private mapExamStatus(dbStatus: 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled'): 'draft' | 'in_progress' | 'review' | 'published' {
    let mappedStatus: 'draft' | 'in_progress' | 'review' | 'published';
    switch (dbStatus) {
      case 'draft':
        mappedStatus = 'draft';
        break;
      case 'in_progress':
        mappedStatus = 'in_progress';
        break;
      case 'review':
        mappedStatus = 'review';
        break;
      case 'completed':
        mappedStatus = 'published';
        break;
      case 'cancelled':
        mappedStatus = 'published'; // Treat cancelled as published
        break;
      default:
        mappedStatus = 'draft';
    }
    return mappedStatus;
  }

  // Map component status to database status (now 1-to-1 mapping)
  private mapToDbStatus(componentStatus: 'draft' | 'in_progress' | 'review' | 'published'): 'draft' | 'in_progress' | 'review' | 'completed' | 'cancelled' {
    switch (componentStatus) {
      case 'draft':
        return 'draft';
      case 'in_progress':
        return 'in_progress';
      case 'review':
        return 'review';
      case 'published':
        return 'completed';
      default:
        return 'draft';
    }
  }
}
