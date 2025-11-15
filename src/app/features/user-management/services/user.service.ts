import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, switchMap, of, forkJoin, map } from 'rxjs';
import { UserModel, UserFilters, RoleModel } from '../models/users.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:10093/api/users';
  private rolesApiUrl = 'http://localhost:10093/api/roles';

  constructor(private http: HttpClient) {}

  /** Lấy header có token xác thực */
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      })
    };
  }

  /** API: Lấy danh sách users với roles */
  getUsers(filters?: UserFilters): Observable<any> {
    // Lấy users, user_roles, và roles song song
    const users$ = this.http.get<any>(this.apiUrl, this.getAuthHeaders());
    
    // Build condition with proper format for backend API - lấy user_roles chưa xóa
    const userRolesConditions = [
      { key: 'is_deleted', value: '0', compare: '=', orWhere: 'and' }
    ];
    const userRolesConditionJson = encodeURIComponent(JSON.stringify(userRolesConditions));
    const userRoles$ = this.http.get<any>(`http://localhost:10093/api/user_roles?condition=${userRolesConditionJson}`, this.getAuthHeaders());
    
    const roles$ = this.http.get<any>(this.rolesApiUrl, this.getAuthHeaders());

    return forkJoin({
      users: users$,
      userRoles: userRoles$,
      roles: roles$
    }).pipe(
      map(({ users, userRoles, roles }) => {
        const usersData = users?.data ?? users ?? [];
        const userRolesData = userRoles?.data ?? userRoles ?? [];
        const rolesData = roles?.data ?? roles ?? [];

        // Map users với roles
        const usersWithRoles = Array.isArray(usersData) ? usersData.map((user: any) => {
          // Tìm user_role của user này
          const userRole = Array.isArray(userRolesData) 
            ? userRolesData.find((ur: any) => ur.user_id === user.id && ur.is_deleted === 0)
            : null;
          
          // Tìm role name từ role_id
          if (userRole) {
            const role = Array.isArray(rolesData) 
              ? rolesData.find((r: any) => r.id === userRole.role_id)
              : null;
            
            if (role) {
              user.role_id = role.id;
              user.role_name = role.name;
            }
          }

          return user;
        }) : [];

        return {
          code: 'success',
          message: 'Request success!',
          data: usersWithRoles
        };
      }),
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy thông tin chi tiết user theo ID */
  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy profile user hiện tại (dựa trên token) */
  getProfile(): Observable<any> {
    const url = 'http://localhost:10093/api/profile';
    return this.http.get<any>(url, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error (profile):', error);
        throw error;
      })
    );
  }

  /** API: Thêm mới user */
  addUser(user: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, user, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }

  /** API: Cập nhật thông tin user */
  updateUser(id: number, user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, user, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }

  /** API: Xóa user */
  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }

  /** API: Lấy danh sách roles */
  getRoles(): Observable<any> {
    return this.http.get<any>(this.rolesApiUrl, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }

  /** API: Gán role cho user - sử dụng user_roles table */
  assignRole(userId: number, roleId: number): Observable<any> {
    const userRolesUrl = 'http://localhost:10093/api/user_roles';
    
    // Build condition with proper format for backend API
    const conditions = [
      { key: 'user_id', value: userId.toString(), compare: '=', orWhere: 'and' },
      { key: 'is_deleted', value: '0', compare: '=', orWhere: 'and' }
    ];
    const conditionJson = encodeURIComponent(JSON.stringify(conditions));
    
    // Kiểm tra xem user đã có role chưa
    return this.http.get<any>(`${userRolesUrl}?condition=${conditionJson}`, this.getAuthHeaders()).pipe(
      switchMap((response) => {
        const existingRoles = response?.data ?? response;
        const userRoleArray = Array.isArray(existingRoles) ? existingRoles : (existingRoles ? [existingRoles] : []);
        
        if (userRoleArray.length > 0) {
          // Đã có role, update role_id của record đầu tiên
          const userRoleId = userRoleArray[0].id;
          return this.http.put<any>(`${userRolesUrl}/${userRoleId}`, { 
            id: userRoleId,
            user_id: userId, 
            role_id: roleId 
          }, this.getAuthHeaders());
        } else {
          // Chưa có role, tạo mới
          return this.http.post<any>(userRolesUrl, { user_id: userId, role_id: roleId }, this.getAuthHeaders());
        }
      }),
      catchError((error) => {
        // Nếu get lỗi (có thể do chưa có record), thử tạo mới
        if (error.status === 404 || error.status === 0) {
          return this.http.post<any>(userRolesUrl, { user_id: userId, role_id: roleId }, this.getAuthHeaders());
        }
        throw error;
      })
    );
  }

  /** API: Xóa role của user */
  removeRole(userId: number, roleId: number): Observable<any> {
    // Tìm user_role record và xóa
    const userRolesUrl = 'http://localhost:10093/api/user_roles';
    // Cần tìm id của user_role record trước
    return this.http.get<any>(`${userRolesUrl}?user_id=${userId}&role_id=${roleId}`, this.getAuthHeaders()).pipe(
      catchError((error) => {
        console.error('UserService Error:', error);
        throw error;
      })
    );
  }
}

