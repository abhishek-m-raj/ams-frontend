
export type UserRole = 'student' | 'teacher' | 'parent' | 'principal' | 'hod' | 'staff' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type Department = 'CSE' | 'ECE' | 'IT';

export interface User {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    first_name: string;
    last_name: string;
    role: UserRole;
    phone?: number;
    gender?: Gender;
    image?: string;
    createdAt: string;
    updatedAt: string;
  };
  // Student-specific fields
  adm_number?: string;
  adm_year?: number;
  candidate_code?: string;
  department?: Department;
  date_of_birth?: string;
  batch?: {
    _id: string;
    name: string;
    year: number;
  };
  // Teacher-specific fields
  designation?: string;
  date_of_joining?: string;
  // Parent-specific fields
  relation?: 'mother' | 'father' | 'guardian';
  child?: {
    _id: string;
    adm_number: string;
    candidate_code?: string;
    user: {
      name: string;
      first_name: string;
      last_name: string;
    };
  };
}

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListUsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

export interface ListUsersParams {
  role: UserRole;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UpdateUserData {
  name?: string;
  password?: string;
  image?: string;
  role?: UserRole;
  phone?: number;
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  student?: {
    adm_number?: string;
    adm_year?: number;
    candidate_code?: string;
    department?: Department;
    date_of_birth?: string;
  };
  teacher?: {
    designation?: string;
    department?: string;
    date_of_joining?: string;
  };
  parent?: {
    relation?: 'mother' | 'father' | 'guardian';
    childID?: string;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  role?: UserRole;
  password?: string;
}
