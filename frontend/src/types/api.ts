export interface ApiError {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AnimeQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'Ascending' | 'Descending';
  genres?: string[];
  years?: number[];
}
