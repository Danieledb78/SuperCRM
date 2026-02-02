import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Helper function to handle Prisma errors
export function handlePrismaError(error: any): { status: number; message: string } {
  if (error.code === 'P2002') {
    return { status: 409, message: 'Un record con questi dati esiste già' };
  }
  if (error.code === 'P2025') {
    return { status: 404, message: 'Record non trovato' };
  }
  if (error.code === 'P2003') {
    return { status: 400, message: 'Riferimento non valido' };
  }
  return { status: 500, message: 'Errore interno del server' };
}

// Pagination helper
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export function getPaginationParams(params: PaginationParams): { skip: number; take: number } {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
  return {
    data,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export default prisma;
