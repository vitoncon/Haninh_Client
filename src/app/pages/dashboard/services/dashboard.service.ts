import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { StudentService } from '../../../features/students-management/services/student.service';
import { ClassService } from '../../../features/class-management/services/class.service';
import { ClassStudentService } from '../../../features/class-management/services/class-student.service';
import { CoursesService } from '../../../features/courses/services/courses.service';
import { FeeService } from '../../../features/fees/services/fee.service';
import { TeacherService } from '../../../features/teacher-management/services/teacher.service';

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
    private teacherService: TeacherService
  ) {}

  getDashboardStatistics(): Observable<DashboardStatistics> {
    return forkJoin({
      students: this.studentService.getStudents(),
      classes: this.classService.getClasses(),
      courses: this.coursesService.getCourses(),
      fees: this.feeService.getFeesWithDetails(),
      feesStats: this.feeService.getFeeStatistics()
    }).pipe(
      map(({ students, classes, courses, fees, feesStats }) => {
        const studentsList = Array.isArray(students) ? students : (students?.data || []);
        const classesList = Array.isArray(classes) ? classes : (classes || []);
        const coursesList = Array.isArray(courses) ? courses : (courses || []);
        const feesList = Array.isArray(fees) ? fees : (fees || []);
        
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
    return this.feeService.getFeesWithDetails().pipe(
      map(fees => {
        // Handle response structure
        const feesList = Array.isArray(fees) ? fees : [];
        
        // Group fees by payment date - use YYYY-MM format for proper sorting
        const monthlyRevenue = new Map<string, number>();
        
        feesList.forEach((fee: any) => {
          if (fee.paid_date && fee.amount) {
            try {
              const date = new Date(fee.paid_date);
              // Check if date is valid
              if (isNaN(date.getTime())) {
                return;
              }
              
              // Use YYYY-MM format for proper sorting
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const monthKey = `${year}-${month}`;
              
              const amount = typeof fee.amount === 'string' ? parseFloat(fee.amount) : fee.amount;
              if (!isNaN(amount) && isFinite(amount)) {
                monthlyRevenue.set(
                  monthKey,
                  (monthlyRevenue.get(monthKey) || 0) + amount
                );
              }
            } catch (e) {
              // Skip invalid entries
              console.warn('Invalid fee date or amount:', fee);
            }
          }
        });

        // If no data, create default empty chart with current month
        if (monthlyRevenue.size === 0) {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const currentMonthKey = `${year}-${month}`;
          const currentMonthLabel = `Tháng ${now.getMonth() + 1}/${year}`;
          
          return {
            labels: [currentMonthLabel],
            datasets: [{
              label: 'Doanh thu (VNĐ)',
              data: [0],
              backgroundColor: '#3B82F6',
              borderColor: '#2563EB',
              tension: 0.4,
              fill: false
            }]
          };
        }

        // Sort by date key (YYYY-MM format sorts correctly as string)
        const sortedMonthKeys = Array.from(monthlyRevenue.keys()).sort();
        
        // Get last 6 months (or all if less than 6)
        const last6Months = sortedMonthKeys.slice(-6);
        
        // Format labels for display (Tháng M/YYYY)
        const formattedLabels = last6Months.map(monthKey => {
          const [year, month] = monthKey.split('-');
          const monthNum = parseInt(month, 10);
          return `Tháng ${monthNum}/${year}`;
        });

        const chartData = {
          labels: formattedLabels.length > 0 ? formattedLabels : ['Không có dữ liệu'],
          datasets: [{
            label: 'Doanh thu (VNĐ)',
            data: last6Months.map(monthKey => monthlyRevenue.get(monthKey) || 0),
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 2,
            tension: 0.4,
            fill: false
          }]
        };
        
        return chartData;
      })
    );
  }

  getPaymentStatusDistribution(): Observable<ChartData> {
    return forkJoin({
      classStudents: this.classStudentService.getAllClassStudents(),
      classes: this.classService.getClasses(),
      courses: this.coursesService.getCourses(),
      fees: this.feeService.getFeesWithDetails()
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
        
        return chartData;
      })
    );
  }

  getTopCoursesByRevenue(): Observable<any[]> {
    return forkJoin({
      fees: this.feeService.getFeesWithDetails(),
      courses: this.coursesService.getCourses()
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

