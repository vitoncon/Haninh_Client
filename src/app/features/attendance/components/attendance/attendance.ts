import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { AttendanceService } from '../../services/attendance.service';
import { ClassService } from '../../../class-management/services/class.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    TableModule,
    RadioButtonModule,
    ToastModule,
    TagModule,
    AvatarModule,
    TooltipModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule
  ],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.scss'],
  providers: [MessageService]
})
export class AttendanceComponent implements OnInit, OnDestroy {
  classes: any[] = [];
  selectedClass: any = null;
  selectedDate: Date = new Date();
  students: any[] = [];
  loading = false;
  saving = false;
  isTeacher = false;
  searchTerm: string = '';
  private destroy$ = new Subject<void>();

  constructor(
    private attendanceService: AttendanceService,
    private classService: ClassService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    const roleId = this.authService.getRole();
    this.isTeacher = roleId === 2;
  }

  ngOnInit() {
    this.loadClasses();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadClasses() {
    const classObservable = this.isTeacher 
      ? this.attendanceService.getTeacherClasses() 
      : this.classService.getClasses();

    classObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.classes = res;
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách lớp' });
      }
    });
  }

  onClassChange() {
    if (this.selectedClass) {
      this.loadStudentsAndAttendance();
    }
  }

  onDateChange() {
    if (this.selectedClass) {
      this.loadStudentsAndAttendance();
    }
  }

  loadStudentsAndAttendance() {
    this.loading = true;
    // Format date carefully to YYYY-MM-DD
    const dateStr = this.formatDate(this.selectedDate);
    
    this.attendanceService.getAttendanceByClass(this.selectedClass.id, dateStr).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res: any) => {
        this.students = res.map((s: any) => ({
          ...s,
          status: s.status || 'present'
        }));
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: 'Không thể tải danh sách học viên' });
      }
    });
  }

  formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  saveAttendance() {
    this.saving = true;
    const dateStr = this.formatDate(this.selectedDate);
    const records = this.students.map(s => ({
      student_id: s.student_id,
      status: s.status
    }));

    this.attendanceService.markAttendance({
      class_id: this.selectedClass.id,
      date: dateStr,
      records: records
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.messageService.add({ severity: 'success', summary: 'Thành công', detail: 'Đã lưu điểm danh học viên' });
      },
      error: (err: any) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Lỗi', detail: err.error?.error || 'Không thể lưu chuyên cần' });
      }
    });
  }

  markAllPresent() {
    this.students.forEach(s => s.status = 'present');
    this.messageService.add({ severity: 'info', summary: 'Thông báo', detail: 'Đã đánh dấu tất cả có mặt' });
  }

  get stats() {
    const total = this.students.length;
    const present = this.students.filter(s => s.status === 'present').length;
    const absent = this.students.filter(s => s.status === 'absent').length;
    const late = this.students.filter(s => s.status === 'late').length;
    const excused = this.students.filter(s => s.status === 'excused').length;
    const rate = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0;
    
    return { total, present, absent, late, excused, rate };
  }

  get filteredStudents() {
    if (!this.searchTerm) return this.students;
    const s = this.searchTerm.toLowerCase();
    return this.students.filter(student => 
      student.full_name?.toLowerCase().includes(s) || 
      student.student_code?.toLowerCase().includes(s)
    );
  }

  getInitials(name: string): string {
    if (!name) return 'HV';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }
}

