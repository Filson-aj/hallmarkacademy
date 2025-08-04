"use server";

import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { ClassSchema, classSchema } from "../schemas";

/**
 * Standard response for actions
 */
interface ActionResponse {
    success: boolean;
    error: boolean;
    message: string;
    data?: any;
}

/**
 * Create a new Class record.
 */
export async function create(
    _prev: ActionResponse,
    payload: ClassSchema
): Promise<ActionResponse> {
    try {
        // 1) Validate payload
        const parsed = classSchema.safeParse(payload);
        if (!parsed.success) {
            return { success: false, error: true, message: "Validation failed." };
        }

        // 2) Ensure schoolid is provided and valid
        const schoolid = parsed.data.schoolid?.trim();
        if (!schoolid) {
            return {
                success: false,
                error: true,
                message: "schoolid is required.",
            };
        }
        const school = await prisma.school.findUnique({ where: { id: schoolid } });
        if (!school) {
            return {
                success: false,
                error: true,
                message: "A school with that ID does not exist.",
            };
        }

        // 3) Normalize (nullable) formmasterid and verify if present
        const formmasterid = parsed.data.formmasterid?.trim() || null;
        if (formmasterid) {
            const teacher = await prisma.teacher.findUnique({
                where: { id: formmasterid },
            });
            if (!teacher) {
                return {
                    success: false,
                    error: true,
                    message: "A teacher with that ID does not exist.",
                };
            }
        }

        // 4) Create the class
        const data = await prisma.class.create({
            data: {
                name: parsed.data.name,
                category: parsed.data.category,
                level: parsed.data.level,
                capacity: parsed.data.capacity ?? null,
                formmasterid,       // string | null
                schoolid: schoolid, // always a string
            },
        });

        revalidatePath("/classes");
        return {
            success: true,
            error: false,
            message: "Class created successfully.",
            data,
        };
    } catch (err: any) {
        // Unique-name constraint
        if (err.code === "P2002") {
            const fields = err.meta.target as string[];
            const msg = fields.includes("name")
                ? "A class with that name already exists."
                : "Unique constraint violation.";
            return { success: false, error: true, message: msg };
        }
        console.error("An error occurred creating class:", err);
        return { success: false, error: true, message: "Failed to create class." };
    }
}

/**
 * Update an existing Class record.
 */
export async function update(
    _prev: ActionResponse,
    payload: ClassSchema & { id: string }
): Promise<ActionResponse> {
    try {
        // 1) Validate payload and ensure we have an ID
        const parsed = classSchema.safeParse(payload);
        if (!parsed.success || !parsed.data.id) {
            return {
                success: false,
                error: true,
                message: "Validation failed or missing ID.",
            };
        }

        // 2) Ensure schoolid is provided and valid
        const schoolid = parsed.data.schoolid?.trim();
        if (!schoolid) {
            return {
                success: false,
                error: true,
                message: "schoolid is required.",
            };
        }
        const school = await prisma.school.findUnique({ where: { id: schoolid } });
        if (!school) {
            return {
                success: false,
                error: true,
                message: "A school with that ID does not exist.",
            };
        }

        // 3) Normalize (nullable) formmasterid and verify if present
        const formmasterid = parsed.data.formmasterid?.trim() || null;
        if (formmasterid) {
            const teacher = await prisma.teacher.findUnique({
                where: { id: formmasterid },
            });
            if (!teacher) {
                return {
                    success: false,
                    error: true,
                    message: "A teacher with that ID does not exist.",
                };
            }
        }

        // 4) Perform update
        const data = await prisma.class.update({
            where: { id: parsed.data.id },
            data: {
                name: parsed.data.name,
                category: parsed.data.category,
                level: parsed.data.level,
                capacity:
                    parsed.data.capacity !== undefined ? parsed.data.capacity : undefined,
                formmasterid,            // string | null
                schoolid: schoolid,      // always string
                updateAt: new Date(),
            },
        });

        revalidatePath("/classes");
        return {
            success: true,
            error: false,
            message: "Class updated successfully.",
            data,
        };
    } catch (err: any) {
        if (err.code === "P2002") {
            const fields = err.meta.target as string[];
            const msg = fields.includes("name")
                ? "A class with that name already exists."
                : "Unique constraint violation.";
            return { success: false, error: true, message: msg };
        }
        console.error("An error occurred updating class:", err);
        return { success: false, error: true, message: "Failed to update class." };
    }
}

/**
 * Delete one or more Class records.
 */
export async function remove(
    _prev: ActionResponse = { success: false, error: false, message: "" },
    ids: string[]
): Promise<ActionResponse> {
    try {
        const result = await prisma.class.deleteMany({
            where: { id: { in: ids } },
        });
        revalidatePath("/classes");
        return {
            success: true,
            error: false,
            message: `${result.count} class(es) deleted successfully.`,
            data: { count: result.count },
        };
    } catch (err: any) {
        console.error("An error occurred deleting class(es):", err);
        return { success: false, error: true, message: "Failed to delete class(es)." };
    }
}
