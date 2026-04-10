/**
 * User API Service
 * Handles all user-related API operations for admin management
 */

import { getTeacherStudents } from "../dummy-data";
import { ListUsersParams, ListUsersResponse, ApiResponse, User, UpdateUserData, BulkCreateUserData, BulkCreateUsersResponseData } from "../types/UserTypes";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/**
 * List users with pagination, filtering, and search (admin only)
 * @param params - Query parameters for filtering and pagination
 */
export async function listUsers(params: ListUsersParams): Promise<ListUsersResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('role', params.role);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.batch) queryParams.append('batch', params.batch);

    const response = await fetch(`${API_BASE}/user/list?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      let message = 'Failed to fetch users';
      try {
        const error = await response.json();
        message = error.message || message;
      } catch {
        // Keep default message when error body is not JSON
      }
      throw new Error(message);
    }

    const result: ApiResponse<ListUsersResponse> = await response.json();
    return result.data;
}

/**
 * Fetch a specific user by ID
 */
export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`${API_BASE}/user/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const result: ApiResponse<User> = await response.json();
  return result.data;
}

/**
 * Update a user by ID (admin only)
 */
export async function updateUserById(id: string, data: UpdateUserData): Promise<void> {
  const response = await fetch(`${API_BASE}/user/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }
}

/**
 * Delete a user by ID (admin only)
 */
export async function deleteUserById(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/user/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete user');
  }
}

/**
 * Create multiple users in bulk (admin only)
 */
export type CreateUsersBulkResponse = ApiResponse<BulkCreateUsersResponseData> & {
  httpStatus: number;
};

export async function createUsersBulk(users: BulkCreateUserData[]): Promise<CreateUsersBulkResponse> {
  const response = await fetch(`${API_BASE}/user/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ users }),
  });

  const result = (await response.json()) as ApiResponse<BulkCreateUsersResponseData>;
  // Backend may return 422 for "completed with failures" while still providing structured results.
  if (!response.ok && response.status !== 422) {
    throw new Error(result.message || 'Failed to create users');
  }
  return { ...result, httpStatus: response.status };
}

export type { User };
