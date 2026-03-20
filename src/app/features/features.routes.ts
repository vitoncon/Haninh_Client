import { Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/permission.guard';
import { roleGuard } from '../core/guards/role.guard';
import { PermissionService } from '../core/services/permission.service';
import { Courses } from './courses/components/courses';
import { Class } from './class-management/components/class/class';
import { ClassDetail } from './class-management/components/class-detail/class-detail';
import { CourseDetail } from './courses/components/course-detail/course-detail';
import { TeacherDetail } from './teacher-management/components/teacher-detail/teacher-detail';
import { StudentDetail } from './students-management/components/student-detail/student-detail';
import { Schedule } from './schedule/components/schedule/schedule';
import { Students } from './students-management/components/students/students';
import { StudyResults } from './study-results/components/study-results/study-results';
import { ClassStudyResults } from './class-management/components/class-study-results/class-study-results/class-study-results';
import { ExamDetail } from './class-management/components/class-study-results/exam-detail/exam-detail';
import { ClassSchedule } from './class-management/components/class-schedule/class-schedule';
import { Certificates } from './certificates/components/certificates/certificates';
import { Teacher } from './teacher-management/components/teacher/teacher';
import { TeachingAssignments } from './teaching-assignments/components/teaching-assignments/teaching-assignments';
import { Fees } from './fees/components/fees/fees';
import { FeesDetail } from './fees/components/fees-detail/fees-detail';
import { StudentFees } from './fees/components/student-fees/student-fees';
import { StudentCourses } from './fees/components/student-courses/student-courses';
import { Users } from './user-management/components/users/users';
import { StudentImportComponent } from './students-management/components/student-import/student-import';
import { AttendanceComponent } from './attendance/components/attendance/attendance';
import { AttendanceAnalyticsComponent } from './attendance/components/attendance-analytics/attendance-analytics';
import { LeadsComponent } from './leads/components/leads/leads';

export default [   
    // quan ly khoa hoc
    { 
        path: 'courses', 
        data: { breadcrumb: 'Quản lý khóa học' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.COURSES_VIEW])], 
        component: Courses
    },
    { 
        path: 'courses/detail/:id', 
        data: { breadcrumb: 'Chi tiết khóa học' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.COURSES_VIEW])], 
        component: CourseDetail 
    },
    { 
        path: 'courses/student',
        data: { breadcrumb: 'Danh sách khóa học', roles: [3] }, 
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.COURSES_VIEW])], 
        component: StudentCourses 
    },
    { 
        path: 'class', 
        data: { breadcrumb: 'Quản lý lớp học' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.CLASS_VIEW])], 
        component: Class 
    },
    { 
        path: 'class/detail/:id', 
        data: { breadcrumb: 'Chi tiết lớp học' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.CLASS_VIEW])], 
        component: ClassDetail 
    },
    { 
        path: 'class/:id/study-results', 
        data: { breadcrumb: 'Kết quả học tập lớp', roles: [1, 2] }, 
        // Both admin (1) and teacher (2) can view class study results; backend scopes data by teacher classes
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW])], 
        component: ClassStudyResults 
    },
    { 
        path: 'class/:id/study-result/:examId', 
        data: { breadcrumb: 'Chi tiết bài kiểm tra', roles: [1, 2] }, 
        // Both admin and teacher can view exam details; backend enforces per-class/per-student scoping
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW])], 
        component: ExamDetail 
    },
    { 
        path: 'class/:id/schedule', 
        data: { breadcrumb: 'Lịch học lớp' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.CLASS_VIEW])], 
        component: ClassSchedule 
    },
    { 
        path: 'schedule', 
        data: { 
            breadcrumb: 'Lịch học',
            // Admin, Giáo viên, Học viên đều có thể xem lịch (quyền chi tiết đã được BE/permissions kiểm soát)
            roles: [1, 2, 3]
        }, 
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.SCHEDULE_VIEW])], 
        component: Schedule 
    },
    // Route riêng cho lịch dạy của giáo viên
    { 
        path: 'my-schedule', 
        data: { breadcrumb: 'Lịch dạy của tôi', roles: [2] }, 
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.SCHEDULE_VIEW])], 
        component: Schedule 
    },
    // Backward/legacy: giữ route cũ để tránh 404, trỏ về cùng component
    { 
        path: 'teacher-schedule', 
        data: { breadcrumb: 'Lịch dạy của tôi', roles: [2] }, 
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.SCHEDULE_VIEW])], 
        component: Schedule 
    },
    // quan ly hoc vien
    { 
        path: 'students', 
        data: { breadcrumb: 'Quản lý học viên' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.STUDENTS_VIEW])], 
        component: Students 
    },
    { 
        path: 'students/detail/:id', 
        data: { breadcrumb: 'Chi tiết học viên' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.STUDENTS_VIEW])], 
        component: StudentDetail 
    },
    { 
        path: 'students/import', 
        data: { breadcrumb: 'Nhập học viên từ Excel' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.STUDENTS_VIEW])], 
        component: StudentImportComponent 
    },
    { 
        path: 'attendance', 
        data: { breadcrumb: 'Điểm danh' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.ATTENDANCE_VIEW])], 
        component: AttendanceComponent 
    },
    { 
        path: 'attendance/analytics', 
        data: { breadcrumb: 'Thống kê điểm danh' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.ATTENDANCE_VIEW])], 
        component: AttendanceAnalyticsComponent 
    },
    { 
        path: 'study-results', 
        data: { 
            breadcrumb: 'Kết quả học tập', 
            // Admin, Giáo viên và Học viên đều được truy cập (dữ liệu học viên đã được backend scope theo student_id)
            roles: [1, 2, 3] 
        }, 
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW])], 
        component: StudyResults 
    },
    { 
        path: 'certificates', 
        data: { breadcrumb: 'Chứng chỉ' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.CERTIFICATES_VIEW])], 
        component: Certificates 
    },
    // quan ly giang vien
    { 
        path: 'teacher', 
        data: { breadcrumb: 'Quản lý giảng viên' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.TEACHER_VIEW])], 
        component: Teacher 
    },
    { 
        path: 'teacher/detail/:id', 
        data: { breadcrumb: 'Chi tiết giảng viên' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.TEACHER_VIEW])], 
        component: TeacherDetail 
    },
    { 
        path: 'teaching-assignments', 
        data: { breadcrumb: 'Phân công giảng dạy' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.TEACHING_ASSIGNMENTS_VIEW])], 
        component: TeachingAssignments 
    },
    // quan ly tai chinh
    { 
        path: 'fees', 
        data: { breadcrumb: 'Quản lý học phí' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.FEES_VIEW])], 
        component: Fees 
    },
    { 
        path: 'fees/detail/:id',
        data: { breadcrumb: 'Chi tiết học phí' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.FEES_VIEW])], 
        component: FeesDetail 
    },
    { 
        path: 'fees/student',
        data: { breadcrumb: 'Học phí của tôi', roles: [3] }, 
        canActivate: [roleGuard, permissionGuard([PermissionService.PERMISSIONS.FEES_VIEW])], 
        component: StudentFees 
    },
    // quan ly tai khoan
    { 
        path: 'users', 
        data: { breadcrumb: 'Quản lý tài khoản' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.USERS_VIEW])], 
        component: Users 
    },
    // quan ly khach hang tiem nang
    { 
        path: 'leads', 
        data: { breadcrumb: 'Khách hàng tiềm năng' }, 
        // using USERS_VIEW permission temporarily since they are admins, 
        // ideally create LEADS_VIEW in PermissionService
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.LEADS_VIEW])], 
        component: LeadsComponent 
    },
    // default route
    { path: '**', redirectTo: '/notfound' },
] as Routes;
