/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
    data: T;
    error?: string;
}

import { School } from '@/generated/prisma';

/**
 * Fetch all schools (filtered by user role & school association)
 */
export const fetchSchools = async () => {
    try {
        const res = await fetch('/api/schools', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch schools' }));
            throw new Error(err.error || 'Failed to fetch schools');
        }

        const json = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to fetch schools');
    }
};

/**
 * Fetch a single school by ID
 */
export const fetchSchoolById = async (id: string) => {
    if (!id) {
        throw new Error('School ID is required');
    }

    try {
        const res = await fetch(`/api/schools/${id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch school' }));
            throw new Error(err.error || 'Failed to fetch school');
        }

        const json = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to fetch school');
    }
};

/**
 * Create a new school (Super Admin only)
 */
export const createSchool = async (schoolData: Partial<School>): Promise<School> => {
    try {
        const res = await fetch('/api/schools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(schoolData),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to create school' }));
            throw new Error(err.error || 'Failed to create school');
        }

        const json: ApiResponse<School> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to create school');
    }
};

/**
 * Update an existing school
 */
export const updateSchool = async (id: string, schoolData: Partial<School>): Promise<School> => {
    try {
        const res = await fetch(`/api/schools/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(schoolData),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to update school' }));
            throw new Error(err.error || 'Failed to update school');
        }

        const json: ApiResponse<School> = await res.json();
        return json.data || json;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to update school');
    }
};

/**
 * Delete one or more schools by ID(s)
 */
export const deleteSchools = async (ids: string[]): Promise<void> => {
    if (!ids.length) {
        throw new Error('Please select school to delete!');
    }

    try {
        const params = new URLSearchParams();
        ids.forEach(id => params.append('ids', id));

        const res = await fetch(`/api/schools?${params.toString()}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to delete schools' }));
            throw new Error(err.error || 'Failed to delete schools');
        }

        // 204 No Content on success
        return;
    } catch (err: any) {
        throw new Error(err?.message ?? 'Failed to delete schools');
    }
};