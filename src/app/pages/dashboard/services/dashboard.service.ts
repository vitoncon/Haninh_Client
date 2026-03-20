import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StudentService } from '../../../features/students-management/services/student.service';
import { ClassService } from '../../../features/class-management/services/class.service';
import { ClassStudentService } from '../../../features/class-management/services/class-student.service';
import { CoursesService } from '../../../features/courses/services/courses.service';
import { FeeService } from '../../../features/fees/services/fee.service';
import { TeacherService } from '../../../features/teacher-management/services/teacher.service';
import { AuthService } from '../../../core/services/auth.service';

export interface DashboardStatistics {
  totalStudents: number;
  totalClasses: number;      // Tổng số lớp (tất cả)
  activeClasses: number;     // Số lớp đang diễn ra
  totalCourses: number;      // Tổng khóa học
  totalRevenue: number;
  recentRegistrations: number;
  attendanceRate: number;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private studentService: StudentService,
    private classService: ClassService,
    private classStudentService: ClassStudentService,
    private coursesService: CoursesService,
    private feeService: FeeService,
    private teacherService: TeacherService,
    private authService: AuthService
  ) {}

  private isTeacher(): boolean {
    return this.authService.getRole() === 2;
  }

  getDashboardStatistics(): Observable<DashboardStatistics> {
    const handleUnauthorized = (err: any) => {
      if (err.status === 403) return of({ data: [], recordTotal: 0, total_amount: 0 });
      return throwError(() => err);
    };

    const isTeacher = this.isTeacher();

    return forkJoin({
      students: this.studentService.getStudents().pipe(catchError(handleUnauthorized)),
      classes: this.classService.getClasses().pipe(catchError(handleUnauthorized)),
      courses: this.coursesService.getCourses().pipe(catchError(handleUnauthorized)),
      fees: isTeacher ? of([]) : this.feeService.getFeesWithDetails({ limit: 1000, order: 'desc', orderBy: 'paid_date' }).pipe(catchError(handleUnauthorized)),
      feesStats: isTeacher ? of({ total_amount: 0, paid_amount: 0, debt_amount: 0, total_students: 0, paid_students: 0, debt_students: 0 }) : this.feeService.getFeeStatistics({ limit: 1000, order: 'desc', orderBy: 'paid_date' }).pipe(catchError(handleUnauthorized))
    }).pipe(
      map(({ students, classes, courses, fees, feesStats }: any) => {
        // Robust data extraction
        const feesList = Array.isArray((fees as any)?.data) ? (fees as any).data : (Array.isArray(fees) ? fees : []);
        const studentsList = Array.isArray(students) ? students : (students?.data || []);
        const classesList = Array.isArray(classes) ? classes : (classes?.data || []);
        const coursesList = Array.isArray(courses) ? courses : (courses?.data || []);
        
        const totalStudents = studentsList?.length || 0;
        const totalClasses = classesList?.length || 0;
        const activeClasses = (classesList || []).filter((cls: any) => cls.status === 'Đang diễn ra').length;
        const totalCourses = coursesList?.length || 0;
        const totalRevenue = feesStats?.total_amount || 0;
        const recentRegistrations = this.getRecentRegistrationsCount(studentsList);
        const attendanceRate = 85;
        
        return {
          totalStudents,
          totalClasses,
          activeClasses,
          totalCourses,
          totalRevenue,
          recentRegistrations,
          attendanceRate
        };
      })
    );
  }

  getRecentStudents(): Observable<any[]> {
    return this.studentService.getStudents().pipe(
      map(response => {
        const students = Array.isArray(response) ? response : (response?.data || []);
        
        if (!Array.isArray(students)) {
          return [];
        }
        
        const sortedStudents = students
          .filter((s: any) => s && typeof s === 'object')
          .sort((a: any, b: any) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
          });
        
        return sortedStudents.slice(0, 5);
      })
    );
  }

  getClassDistributionByCourse(): Observable<ChartData> {
    return forkJoin({
      classes: this.classService.getClasses(),
      courses: this.coursesService.getCourses()
    }).pipe(
      map(({ classes, courses }) => {
        // Handle response structure
        const classesList = Array.isArray(classes) ? classes : [];
        const coursesList = Array.isArray(courses) ? courses : [];
        
        // Count classes by course
        const courseMap = new Map<string, number>();
        const colors = [
          '#3B82F6', // blue
          '#10B981', // green
          '#F59E0B', // orange
          '#EF4444', // red
          '#8B5CF6', // purple
          '#06B6D4', // cyan
          '#EC4899', // pink
          '#14B8A6', // teal
        ];
        
        classesList.forEach((cls: any) => {
          const courseId = cls.course_id;
          
          // Find course by matching id (handle both string and number)
          const course = coursesList.find((c: any) => {
            const cId = typeof c.id === 'number' ? c.id : parseInt(c.id);
            const clsCourseId = typeof courseId === 'number' ? courseId : parseInt(courseId);
            return cId === clsCourseId;
          });
          
          const courseName = course?.course_name || cls.course_name || 'Chưa xác định';
          courseMap.set(courseName, (courseMap.get(courseName) || 0) + 1);
        });

        // If no data, create default
        if (courseMap.size === 0) {
          return {
            labels: ['Chưa có dữ liệu'],
            datasets: [{
              label: 'Số lớp',
              data: [0],
              backgroundColor: ['#E5E7EB']
            }]
          };
        }

        // Convert to array and sort by count (descending)
        const sortedEntries = Array.from(courseMap.entries())
          .sort((a, b) => b[1] - a[1]); // Sort by count descending
        
        const labels = sortedEntries.map(([name]) => name);
        const values = sortedEntries.map(([, count]) => count);

        return {
          labels: labels,
          datasets: [{
            label: 'Số lớp',
            data: values,
            backgroundColor: colors.slice(0, labels.length)
          }]
        };
      })
    );
  }

  getRevenueChartData(): Observable<ChartData> {
    if (this.isTeacher()) {
      return of({
        labels: [],
        datasets: [{
          label: 'Doanh thu (VNĐ)',
          data: [],
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
          tension: 0.4,
          fill: false
        }]
      });
    }
    return this.feeService.getFeesWithDetails({ limit: 1000, order: 'desc', orderBy: 'paid_date' }).pipe(
      catchError(err => {
        if (err.status === 403) {
          return of([]);
        }
        return throwError(() => err);
      }),
      map(fees => {
        // Safe data extraction
        const feesList = Array.isArray((fees as any)?.data) ? (fees as any).data : (Array.isArray(fees) ? fees : []);
        console.log('Revenue Chart: Raw Fees Count:', feesList.length);
        if (feesList.length > 0) console.log('Revenue Chart: First Fee Example:', feesList[0]);
        
        // Group fees by payment date - use YYYY-MM format for proper sorting
        const monthlyRevenue = new Map<string, number>();
        
        // Use current date for fallback/default
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentMonthKey = `${currentYear}-${currentMonth}`;

        // Robust date and amount handling function
        const parseRobustDate = (dateStr: any): Date | null => {
          if (!dateStr) return null;
          let d = new Date(dateStr);
          if (!isNaN(d.getTime())) return d;
          
          // Try DD/MM/YYYY
          if (typeof dateStr === 'string') {
            const parts = dateStr.split(/[\/\-]/);
            if (parts.length === 3) {
              if (parts[0].length === 2 && parts[2].length === 4) {
                // Assume DD/MM/YYYY
                d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                if (!isNaN(d.getTime())) return d;
              } else if (parts[0].length === 4 && parts[2].length === 2) {
                // Assume YYYY/MM/DD
                d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                if (!isNaN(d.getTime())) return d;
              }
            }
          }
          return null;
        };

        feesList.forEach((fee: any) => {
          const paidDateValue = fee.paid_date || fee.paid_at || fee.paidDate || fee.payment_date;
          const amountValue = fee.amount;

          if (paidDateValue && amountValue !== undefined && amountValue !== null) {
            try {
              const date = parseRobustDate(paidDateValue);
              if (!date) return;
              
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const monthKey = `${year}-${month}`;
              
              // Safe amount parsing (removing commas, handling strings)
              const amount = typeof amountValue === 'string' 
                ? parseFloat(amountValue.replace(/,/g, '')) 
                : (typeof amountValue === 'number' ? amountValue : 0);

              if (!isNaN(amount) && isFinite(amount)) {
                monthlyRevenue.set(
                  monthKey,
                  (monthlyRevenue.get(monthKey) || 0) + amount
                );
              }
            } catch (e) {
              console.warn('Error processing fee:', fee, e);
            }
          }
        });

        // Ensure we show EXACTLY the last 6 months leading to now
        const finalLabels: string[] = [];
        const finalData: number[] = [];

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const year = d.getFullYear();
          const monthNum = d.getMonth() + 1;
          const monthKey = `${year}-${String(monthNum).padStart(2, '0')}`;
          
          finalLabels.push(`Tháng ${monthNum}/${year}`);
          finalData.push(monthlyRevenue.get(monthKey) || 0);
        }

        const chartData = {
          labels: finalLabels,
          datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: finalData,
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          }]
        };

        console.log('Revenue Chart: finalLabels:', finalLabels);
        console.log('Revenue Chart: finalData:', finalData);
        
        return chartData;
      })
    );
  }

  getPaymentStatusDistribution(): Observable<ChartData> {
    if (this.isTeacher()) {
      return of({
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      });
    }

    return forkJoin({
      classStudents: this.classStudentService.getAllClassStudents().pipe(catchError(err => err.status === 403 ? of([]) : throwError(() => err))),
      classes: this.classService.getClasses().pipe(catchError(err => err.status === 403 ? of([]) : throwError(() => err))),
      courses: this.coursesService.getCourses().pipe(catchError(err => err.status === 403 ? of([]) : throwError(() => err))),
      fees: this.feeService.getFeesWithDetails().pipe(catchError(err => err.status === 403 ? of([]) : throwError(() => err)))
    }).pipe(
      map(({ classStudents, classes, courses, fees }) => {
        // Handle response structure
        const classStudentsList = Array.isArray(classStudents) ? classStudents : [];
        const classesList = Array.isArray(classes) ? classes : [];
        const coursesList = Array.isArray(courses) ? courses : [];
        const feesList = Array.isArray(fees) ? fees : [];
        
        // Create a map of class_id to course data (for tuition_fee lookup)
        const classCourseMap = new Map<number, any>();
        classesList.forEach((cls: any) => {
          const course = coursesList.find((c: any) => c.id === cls.course_id);
          if (course) {
            classCourseMap.set(cls.id, {
              class: cls,
              course: course
            });
          }
        });
        
        // Create a map of (student_id, class_id) to paid amount
        const paidMap = new Map<string, number>();
        feesList.forEach((fee: any) => {
          if (fee.paid_date && fee.amount) {
            const key = `${fee.student_id}_${fee.class_id}`;
            const amount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount;
            const current = paidMap.get(key) || 0;
            paidMap.set(key, current + amount);
          }
        });
        
        // Count expected vs actual payments
        const statusCounts = {
          'Đã thanh toán': 0,
          'Quá hạn': 0,
          'Chưa thanh toán': 0,
          'Còn nợ': 0
        };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        classStudentsList.forEach((enrollment: any) => {
          const classId = enrollment.class_id;
          const studentId = enrollment.student_id;
          const classInfo = classCourseMap.get(classId);
          
          if (!classInfo) {
            return;
          }
          
          const expectedTuition = typeof classInfo.course.tuition_fee === 'string' 
            ? parseFloat(classInfo.course.tuition_fee) 
            : classInfo.course.tuition_fee;
          
          if (!expectedTuition || isNaN(expectedTuition)) {
            return;
          }
          
          const key = `${studentId}_${classId}`;
          const paidAmount = paidMap.get(key) || 0;
          
          // Determine status
          if (paidAmount >= expectedTuition) {
            statusCounts['Đã thanh toán']++;
          } else {
            // Check if payment is overdue (assuming 30 days after enrollment)
            const enrollDate = enrollment.enroll_date ? new Date(enrollment.enroll_date) : null;
            if (enrollDate) {
              enrollDate.setHours(0, 0, 0, 0);
              const daysSinceEnrollment = Math.floor((today.getTime() - enrollDate.getTime()) / (1000 * 60 * 60 * 24));
              
              // If more than 30 days since enrollment and not fully paid, mark as overdue
              if (daysSinceEnrollment > 30 && paidAmount < expectedTuition) {
                statusCounts['Quá hạn']++;
              } else if (paidAmount === 0) {
                statusCounts['Chưa thanh toán']++;
              } else {
                statusCounts['Còn nợ']++;
              }
            } else {
              // No enrollment date, check if paid or not
              if (paidAmount === 0) {
                statusCounts['Chưa thanh toán']++;
              } else {
                statusCounts['Còn nợ']++;
              }
            }
          }
        });
        
        // Filter out zero counts and create labels/values
        const labels: string[] = [];
        const values: number[] = [];
        const colors: string[] = [];
        
        Object.entries(statusCounts).forEach(([status, count]) => {
          if (count > 0) {
            labels.push(status);
            values.push(count);
            
            // Assign colors
            if (status === 'Đã thanh toán') {
              colors.push('#10B981'); // green
            } else if (status === 'Quá hạn') {
              colors.push('#EF4444'); // red
            } else if (status === 'Chưa thanh toán') {
              colors.push('#F59E0B'); // orange
            } else {
              colors.push('#6B7280'); // gray
            }
          }
        });
        
        // If no data, create default
        if (values.length === 0) {
          return {
            labels: ['Chưa có dữ liệu'],
            datasets: [{
              data: [1],
              backgroundColor: ['#E5E7EB']
            }]
          };
        }

        const chartData = {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        };
        console.log('Payment Status Distribution: Final Chart Data:', chartData);
        
        return chartData;
      })
    );
  }

  getTopCoursesByRevenue(): Observable<any[]> {
    if (this.isTeacher()) {
      return of([]);
    }
    return forkJoin({
      fees: this.feeService.getFeesWithDetails().pipe(catchError(err => err.status === 403 ? of([]) : throwError(() => err))),
      courses: this.coursesService.getCourses().pipe(catchError(err => err.status === 403 ? of([]) : throwError(() => err)))
    }).pipe(
      map(({ fees, courses }) => {
        // Handle response structure
        const feesList = Array.isArray(fees) ? fees : [];
        const coursesList = Array.isArray(courses) ? courses : [];
        
        const courseRevenue = new Map<string | number, number>();
        
        // Helper function to safely parse amount
        const parseAmount = (amount: any): number => {
          if (amount === null || amount === undefined || amount === '') {
            return 0;
          }
          const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          return typeof numAmount === 'number' && !isNaN(numAmount) && isFinite(numAmount) ? numAmount : 0;
        };
        
        // Helper function to normalize course ID for comparison
        const normalizeId = (id: any): string | number | null => {
          if (id === null || id === undefined || id === '') {
            return null;
          }
          // Convert to number if possible, otherwise keep as string
          const numId = typeof id === 'string' ? (isNaN(Number(id)) ? id : Number(id)) : id;
          return typeof numId === 'number' && !isNaN(numId) ? numId : numId;
        };
        
        feesList.forEach((fee: any) => {
          // Only count fees that have been paid
          if (fee.paid_date && fee.amount && fee.course_id) {
            const courseId = normalizeId(fee.course_id);
            if (courseId === null) {
              return; // Skip if course_id is invalid
            }
            
            const amount = parseAmount(fee.amount);
            if (amount > 0) {
              const currentRevenue = courseRevenue.get(courseId) || 0;
              courseRevenue.set(courseId, currentRevenue + amount);
            }
          }
        });

        // Convert to array and map to course names
        const topCourses = Array.from(courseRevenue.entries())
          .map(([courseId, revenue]) => {
            // Find course by matching id (handle both string and number)
            const course = coursesList.find((c: any) => {
              const cId = normalizeId(c.id);
              return cId !== null && cId === courseId;
            });
            
            return {
              course_id: courseId,
              course_name: course?.course_name || 'Không xác định',
              revenue: revenue
            };
          })
          .filter(c => c.revenue > 0) // Filter out courses with 0 revenue
          .sort((a, b) => b.revenue - a.revenue) // Sort descending by revenue
          .slice(0, 5); // Get top 5

        return topCourses;
      })
    );
  }

  getUpcomingClasses(): Observable<any[]> {
    return this.classService.getClasses().pipe(
      map(classes => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter only classes with start_date in the future
        const upcoming = (classes || [])
          .filter((cls: any) => {
            if (!cls.start_date) return false;
            const startDate = new Date(cls.start_date);
            startDate.setHours(0, 0, 0, 0);
            return startDate >= today; // Chỉ lấy classes sắp tới hoặc hôm nay
          })
          .sort((a: any, b: any) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateA - dateB;
          })
          .slice(0, 5);
        
        return upcoming;
      })
    );
  }

  private getRecentRegistrationsCount(students: any[]): number {
    if (!Array.isArray(students)) {
      return 0;
    }
    
    // Calculate students registered in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return students.filter((student: any) => {
      if (!student.created_at) return false;
      const createdDate = new Date(student.created_at);
      return createdDate >= thirtyDaysAgo;
    }).length;
  }
}

