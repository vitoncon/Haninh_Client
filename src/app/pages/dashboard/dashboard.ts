import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { NotificationsWidget } from './components/notificationswidget';
import { StatsWidget } from './components/statswidget';
import { RecentSalesWidget } from './components/recentsaleswidget';
import { BestSellingWidget } from './components/bestsellingwidget';
import { RevenueStreamWidget } from './components/revenuestreamwidget';
import { ClassDistributionWidget } from './components/classdistributionwidget';
import { PaymentStatusWidget } from './components/paymentstatuswidget';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../features/students-management/services/student.service';
import { AttendanceService } from '../../features/attendance/services/attendance.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        ToastModule,
        StatsWidget,
        RecentSalesWidget,
        BestSellingWidget,
        RevenueStreamWidget,
        NotificationsWidget,
        ClassDistributionWidget,
        PaymentStatusWidget
    ],
   
    template: `
        <div class="grid grid-cols-12 gap-6">

            <!-- ====== Admin / Teacher Dashboard ====== -->
            <ng-container *ngIf="!isStudent; else studentDashboard">
                <!-- Statistics Cards -->
                <app-stats-widget class="contents" />
                
                <!-- Charts Row 1 -->
                <div class="col-span-12 xl:col-span-8" *ngIf="isAdmin">
                    <app-revenue-stream-widget />
                </div>
                <div class="col-span-12 xl:col-span-4" *ngIf="isAdmin">
                    <app-payment-status-widget />
                </div>

                <!-- Charts Row 2 -->
                <div class="col-span-12 xl:col-span-6">
                    <app-class-distribution-widget />
                </div>
                <div class="col-span-12 xl:col-span-6">
                    <app-notifications-widget />
                </div>

                <!-- Tables Row -->
                <div class="col-span-12 xl:col-span-6" *ngIf="isAdmin">
                    <app-recent-sales-widget />
                </div>
                <div class="col-span-12 xl:col-span-6" *ngIf="isAdmin">
                    <app-best-selling-widget />
                </div>
            </ng-container>

            <!-- ====== Student Dashboard ====== -->
            <ng-template #studentDashboard>
                <div class="col-span-12">
                    <div class="text-xl font-semibold mb-4">Tổng quan học tập của bạn</div>
                </div>

                <!-- Enrolled classes -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-lg font-semibold">Lớp đang học</span>
                        </div>
                        <div *ngIf="studentLoading" class="text-sm text-gray-500">Đang tải dữ liệu lớp học...</div>
                        <ul *ngIf="!studentLoading && studentClasses.length > 0" class="space-y-2">
                            <li *ngFor="let cls of studentClasses" class="flex flex-col border border-surface-200 dark:border-surface-700 rounded-md p-3">
                                <span class="font-medium">{{ cls.class_name }}</span>
                                <span class="text-sm text-gray-500">Giáo viên: {{ cls.teacher_name || 'Đang cập nhật' }}</span>
                                <span class="text-sm text-gray-500">Khóa học: {{ cls.course_name || 'Đang cập nhật' }}</span>
                                <span class="text-sm text-gray-500">Ngày bắt đầu: {{ cls.start_date | date:'dd/MM/yyyy' }}</span>
                            </li>
                        </ul>
                        <div *ngIf="!studentLoading && studentClasses.length === 0" class="text-sm text-gray-500">
                            Bạn chưa được ghi danh vào lớp học nào.
                        </div>
                    </div>
                </div>

                <!-- Upcoming schedules -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-lg font-semibold">Lịch học sắp tới</span>
                        </div>
                        <div *ngIf="studentLoading" class="text-sm text-gray-500">Đang tải lịch học...</div>
                        <ul *ngIf="!studentLoading && upcomingSchedules.length > 0" class="space-y-2">
                            <li *ngFor="let sch of upcomingSchedules" class="flex flex-col border border-surface-200 dark:border-surface-700 rounded-md p-3">
                                <span class="font-medium">{{ sch.class_name }}</span>
                                <span class="text-sm text-gray-500">
                                    {{ sch.date | date:'dd/MM/yyyy' }} • {{ sch.start_time }} - {{ sch.end_time }}
                                </span>
                                <span class="text-sm text-gray-500">Phòng: {{ sch.room_name || 'Đang cập nhật' }}</span>
                            </li>
                        </ul>
                        <div *ngIf="!studentLoading && upcomingSchedules.length === 0" class="text-sm text-gray-500">
                            Hiện chưa có buổi học nào sắp tới.
                        </div>
                    </div>
                </div>

                <!-- Attendance & study results summary -->
                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-lg font-semibold">Tổng quan chuyên cần</span>
                        </div>
                        <div *ngIf="studentLoading" class="text-sm text-gray-500">Đang tải dữ liệu chuyên cần...</div>
                        <div *ngIf="!studentLoading">
                            <div class="text-sm text-gray-500 mb-2">
                                Tổng số buổi: {{ attendanceSummary.total }}
                            </div>
                            <div class="space-y-1 text-sm">
                                <div>Đi học: <span class="font-semibold text-green-600">{{ attendanceSummary.present }}</span></div>
                                <div>Vắng: <span class="font-semibold text-red-500">{{ attendanceSummary.absent }}</span></div>
                                <div>Đi trễ: <span class="font-semibold text-orange-500">{{ attendanceSummary.late }}</span></div>
                                <div>Xin phép: <span class="font-semibold text-blue-500">{{ attendanceSummary.excused }}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-span-12 lg:col-span-6">
                    <div class="card">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-lg font-semibold">Tổng quan kết quả học tập</span>
                        </div>
                        <div *ngIf="studentLoading" class="text-sm text-gray-500">Đang tải dữ liệu kết quả...</div>
                        <div *ngIf="!studentLoading">
                            <div class="text-sm text-gray-500 mb-2">
                                Tổng số bài kiểm tra: {{ studyResultsSummary.total_exams }}
                            </div>
                            <div class="space-y-1 text-sm">
                                <div>Điểm trung bình: 
                                    <span class="font-semibold">{{ studyResultsSummary.average_score | number:'1.1-1' }}</span>
                                </div>
                                <div>Tỷ lệ đạt:
                                    <span class="font-semibold">{{ studyResultsSummary.pass_rate | number:'1.0-0' }}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ng-template>
        </div>
    `
})
export class Dashboard implements OnInit {
    isAdmin = false;
    isStudent = false;

    // Student dashboard state
    studentLoading = false;
    studentClasses: any[] = [];
    upcomingSchedules: any[] = [];
    attendanceSummary = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
    };
    studyResultsSummary = {
        total_exams: 0,
        average_score: 0,
        pass_rate: 0
    };

    constructor(
        private messageService: MessageService,
        private authService: AuthService,
        private studentService: StudentService,
        private attendanceService: AttendanceService
    ) {}

    ngOnInit(): void {
        const roles = this.authService.getRoles();
        this.isAdmin = roles.includes(1);
        this.isStudent = roles.includes(3) && !roles.includes(1) && !roles.includes(2);

        const navState = history.state;
    
        if (navState?.loginSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'Đăng nhập thành công',
            detail: 'Chào mừng đến với Hà Ninh Academy!'
          });
          history.replaceState({}, '');
        }

        if (this.isStudent) {
            this.loadStudentDashboard();
        }
    }

    /**
     * Tải dữ liệu dashboard cho học viên:
     * - Lớp đang học
     * - Lịch học sắp tới
     * - Tổng quan chuyên cần
     * - Tổng quan kết quả học tập
     */
    private loadStudentDashboard(): void {
        this.studentLoading = true;

        this.studentService.getCurrentStudent().subscribe({
            next: (res) => {
                const student = res?.data ?? res;
                if (!student || !student.id) {
                    this.studentLoading = false;
                    return;
                }

                const studentId = student.id as number;

                // Lấy lớp đang học & kết quả học tập & chuyên cần song song
                const classes$ = this.studentService.getClassStudentsWithDetails({ student_id: studentId });
                const attendance$ = this.attendanceService.getAttendanceByStudent(studentId);
                const results$ = this.studentService.getStudyResults({ student_id: studentId });

                forkJoin({ classes: classes$, attendance: attendance$, results: results$ }).subscribe({
                    next: ({ classes, attendance, results }) => {
                        const classData = classes?.data ?? classes ?? [];
                        this.studentClasses = Array.isArray(classData) ? classData : [];

                        // Tính lịch học sắp tới từ class_schedules (nếu có trong payload) hoặc từ schedule liên quan
                        this.upcomingSchedules = this.computeUpcomingSchedules(this.studentClasses);

                        // Tổng hợp chuyên cần
                        const attendanceList = Array.isArray(attendance) ? attendance : (attendance?.data ?? []);
                        this.computeAttendanceSummary(attendanceList);

                        // Tổng hợp kết quả học tập
                        const resultList = Array.isArray(results) ? results : (results?.data ?? []);
                        this.computeStudyResultsSummary(resultList);

                        this.studentLoading = false;
                    },
                    error: () => {
                        this.studentLoading = false;
                    }
                });
            },
            error: () => {
                this.studentLoading = false;
            }
        });
    }

    private computeUpcomingSchedules(classes: any[]): any[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const schedules: any[] = [];

        // Nếu backend đã join sẵn class_schedules vào class_students (tuỳ cấu hình), có thể tận dụng ở đây.
        // Nếu chưa có, học viên vẫn có thể xem lịch ở trang lịch học chi tiết.
        classes.forEach((cls: any) => {
            if (Array.isArray(cls.class_schedules)) {
                cls.class_schedules.forEach((sch: any) => {
                    const date = new Date(sch.date || sch.start_date);
                    date.setHours(0, 0, 0, 0);
                    if (date >= today) {
                        schedules.push({
                            class_name: cls.class_name,
                            date,
                            start_time: sch.start_time?.slice(0, 5) || '',
                            end_time: sch.end_time?.slice(0, 5) || '',
                            room_name: sch.room_name || ''
                        });
                    }
                });
            }
        });

        // Sắp xếp theo ngày gần nhất
        return schedules
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5);
    }

    private computeAttendanceSummary(attendanceList: any[]): void {
        const summary = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
        };

        if (!Array.isArray(attendanceList)) {
            this.attendanceSummary = summary;
            return;
        }

        summary.total = attendanceList.length;
        attendanceList.forEach((r: any) => {
            const status = r.status;
            if (status === 'present') summary.present++;
            else if (status === 'absent') summary.absent++;
            else if (status === 'late') summary.late++;
            else if (status === 'excused') summary.excused++;
        });

        this.attendanceSummary = summary;
    }

    private computeStudyResultsSummary(results: any[]): void {
        if (!Array.isArray(results) || results.length === 0) {
            this.studyResultsSummary = {
                total_exams: 0,
                average_score: 0,
                pass_rate: 0
            };
            return;
        }

        const scores: number[] = [];
        results.forEach((r: any) => {
            const percentage = typeof r.percentage === 'string'
                ? parseFloat(r.percentage)
                : r.percentage;
            if (percentage != null && !isNaN(percentage)) {
                scores.push(percentage);
            }
        });

        if (!scores.length) {
            this.studyResultsSummary = {
                total_exams: 0,
                average_score: 0,
                pass_rate: 0
            };
            return;
        }

        const totalExams = scores.length;
        const average = scores.reduce((sum, v) => sum + v, 0) / totalExams;
        const passCount = scores.filter((s) => s >= 60).length;
        const passRate = (passCount / totalExams) * 100;

        this.studyResultsSummary = {
            total_exams: totalExams,
            average_score: average,
            pass_rate: passRate
        };
    }
}