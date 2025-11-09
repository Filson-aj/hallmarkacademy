import { Administration } from "@/generated/prisma";

/**
 * Generic API response wrapper
 */
interface ApiResponse<T> {
    data: T;
    error?: string;
}

/**
 * Fetch administrations (optionally filtered)
 * Supported query params: search, schoolid, role
 */
export const fetchAdmins = async (opts?: { search?: string; schoolId?: string; role?: string }) => {
    try {
        const params = new URLSearchParams();
        if (opts?.search) params.append("search", opts.search);
        if (opts?.schoolId) params.append("schoolid", opts.schoolId);
        if (opts?.role) params.append("role", opts.role);

        const url = `/api/admins${params.toString() ? `?${params.toString()}` : ""}`;

        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to fetch administrative users" }));
            throw new Error(err.error || "Failed to fetch administrative users");
        }

        const json: ApiResponse<Administration[]> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to fetch administrative users");
    }
};

/**
 * Fetch a single administration record by id
 */
export const fetchAdminById = async (id: string) => {
    if (!id) throw new Error("Administration ID is required");

    try {
        const res = await fetch(`/api/admins/${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to fetch administrator" }));
            throw new Error(err.error || "Failed to fetch administrator");
        }

        const json: ApiResponse<Administration> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to fetch administrator");
    }
};

/**
 * Fetch administrations for a specific school id
 */
export const fetchAdminsBySchoolId = async (schoolId: string) => {
    if (!schoolId) throw new Error("School ID is required");

    try {
        const res = await fetch(`/api/admins?schoolid=${encodeURIComponent(schoolId)}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to fetch administrators for school" }));
            throw new Error(err.error || "Failed to fetch administrators for school");
        }

        const json: ApiResponse<Administration[]> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to fetch administrators for school");
    }
};

/**
 * Create a new administration record
 */
export const createAdmin = async (payload: Partial<Administration>): Promise<Administration> => {
    try {
        const res = await fetch("/api/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to create administrator" }));
            throw new Error(err.error || "Failed to create administrator");
        }

        const json: ApiResponse<Administration> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to create administrator");
    }
};

/**
 * Update an existing administration record
 */
export const updateAdmin = async (id: string, data: Partial<Administration>): Promise<Administration> => {
    if (!id) throw new Error("Administration ID is required");

    try {
        const res = await fetch(`/api/admins/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to update administrator" }));
            throw new Error(err.error || "Failed to update administrator");
        }

        const json: ApiResponse<Administration> = await res.json();
        return json.data;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to update administrator");
    }
};

/**
 * Delete one or many administration records
 * Accepts ids array and optional schoolId (matching server expectations)
 */
export const deleteAdmins = async (ids: string[], schoolId?: string): Promise<void> => {
    if (!ids || ids.length === 0) throw new Error("Please select at least one administrator to delete");

    try {
        const params = new URLSearchParams();
        ids.forEach((id) => params.append("ids", id));
        if (schoolId) params.append("schoolid", schoolId);

        const res = await fetch(`/api/admins?${params.toString()}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "Failed to delete administrators" }));
            throw new Error(err.error || "Failed to delete administrators");
        }

        return;
    } catch (err: any) {
        throw new Error(err?.message ?? "Failed to delete administrators");
    }
};
