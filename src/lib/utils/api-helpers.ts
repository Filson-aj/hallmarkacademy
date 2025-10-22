import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export enum UserRole {
    SUPER = 'super',
    ADMIN = 'admin',
    MANAGEMENT = 'management',
    TEACHER = 'teacher',
    STUDENT = 'student',
    PARENT = 'parent',
}

export interface ApiResponse<T = any> {
    data?: T;
    error?: string;
    message?: string;
    total?: number;
    details?: any;
}

export async function validateSession(allowedRoles?: UserRole[]) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const userRole = (session.user.role || '').toLowerCase() as UserRole;

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return { error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
    }

    return { session, userRole };
}

export async function validateRequestBody<T>(
    request: NextRequest,
    schema: z.ZodSchema<T>
): Promise<{ data?: T; error?: NextResponse }> {
    try {
        const body = await request.json();
        const validated = schema.parse(body);
        return { data: validated };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                error: NextResponse.json(
                    { error: 'Validation failed', details: error.message },
                    { status: 400 }
                )
            };
        }
        return {
            error: NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            )
        };
    }
}

export function handleError(error: unknown, message = 'An error occurred') {
    console.error(`${message}:`, error);
    return NextResponse.json({ error: message }, { status: 500 });
}

export function successResponse<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
}

export function getQueryParams(request: NextRequest) {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    return {
        ids: searchParams.getAll('ids')
    };
}


export async function checkResourceExists(
    model: any,
    id: string,
    errorMessage = 'Resource not found'
) {
    const resource = await model.findUnique({ where: { id } });
    if (!resource) {
        return { error: NextResponse.json({ error: errorMessage }, { status: 404 }) };
    }
    return { resource };
}