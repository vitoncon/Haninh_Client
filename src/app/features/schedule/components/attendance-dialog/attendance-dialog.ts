import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AttendanceService, AttendanceModel } from '../../services/attendance.service';
import { StudentService } from '../../../students-management/services/student.service';
import { StudentsModel } from '../../../students-management/models/students.model';

@Component({
  selector: 'app-attendance-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogModule, TableModule, ButtonModule, SelectModule, ToastModule],
  templateUrl: './attendance-dialog.html',
  styleUrls: ['./attendance-dialog.scss'],
  providers: [MessageService]
})
export class AttendanceDialog implements OnChanges {
  @Input() visible: boolean = false;
  @Input() scheduleId!: number;
  @Input() classId!: number;
  @Input() scheduleTitle: string = '';
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() onSaved = new EventEmitter<void>();

  loading: boolean = false;
  saving: boolean = false;

  students: any[] = []; // Combines student info and attendance

  statusOptions = [
    { label: 'Có mặt', value: 'Có mặt' },
    { label: 'Đến muộn', value: 'Đến muộn' },
    { label: 'Vắng mặt', value: 'Vắng mặt' },
    { label: 'Có phép', value: 'Có phép' }
  ];

  constructor(
    private attendanceService: AttendanceService,
    private studentService: StudentService,
    private messageService: MessageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible && this.classId && this.scheduleId) {
      this.loadData();
    }
  }

  loadData() {
    this.loading = true;
    // Load students in class and current attendance records for this schedule
    this.studentService.getClassStudentsWithDetails({ class_id: this.classId }).subscribe({
      next: (res: any) => {
        const students = res.data || [];
        this.attendanceService.getAttendanceBySchedule(this.scheduleId).subscribe({
          next: (attRes: any) => {
             const attendanceRecords: AttendanceModel[] = attRes.data || [];
             this.students = students.map((s: any) => {
               // The join returns student data nested, we need to extract it or use it as is if it's flat
               // Based on standard implementation, the student data is likely merged or under 'student'
               const record = attendanceRecords.find(a => a.student_id === s.student_id);
               return {
                 student: {
                    id: s.student_id,
                    student_code: s.student_code || s.student?.student_code,
                    full_name: s.full_name || s.student?.full_name
                 },
                 attendance: record ? { ...record } : { 
                   student_id: s.student_id, 
                   class_id: this.classId, 
                   schedule_id: this.scheduleId, 
                   status: 'Có mặt' // default
                 } as AttendanceModel
               };
             });
             this.loading = false;
          },
          error: () => {
             this.loading = false;
             this.showError('Lỗi lấy dữ liệu điểm danh');
          }
        });
      },
      error: () => {
        this.loading = false;
        this.showError('Lỗi lấy danh sách học viên');
      }
    });
  }

  saveAttendance() {
    this.saving = true;
    let completed = 0;
    const total = this.students.length;
    
    if(total === 0) {
      this.saving = false;
      this.onHide();
      return;
    }

    let hasError = false;

    this.students.forEach(row => {
      const payload = row.attendance;
      const request = payload.id 
          ? this.attendanceService.updateAttendance(payload.id, payload)
          : this.attendanceService.createAttendance(payload);

      request.subscribe({
        next: () => {
          completed++;
          if (completed === total && !hasError) {
            this.saving = false;
            this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu điểm danh' });
            setTimeout(() => {
              this.onSaved.emit();
              this.onHide();
            }, 500);
          }
        },
        error: () => {
          hasError = true;
          this.saving = false;
          this.showError('Có lỗi khi lưu điểm danh học viên');
        }
      });
    });
  }

  markAllPresent() {
    this.students.forEach(s => s.attendance.status = 'Có mặt');
  }

  onHide() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  private showError(msg: string) {
    this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: msg });
  }
}
