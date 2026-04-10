export type UserRole = "student" | "teacher" | "parent" | "principal" | "hod" | "staff" | "admin";
export type Gender = "male" | "female" | "other";
export type Department = "CSE" | "ECE" | "IT";

export type ParentRelation = "mother" | "father" | "guardian";

export type BatchRef = {
  _id: string;
  name: string;
  id?: string;
  adm_year?: number;
};

// ─── Unified profile shapes (mirror backend TypeScript interfaces) ─────────────

export interface StudentProfile {
  adm_number?: string;
  adm_year?: number;
  candidate_code?: string;
  department?: Department;
  date_of_birth?: string;
  batch?: BatchRef | string;
}

export interface StaffProfile {
  designation?: string;
  department?: string;
  date_of_joining?: string;
}

export interface ParentProfile {
  relation?: ParentRelation;
  child?: {
    _id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    role?: UserRole;
    profile?: StudentProfile;
  };
}

export type UserProfile = StudentProfile | StaffProfile | ParentProfile | Record<string, never>;

// ─── Unified User ─────────────────────────────────────────────────────────────
// Returned by GET /user, GET /user/:id, and GET /user/list.
// Role-specific data lives in `profile`, not at the root.

export interface User {
  /** Single consistent ID — the MongoDB User._id. */
  _id: string;

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

  /** Role-specific embedded profile */
  profile: UserProfile;
}

// GET /user returns a user payload for both 200 and 422.
// - 200: complete profile
// - 422: base fields + partial/empty profile (triggers onboarding)
export type IncompleteProfileResponse = Pick<User, "_id" | "name" | "email" | "role"> &
  Partial<Omit<User, "_id" | "name" | "email" | "role">>;

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

// ─── Write payloads ───────────────────────────────────────────────────────────
// `name` is NEVER sent — always derived from first_name + last_name on the backend.

export interface UpdateUserData {
  password?: string;
  image?: string;
  role?: UserRole;
  phone?: number;
  first_name?: string;
  last_name?: string;
  gender?: Gender;
  /** Role-specific data sent as a flat profile object */
  profile?: Partial<
    StudentProfile &
      StaffProfile & { relation?: ParentRelation; childID?: string }
  >;
}

// Request shape for POST /user/bulk — keeps flat shape (service maps to profile internally)
export interface BulkCreateUserData {
  first_name: string;
  last_name: string;
  role: UserRole;

  generate_mail?: boolean;
  email?: string;
  password?: string;

  // Student flat fields
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
}

export interface BulkCreateUsersFailure {
  email?: string;
  error?: string;
}

export interface BulkCreateUsersResponseData {
  success?: BulkCreateUsersSuccess[];
  failed?: BulkCreateUsersFailure[];
}
