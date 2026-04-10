/**
 * Batch API Service
 * Handles all batch-related API operations for academic management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export type Department = 'CSE' | 'ECE' | 'IT';

export interface StaffAdvisor {
  _id: string;
  first_name: string;
  last_name: string;
  name?: string;
  email: string;
  role?: string;
}

export interface Batch {
  _id: string;
  // Human-readable batch id (e.g. 24CSE)
  id?: string;
  name: string;
  adm_year: number;
  department: Department;
  staff_advisor: StaffAdvisor;
}

export interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListBatchesResponse {
  batches: Batch[];
  pagination: PaginationInfo;
}

export interface ListBatchesParams {
  page?: number;
  limit?: number;
  department?: Department;
  adm_year?: number;
}

export interface CreateBatchData {
  // Optional human-readable batch id; backend can auto-generate if omitted
  id?: string;
  name: string;
  adm_year: number;
  department: Department;
  staff_advisor: string; // Teacher ObjectId
}

export interface UpdateBatchData {
  id?: string;
  name?: string;
  adm_year?: number;
  department?: Department;
  staff_advisor?: string;
}

/**
 * List batches with pagination and filtering (staff only)
 */
export async function listBatches(params?: ListBatchesParams): Promise<ListBatchesResponse> {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.department) queryParams.append('department', params.department);
  if (params?.adm_year) queryParams.append('adm_year', params.adm_year.toString());

  const response = await fetch(`${API_BASE}/academics/batch?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch batches');
  }

  const result: ApiResponse<ListBatchesResponse> = await response.json();
  return result.data;
}

/**
 * Get a specific batch by ID
 */
export async function getBatchById(id: string): Promise<Batch> {
  const response = await fetch(`${API_BASE}/academics/batch/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch batch');
  }

  const result: ApiResponse<Batch> = await response.json();
  return result.data;
}

/**
 * Create a new batch (admin only)
 */
export async function createBatch(data: CreateBatchData): Promise<Batch> {
  const response = await fetch(`${API_BASE}/academics/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result: ApiResponse<Batch> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to create batch');
  }

  return result.data;
}

/**
 * Update a batch by ID (admin only)
 */
export async function updateBatchById(id: string, data: UpdateBatchData): Promise<Batch> {
  const response = await fetch(`${API_BASE}/academics/batch/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result: ApiResponse<Batch> = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to update batch');
  }

  return result.data;
}

/**
 * Delete a batch by ID (admin only)
 */
export async function deleteBatchById(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/academics/batch/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete batch');
  }
}
