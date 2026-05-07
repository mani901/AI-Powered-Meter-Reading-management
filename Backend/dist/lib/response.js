export function toPagination(input, defaults) {
    const page = Math.max(1, Number(input.page ?? defaults?.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(input.limit ?? defaults?.limit ?? 20) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
export function toPaginatedResponse(args) {
    return {
        data: args.data,
        page: args.page,
        limit: args.limit,
        total: args.total,
        totalPages: Math.max(1, Math.ceil(args.total / args.limit)),
    };
}
//# sourceMappingURL=response.js.map