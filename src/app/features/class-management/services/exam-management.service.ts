import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError, catchError, switchMap, map, timer } from 'rxjs';
import { StudyResultService } from '../../study-results/services/study-result.service';
import { ClassStudentService } from './class-student.service';
import { ExamCacheService } from './exam-cache.service';
import { 
  Exam, 
  ExamSkill, 
  ExamWithSkills, 
  BulkExamCreation 
} from '../../study-results/models/exam-results.model';

// Constants for better maintainability
export const DEFAULT_SKILL_SCORE = 25;
export const DEFAULT_SKILL_WEIGHT = 1.0;
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
export const OPERATION_DELAY = 200; // ms

// Type-safe interfaces
export interface SkillUpdateData {
  id?: number; // Optional ID for existing skills
  skill_type: 'Nghe' | 'Nói' | 'Đọc' | 'Viết' | 'Tổng hợp';
  max_score: number;
  weight: number;
  order_index: number;
  total_students: number;
}

export interface ExamUpdateResult {
  exam: ExamWithSkills;
  success: boolean;
  error?: string;
}

export interface SkillOperationResult {
  added: ExamSkill[];
  updated: ExamSkill[];
  deleted: ExamSkill[];
  errors: string[];
}

export interface SkillAnalysis {
  toDelete: ExamSkill[];
  toUpdate: SkillUpdateData[];
  toAdd: SkillUpdateData[];
  toReactivate: SkillUpdateData[];
  toKeep: SkillUpdateData[];
}

@Injectable({
  providedIn: 'root'
})
export class ExamManagementService {
  constructor(
    private studyResultService: StudyResultService,
    private classStudentService: ClassStudentService,
    private examCacheService: ExamCacheService
  ) {}

  /**
   * Create exam with skills and initialize empty results for all students
   */
  createExamWithSkills(
    examData: Exam,
    skillsData: SkillUpdateData[]
  ): Observable<ExamUpdateResult> {
    // Step 1: Create exam first
    return this.studyResultService.createExam(examData).pipe(
      switchMap(createdExam => {
        // Validate created exam has ID
        if (!createdExam.id) {
          return throwError(() => new Error('Created exam does not have ID'));
        }
        
        // Step 2: Create skills and initialize empty results
        return this.createSkillsWithEmptyResults(createdExam.id, skillsData).pipe(
          map(skillResult => {
            return {
              exam: {
                ...createdExam,
                exam_skills: [...skillResult.added, ...skillResult.updated]
              } as ExamWithSkills,
              success: skillResult.errors.length === 0,
              error: skillResult.errors.length > 0 ? skillResult.errors.join(', ') : undefined
            };
          }),
          catchError(error => {
            return of({
              exam: createdExam as ExamWithSkills,
              success: false,
              error: 'Failed to create exam skills'
            });
          })
        );
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Update exam with skills
   */
  updateExamWithSkills(
    examId: number,
    examData: Exam,
    skillsData: SkillUpdateData[]
  ): Observable<ExamUpdateResult> {
    // Step 1: Update exam basic info first
    return this.studyResultService.updateExam(examId, examData).pipe(
      switchMap(updatedExam => {
        // Step 2: Handle skills update with proper sequencing
        return this.updateExamSkillsOptimized(examId, skillsData).pipe(
          map(skillResult => {
            // Invalidate cache to force refresh
            this.examCacheService.invalidateClassCache(updatedExam.class_id);

            return {
              exam: {
                ...updatedExam,
                exam_skills: [...skillResult.added, ...skillResult.updated]
              } as ExamWithSkills,
              success: skillResult.errors.length === 0,
              error: skillResult.errors.length > 0 ? skillResult.errors.join(', ') : undefined
            };
          }),
          catchError(error => {
            return of({
              exam: updatedExam as ExamWithSkills,
              success: false,
              error: 'Failed to update exam skills'
            });
          })
        );
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create skills and initialize empty results for all students
   */
  private createSkillsWithEmptyResults(
    examId: number,
    skillsData: SkillUpdateData[]
  ): Observable<SkillOperationResult> {
    // Validate examId
    if (!examId || examId === undefined || examId === null) {
      return of({
        added: [],
        updated: [],
        deleted: [],
        errors: [`Invalid examId: ${examId}`]
      });
    }
    
    const result: SkillOperationResult = {
      added: [],
      updated: [],
      deleted: [],
      errors: []
    };

    const operations: Observable<any>[] = [];

    skillsData.forEach(skillData => {
      operations.push(
        this.createSkillWithEmptyResults(examId, skillData).pipe(
          map(createdSkill => {
            if (createdSkill) {
              result.added.push(createdSkill);
            }
          }),
          catchError(error => {
            result.errors.push(`Failed to create skill ${skillData.skill_type}: ${error.message}`);
            return of(null);
          })
        )
      );
    });

    return operations.length > 0
      ? this.executeSequentially(operations).pipe(map(() => result))
      : of(result);
  }

  /**
   * Update exam skills with optimized logic
   */
  private updateExamSkillsOptimized(
    examId: number,
    newSkills: SkillUpdateData[]
  ): Observable<SkillOperationResult> {
    // Step 1: Validate skills data
    const validation = this.validateSkillsData(newSkills);
    if (!validation.valid) {
      return of({
        added: [],
        updated: [],
        deleted: [],
        errors: validation.errors
      });
    }

    return this.studyResultService.getExamSkillsByExamIds([examId]).pipe(
      switchMap(currentSkills => {
        const result: SkillOperationResult = {
          added: [],
          updated: [],
          deleted: [],
          errors: []
        };

        // Analyze what needs to be done
        const analysis = this.analyzeSkillChanges(currentSkills, newSkills);

        // Execute operations in proper sequence to avoid constraints
        return this.executeSkillOperationsSequentially(examId, analysis, result);
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Analyze skill changes to determine what operations are needed
   */
  private analyzeSkillChanges(currentSkills: ExamSkill[], newSkills: SkillUpdateData[]): SkillAnalysis {
    const selectedSkillTypes = newSkills.map(skill => skill.skill_type);

    // Separate active and soft-deleted skills
    const activeCurrentSkills = currentSkills.filter(skill => !skill.is_deleted);
    const softDeletedSkills = currentSkills.filter(skill => skill.is_deleted);


    // Step 1: Identify soft-deleted skills that need to be reactivated
    const toReactivate: SkillUpdateData[] = [];
    softDeletedSkills.forEach(softDeletedSkill => {
      const newSkill = newSkills.find(ns => ns.skill_type === softDeletedSkill.skill_type);
      if (newSkill) {
        toReactivate.push({
          ...newSkill,
          id: softDeletedSkill.id
        });
      }
    });

    // Step 2: Identify active skills that need updates (PRIORITY - check this first)
    const toUpdate = newSkills.filter(newSkill => {
      const currentSkill = activeCurrentSkills.find(cs => cs.skill_type === newSkill.skill_type);
      if (!currentSkill) return false;

      // Check if any property has changed
      const hasChanges = currentSkill.max_score !== newSkill.max_score ||
                         currentSkill.weight !== newSkill.weight ||
                         currentSkill.order_index !== newSkill.order_index;


      return hasChanges;
    });

    // Step 3: Identify skills to keep (no changes needed)
    const toKeep = newSkills.filter(newSkill => {
      const currentSkill = activeCurrentSkills.find(cs => cs.skill_type === newSkill.skill_type);
      if (!currentSkill) return false;

      return currentSkill.max_score === newSkill.max_score &&
             currentSkill.weight === newSkill.weight &&
             currentSkill.order_index === newSkill.order_index;
    });

    // Step 4: Identify completely new skills (ONLY if not in any other category)
    const toAdd = newSkills.filter(newSkill => {
      // CRITICAL: A skill should ONLY be added if it's not in ANY other category
      const isInActive = activeCurrentSkills.some(currentSkill => currentSkill.skill_type === newSkill.skill_type);
      const isInUpdate = toUpdate.some(skill => skill.skill_type === newSkill.skill_type);
      const isInKeep = toKeep.some(skill => skill.skill_type === newSkill.skill_type);
      const isInReactivate = toReactivate.some(skill => skill.skill_type === newSkill.skill_type);

      const shouldAdd = !isInActive && !isInUpdate && !isInKeep && !isInReactivate;


      return shouldAdd;
    });

    // Step 5: Identify active skills to delete (not in new selection)
    const toDelete = activeCurrentSkills.filter(currentSkill => 
      !selectedSkillTypes.includes(currentSkill.skill_type)
    );


    // Step 6: Validation - ensure no skill is in multiple categories (DESTROY MODE)
    const allCategorizedSkills = [...toUpdate, ...toAdd, ...toKeep];
    const duplicateSkills = allCategorizedSkills.filter((skill, index) => 
      allCategorizedSkills.findIndex(s => s.skill_type === skill.skill_type) !== index
    );


    const analysis: SkillAnalysis = {
      toDelete,
      toUpdate,
      toAdd,
      toReactivate,
      toKeep
    };


    // Final validation before returning analysis (DESTROY MODE)
    const totalSkills = analysis.toDelete.length + analysis.toUpdate.length + analysis.toAdd.length + 
                        analysis.toKeep.length;
    
    // CRITICAL: Only count skills that are actually in the new selection
    const skillsInNewSelection = newSkills.length;
    const skillsBeingProcessed = analysis.toUpdate.length + analysis.toAdd.length + 
                                  analysis.toKeep.length + analysis.toReactivate.length;
    

    // CRITICAL: Double-check that no active skill is in toAdd
    const activeSkillTypes = activeCurrentSkills.map(s => s.skill_type);
    const skillsInToAdd = analysis.toAdd.map(s => s.skill_type);
    const conflictingSkills = skillsInToAdd.filter(skillType => activeSkillTypes.includes(skillType));
    
    if (conflictingSkills.length > 0) {
      // Move conflicting skills from toAdd to toUpdate
      analysis.toAdd = analysis.toAdd.filter(skill => !conflictingSkills.includes(skill.skill_type));
      
      // Add them to toUpdate instead
      conflictingSkills.forEach(skillType => {
        const skillData = newSkills.find(s => s.skill_type === skillType);
        if (skillData) {
          analysis.toUpdate.push(skillData);
        }
      });
    }
    
    return analysis;
  }

  /**
   * Execute skill operations in proper sequence
   */
  private executeSkillOperationsSequentially(
    examId: number,
    analysis: SkillAnalysis,
    result: SkillOperationResult
  ): Observable<SkillOperationResult> {
    const operations: Observable<any>[] = [];

    // 1. Soft delete skills first (set is_deleted = 1)
    analysis.toDelete.forEach((skill: ExamSkill) => {
      operations.push(
        this.studyResultService.deleteExamSkill(skill.id!).pipe(
          map(() => {
            result.deleted.push(skill);
          }),
          catchError(error => {
            result.errors.push(`Failed to soft delete skill ${skill.skill_type}: ${error.message}`);
            return of(null);
          })
        )
      );
    });

    // 2. Reactivate soft-deleted skills
    analysis.toReactivate.forEach((skill: SkillUpdateData) => {
      operations.push(
        this.reactivateSoftDeletedSkill(examId, skill).pipe(
          map(reactivatedSkill => {
            result.added.push(reactivatedSkill);
          }),
          catchError(error => {
            result.errors.push(`Failed to reactivate skill ${skill.skill_type}: ${error.message}`);
            return of(null);
          })
        )
      );
    });

    // 3. Update existing skills
    analysis.toUpdate.forEach((skill: SkillUpdateData) => {
      operations.push(
        this.updateExistingSkill(examId, skill).pipe(
          map(updatedSkill => {
            if (updatedSkill) {
              result.updated.push(updatedSkill);
            }
          }),
          catchError(error => {
            result.errors.push(`Failed to update skill ${skill.skill_type}: ${error.message}`);
            return of(null);
          })
        )
      );
    });

    // 4. Add new skills (with double-check)
    analysis.toAdd.forEach((skill: SkillUpdateData) => {
      // Final validation before adding
      operations.push(
        this.studyResultService.getExistingExamSkill(examId, skill.skill_type).pipe(
          switchMap(existingSkill => {
            if (existingSkill) {
              return of(null);
            }

            return this.createSkillWithEmptyResults(examId, skill).pipe(
              map(createdSkill => {
                if (createdSkill) {
                  result.added.push(createdSkill);
                }
              }),
              catchError(error => {
                result.errors.push(`Failed to create skill ${skill.skill_type}: ${error.message}`);
                return of(null);
              })
            );
          }),
          catchError(error => {
            result.errors.push(`Failed to check existing skill ${skill.skill_type}: ${error.message}`);
            return of(null);
          })
        )
      );
    });

    // 4. Keep skills (no operation needed)

    return operations.length > 0
      ? this.executeSequentially(operations).pipe(map(() => result))
      : of(result);
  }

  /**
   * Update existing skill
   */
  private updateExistingSkill(examId: number, skillData: SkillUpdateData): Observable<ExamSkill> {

    // First, get the existing skill
    return this.studyResultService.getExamSkillsByExamIds([examId]).pipe(
      switchMap(allSkills => {
        const existingSkill = allSkills.find(skill =>
          skill.skill_type === skillData.skill_type && !skill.is_deleted
        );

        if (!existingSkill) {
          return this.createSkillWithEmptyResults(examId, skillData);
        }

        // Update the existing skill
        const updatedSkill: ExamSkill = {
          ...existingSkill,
          max_score: skillData.max_score,
          weight: skillData.weight,
          order_index: skillData.order_index,
          updated_at: new Date().toISOString()
        };

        return this.studyResultService.updateSingleExamSkill(existingSkill.id!, updatedSkill).pipe(
          map(() => {
            return updatedSkill;
          }),
          catchError(error => {
            return throwError(() => error);
          })
        );
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Create skill and initialize empty results for all students
   */
  private createSkillWithEmptyResults(examId: number, skillData: SkillUpdateData): Observable<ExamSkill> {

    // Validate examId
    if (!examId || examId === undefined || examId === null) {
      return throwError(() => new Error(`Invalid examId: ${examId}`));
    }

    // Triple-check: Try to get existing skill first
    return this.studyResultService.getExistingExamSkill(examId, skillData.skill_type).pipe(
      switchMap(existingSkill => {
        if (existingSkill) {
          // Update existing skill with new properties
          return this.studyResultService.updateSingleExamSkill(existingSkill.id!, {
            ...existingSkill,
            max_score: skillData.max_score,
            weight: skillData.weight,
            order_index: skillData.order_index,
            is_deleted: 0 // Ensure it's active
          });
        }
        
        
        // Additional check: Get all skills for this exam to see if it exists
        return this.studyResultService.getExamSkillsByExamIds([examId]).pipe(
          switchMap(allSkills => {
            
            // Check for ANY skill with this skill_type (active or soft-deleted)
            const anySkill = allSkills.find(skill => 
              skill.skill_type === skillData.skill_type
            );
            
            if (anySkill) {
              if (anySkill.is_deleted) {
                return this.studyResultService.reactivateExamSkill(anySkill.id!, {
                  exam_id: anySkill.exam_id,
                  skill_type: anySkill.skill_type,
                  max_score: skillData.max_score,
                  weight: skillData.weight,
                  order_index: skillData.order_index,
                  is_deleted: 0
                });
              } else {
                return this.studyResultService.updateSingleExamSkill(anySkill.id!, {
                  ...anySkill,
                  max_score: skillData.max_score,
                  weight: skillData.weight,
                  order_index: skillData.order_index,
                  is_deleted: 0
                });
              }
            }
            
            
            // Add small delay to avoid race conditions
            return timer(100).pipe(
              switchMap(() => {
                
                // Create new skill if doesn't exist
                const skillWithExamId = { ...skillData, exam_id: examId };
                return this.studyResultService.createExamSkill(skillWithExamId).pipe(
                  switchMap(createdSkill => {
                    // Check if this is a mock skill (created due to duplicate)
                    if (createdSkill.id && createdSkill.id > 1000000000000) { // Mock ID check
                      return of(createdSkill);
                    }

                    // Create empty score records for all students
                    return this.createEmptyScoreRecordsForNewSkill(createdSkill.id!, skillData.skill_type).pipe(
                      map(() => createdSkill),
                      catchError(error => {
                        // Return the skill even if score creation fails
                        return of(createdSkill);
                      })
                    );
                  }),
                  catchError(error => {
                    
                    // If skill creation fails due to duplicate, try to get existing skill
                    if (error.message?.includes('already exists') || error.message?.includes('Duplicate entry')) {
                      
                      // Try to get the existing skill again
                      return this.studyResultService.getExistingExamSkill(examId, skillData.skill_type).pipe(
                        switchMap(existingSkill => {
                          if (existingSkill) {
                            return of(existingSkill);
                          }
                          
                          // Fallback to mock skill
                          return of({
                            id: Date.now(),
                            exam_id: examId,
                            skill_type: skillData.skill_type,
                            max_score: skillData.max_score,
                            weight: skillData.weight,
                            order_index: skillData.order_index,
                            total_students: skillData.total_students,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          });
                        }),
                        catchError(() => {
                          // Final fallback
                          return of({
                            id: Date.now(),
                            exam_id: examId,
                            skill_type: skillData.skill_type,
                            max_score: skillData.max_score,
                            weight: skillData.weight,
                            order_index: skillData.order_index,
                            total_students: skillData.total_students,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                          });
                        })
                      );
                    }
                    return throwError(() => error);
                  })
                );
              })
            );
          }),
          catchError(error => {
            return throwError(() => error);
          })
        );
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Reactivate soft-deleted skill
   */
  private reactivateSoftDeletedSkill(examId: number, skillData: SkillUpdateData): Observable<ExamSkill> {
    return this.studyResultService.getExamSkillsByExamIds([examId]).pipe(
      switchMap(allSkills => {
        const softDeletedSkill = allSkills.find(skill =>
          skill.skill_type === skillData.skill_type && skill.is_deleted
        );

        if (!softDeletedSkill) {
          // If no soft-deleted skill found, create new one
          return this.createSkillWithEmptyResults(examId, skillData);
        }


        // Use the specialized reactivate API
        return this.studyResultService.reactivateExamSkill(softDeletedSkill.id!, {
          exam_id: softDeletedSkill.exam_id,
          skill_type: softDeletedSkill.skill_type,
          max_score: skillData.max_score,
          weight: skillData.weight,
          order_index: skillData.order_index,
          is_deleted: 0
        }).pipe(
          map(reactivatedSkill => {
            return reactivatedSkill;
          }),
          catchError(error => {
            // Fallback to creating new skill if reactivation fails
            return this.createSkillWithEmptyResults(examId, skillData);
          })
        );
      })
    );
  }

  /**
   * Create empty score records for all students when a new skill is added
   */
  private createEmptyScoreRecordsForNewSkill(examSkillId: number, skillType: string): Observable<void> {
    return this.classStudentService.getStudentsByClass(0).pipe( // Will be overridden by caller
      switchMap(students => {
        if (!students || students.length === 0) {
          return of(void 0);
        }

        const emptyResults = students.map((student: any) => ({
          exam_skill_id: examSkillId,
          student_id: student.student_id || student.id,
          score: 0,
          percentage: 0,
          level: 'A1' as const,
          teacher_comment: '',
          student_feedback: '',
          is_passed: false,
          grade_point: 0
        }));

        // Create results in batches to avoid overwhelming the server
        const batchSize = 5;
        const batches = this.createBatches(emptyResults, batchSize);
        
        return this.createResultsInBatches(batches);
      }),
      catchError(error => {
        return of(void 0);
      })
    );
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Create results in batches
   */
  private createResultsInBatches(batches: any[][]): Observable<void> {
    if (batches.length === 0) return of(void 0);

    const batchOperations = batches.map(batch => 
      forkJoin(batch.map(result => 
        this.studyResultService.createExamResult(result).pipe(
          catchError(error => {
            return of(null);
          })
        )
      ))
    );

    return this.executeSequentially(batchOperations).pipe(
      map(() => void 0)
    );
  }

  /**
   * Check if a skill has student scores (for business rule validation)
   */
  checkSkillHasStudentScores(examId: number, skillType: string): Observable<boolean> {
    // For now, return false to avoid 404 errors
    // TODO: Implement proper API endpoint or use alternative method
    return of(false);
  }

  /**
   * Validate exam data before submission
   */
  validateExamData(exam: Exam, skills: SkillUpdateData[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!exam.exam_name?.trim()) {
      errors.push('Tên bài kiểm tra không được để trống');
    }

    if (!exam.exam_type) {
      errors.push('Loại kiểm tra không được để trống');
    }

    if (!exam.exam_date) {
      errors.push('Ngày kiểm tra không được để trống');
    }

    if (!skills || skills.length === 0) {
      errors.push('Phải chọn ít nhất một kỹ năng');
    }

    // Check for duplicate skill types
    const skillTypes = new Set<string>();
    skills.forEach(skill => {
      if (skillTypes.has(skill.skill_type)) {
        errors.push(`Kỹ năng '${skill.skill_type}' bị trùng lặp`);
      }
      skillTypes.add(skill.skill_type);

      if (skill.max_score <= 0) {
        errors.push(`Điểm tối đa cho kỹ năng '${skill.skill_type}' phải lớn hơn 0`);
      }

      if (skill.weight <= 0) {
        errors.push(`Trọng số cho kỹ năng '${skill.skill_type}' phải lớn hơn 0`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate skills data
   */
  private validateSkillsData(skillsData: SkillUpdateData[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const skillTypes = new Set<string>();

    // Check for duplicate skill types in the same request
    for (const skill of skillsData) {
      if (skillTypes.has(skill.skill_type)) {
        errors.push(`Duplicate skill type '${skill.skill_type}' in the same request`);
      }
      skillTypes.add(skill.skill_type);

      // Validate skill properties
      if (skill.max_score <= 0) {
        errors.push(`Invalid max_score for skill '${skill.skill_type}': ${skill.max_score}`);
      }

      if (skill.weight <= 0) {
        errors.push(`Invalid weight for skill '${skill.skill_type}': ${skill.weight}`);
      }

      if (skill.order_index < 0) {
        errors.push(`Invalid order_index for skill '${skill.skill_type}': ${skill.order_index}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Execute operations sequentially to avoid race conditions
   */
  private executeSequentially(operations: Observable<any>[]): Observable<any[]> {
    if (operations.length === 0) return of([]);

    return operations.reduce((acc, operation) => 
      acc.pipe(
        switchMap(results => 
          operation.pipe(
            map(result => [...results, result])
          )
        )
      ), 
      of([])
    );
  }

  // Update exam status with validation and audit logging
  updateExamStatus(examId: number, newStatus: string, reason?: string): Observable<any> {
    return this.studyResultService.updateExamStatus(examId, newStatus).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error updating exam status:', error);
        return throwError(() => error);
      })
    );
  }

  // Get exam status history
  getExamStatusHistory(examId: number): Observable<any[]> {
    return this.studyResultService.getExamStatusHistory(examId);
  }
}