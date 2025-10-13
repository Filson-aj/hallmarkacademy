"use server";

import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { termSchema, TermSchema } from "../schemas";

/**
 * Action response type
 */
interface ActionResponse {
    success: boolean;
    error: boolean;
    message: string;
    data?: any;
}

/**
 * Create a new Term record.
 * Accepts a plain object matching TermSchema.
 */
export async function create(
    _prev: ActionResponse,
    payload: TermSchema
): Promise<ActionResponse> {
    try {
        // Validate with Zod
        const parsed = termSchema.safeParse(payload);
        if (!parsed.success) {
            return {
                success: false,
                error: true,
                message: "Validation failed.",
            };
        }

        // Compute daysopen
        const { start, end } = parsed.data;
        const diffMs = end.getTime() - start.getTime();
        const daysopen = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // Create record
        const data = await prisma.term.create({
            data: {
                session: parsed.data.session,
                term: parsed.data.term,
                start: parsed.data.start,
                end: parsed.data.end,
                nextTerm: parsed.data.nextterm,
                daysOpen: daysopen,
                status: 'Inactive',
                schoolId: parsed.data.schoolId,
            },
        });

        revalidatePath("/terms");
        return {
            success: true,
            error: false,
            message: "Term record created successfully.",
            data,
        };
    } catch (err: any) {
        return {
            success: false,
            error: true,
            message: "Failed to create term record.",
        };
    }
}

/**
 * Update an existing Term record.
 */
export async function update(
    _prev: ActionResponse,
    payload: TermSchema
): Promise<ActionResponse> {
    try {
        const parsed = termSchema.safeParse(payload);
        if (!parsed.success) {
            return {
                success: false,
                error: true,
                message: "Validation failed.",
            };
        }

        // Compute daysopen
        const { start, end } = parsed.data;
        const diffMs = end.getTime() - start.getTime();
        const daysopen = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        const data = await prisma.term.update({
            where: { id: parsed.data.id! },
            data: {
                session: parsed.data.session,
                term: parsed.data.term,
                start: parsed.data.start,
                end: parsed.data.end,
                nextTerm: parsed.data.nextterm,
                daysOpen: daysopen,
                status: parsed.data.status,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/terms");
        return {
            success: true,
            error: false,
            message: "Term record updated successfully.",
            data,
        };
    } catch (err: any) {
        return {
            success: false,
            error: true,
            message: "Failed to update term record.",
        };
    }
}

/**
 * Delete one or multiple Term records.
 */
export async function remove(
    _prev: ActionResponse = { success: false, error: false, message: "" },
    ids: string[]
): Promise<ActionResponse> {
    try {
        const result = await prisma.term.deleteMany({
            where: { id: { in: ids } },
        });
        revalidatePath("/terms");
        return {
            success: true,
            error: false,
            message: `${result.count} term(s) deleted successfully.`,
            data: { count: result.count },
        };
    } catch (err: any) {
        return {
            success: false,
            error: true,
            message: "Failed to delete term record(s).",
        };
    }
}
