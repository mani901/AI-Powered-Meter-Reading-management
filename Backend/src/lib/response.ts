export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function toPagination(input: { page?: unknown; limit?: unknown }, defaults?: { page?: number; limit?: number }) {
  const page = Math.max(1, Number(input.page ?? defaults?.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(input.limit ?? defaults?.limit ?? 20) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip } as const;
}

export function toPaginatedResponse<T>(args: { data: T[]; page: number; limit: number; total: number }): PaginatedResponse<T> {
  return {
    data: args.data,
    page: args.page,
    limit: args.limit,
    total: args.total,
    totalPages: Math.max(1, Math.ceil(args.total / args.limit)),
  };
}

