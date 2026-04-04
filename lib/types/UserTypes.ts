export type UserRole = "student" | "teacher" | "parent" | "principal" | "hod" | "staff" | "admin";
export type Gender = "male" | "female" | "other";
export type Department = "CSE" | "ECE" | "IT";

export type ParentRelation = "mother" | "father" | "guardian";

export type BatchRef = {
  _id: string;
  name: string;
  year?: number;
  adm_year?: number;
};

// Flattened user profile returned by GET /user and GET /user/:id
export interface User {
  id: {
    record : string;
    user : string;
  }

  // Base user fields (flattened at root)
  name: string;
  email: string;
  role: UserRole;

  first_name?: string;
  last_name?: string;
  phone?: number;
  gender?: Gender;
  image?: string;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;

  // Student-specific fields (role === 'student')
  adm_number?: string;
  adm_year?: number;
  candidate_code?: string;
  department?: Department;
  date_of_birth?: string;
  // GET endpoints may populate full object; 422 may contain a batch id string
  batch?: BatchRef | string;

  // Teacher/staff-specific fields
  designation?: string;
  date_of_joining?: string;

  // Parent-specific fields
  relation?: ParentRelation;
  child?: {
    _id?: string;
    adm_number?: string;
    adm_year?: number;
    candidate_code?: string;
    user?: {
      name?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

export interface IncompleteProfileResponse {
  user: Pick<User, "id" | "name" | "email" | "role">;
  profile: Record<string, unknown>;
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
    batch?: string;
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
    relation?: ParentRelation;
    childID?: string;
  };
}

// Request shape for POST /user/bulk
export interface BulkCreateUserData {
  first_name: string;
  last_name: string;
  role: UserRole;

  // When true, backend may generate Google Workspace email.
  // If true, omit the `email` key entirely in request payload.
  generate_mail?: boolean;

  // Required only when generate_mail is false/absent.
  email?: string;
  password?: string;

  adm_number?: string;
  adm_year?: number;
  candidate_code?: string;
  department?: Department;
  date_of_birth?: string;
  batch?: string;
}

export interface BulkCreateUsersSuccess {
  email: string;
  role?: UserRole;
  userId?: string;
  studentCreated?: boolean;
}

export interface BulkCreateUsersFailure {
  email?: string;
  error?: string;
}

export interface BulkCreateUsersResponseData {
  success?: BulkCreateUsersSuccess[];
  failed?: BulkCreateUsersFailure[];
}