import { Term } from "@/generated/prisma";

/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
    data: T;
    error?: string;
}

/**
 * Fetch terms (optionally filtered)
 * Supported query params: status, session, schoolId
 */
export const fetchTerms = async (opts?: { status?: string; session?: string; schoolId?: string }) => {
    try {
        const params = new URLSearchParams();
        if (opts?.status) params.append("status", opts.status);
        if (opts?.session) params.append("session", opts.session);
        if (opts?.schoolId) params.append("schoolid", opts.schoolId);

        const url = `/api/terms${params.toString() ? `?${params.toString()}` : ""}`;

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to fetch terms" }));
            throw new Error(err.error || "Failed to fetch terms");
        }

        const json: ApiResponse<Term[]> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to fetch terms");
    }
};

/**
 * Fetch a single term by id
 */
export const fetchTermById = async (id: string) => {
    if (!id) throw new Error("Term ID is required");

    try {
        const res = await fetch(`/api/terms/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to fetch term" }));
            throw new Error(err.error || "Failed to fetch term");
        }

        const json: ApiResponse<Term> = await res.json();
        return json.data || json;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to fetch term");
    }
};

/**
 * Fetch terms for a specific school id
 */
export const fetchTermsBySchoolId = async (schoolId: string) => {
    if (!schoolId) throw new Error("School ID is required");

    try {
        const res = await fetch(`/api/terms?schoolid=${encodeURIComponent(schoolId)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to fetch terms for school" }));
            throw new Error(err.error || "Failed to fetch terms for school");
        }

        const json: ApiResponse<Term[]> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to fetch terms for school");
    }
};

/**
 * Create a new term
 */
export const createTerm = async (payload: Partial<Term>): Promise<Term> => {
    try {
        const res = await fetch("/api/terms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to create term" }));
            throw new Error(err.error || "Failed to create term");
        }

        const json: ApiResponse<Term> = await res.json();
        return json.data || json;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to create term");
    }
};

/**
 * Update an existing term
 */
export const updateTerm = async (id: string, data: Partial<Term>): Promise<Term> => {
    if (!id) throw new Error("Term ID is required");

    try {
        const res = await fetch(`/api/terms/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to update term" }));
            throw new Error(err.error || "Failed to update term");
        }

        const json: ApiResponse<Term> = await res.json();
        return json.data || json;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to update term");
    }
};

/**
 * Delete one or many terms
 * Accepts ids array and optional schoolId to scope deletions
 */
export const deleteTerms = async (ids: string[], schoolId?: string): Promise<void> => {
    if (!ids || ids.length === 0) throw new Error("Please select at least one term to delete");

    try {
        const params = new URLSearchParams();
        ids.forEach((id) => params.append("ids", id));
        if (schoolId) params.append("schoolid", schoolId);

        const res = await fetch(`/api/terms?${params.toString()}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to delete terms" }));
            throw new Error(err.error || "Failed to delete terms");
        }

        return;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to delete terms");
    }
};
