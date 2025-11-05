import { Routes } from '@angular/router';
import { permissionGuard } from '../core/guards/permission.guard';
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
        data: { breadcrumb: 'Kết quả học tập lớp' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.CLASS_VIEW])], 
        component: ClassStudyResults 
    },
    { 
        path: 'class/:id/study-result/:examId', 
        data: { breadcrumb: 'Chi tiết bài kiểm tra' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.CLASS_VIEW])], 
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
        data: { breadcrumb: 'Lịch học' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.SCHEDULE_VIEW])], 
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
        path: 'study-results', 
        data: { breadcrumb: 'Kết quả học tập' }, 
        canActivate: [permissionGuard([PermissionService.PERMISSIONS.STUDY_RESULTS_VIEW])], 
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
    // default route
    { path: '**', redirectTo: '/notfound' },
] as Routes;
