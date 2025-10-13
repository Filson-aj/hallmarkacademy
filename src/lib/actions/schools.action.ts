"use server";

import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { SchoolSchema, schoolSchema } from "../schemas";

/**
 * Create a new School record.
 * Signature: (prevMessage, formData) => Promise<string>
 */
interface ActionResponse {
    success: boolean;
    error: boolean;
    message: string;
    data?: any;
}

export async function create(
    _prev: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    try {
        type RawPayload = Omit<SchoolSchema, "regnumbercount"> & {
            regnumbercount: string | number;
        };

        // Read everything in as strings or numbers
        const payload = Object.fromEntries(formData) as RawPayload;
        payload.regnumbercount = typeof payload.regnumbercount === "string"
            ? parseInt(payload.regnumbercount, 10)
            : payload.regnumbercount;

        // Validate with Zod
        const parsed = schoolSchema.safeParse(payload);
        if (!parsed.success) {
            /*  console.error("Validation errors:", parsed.error.format()); */
            return {
                success: false,
                error: true,
                message: "Validation failed.",
            };
        }

        // Try to create the record
        const data = await prisma.school.create({
            data: {
                name: parsed.data.name,
                subtitle: parsed.data.subtitle ?? null,
                schooltype: parsed.data.schooltype,
                email: parsed.data.email,
                phone: parsed.data.phone ?? null,
                address: parsed.data.address,
                logo: parsed.data.logo ?? null,
                contactperson: parsed.data.contactperson ?? null,
                contactpersonphone: parsed.data.contactpersonphone ?? null,
                contactpersonemail: parsed.data.contactpersonemail ?? null,
                youtube: parsed.data.youtube ?? null,
                facebook: parsed.data.facebook ?? null,
                regnumbercount: parsed.data.regnumbercount ?? 0,
                regnumberprepend: parsed.data.regnumberprepend ?? null,
                regnumberappend: parsed.data.regnumberappend ?? null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        revalidatePath("/list/schools");
        return {
            success: true,
            error: false,
            message: "School record created successfully.",
            data,
        };

    } catch (err: any) {
        // Handle unique constraint violations
        if (err.code === "P2002") {
            const fields = err.meta.target as string[];
            let message = "Unique constraint violation.";
            if (fields.includes("name")) {
                message = "A school with that name already exists.";
            } else if (fields.includes("email")) {
                message = "Email address is already in use.";
            } else if (fields.includes("phone")) {
                message = "Phone number is already in use.";
            }
            return {
                success: false,
                error: true,
                message,
            };
        }

        /*  console.error("Error creating school:", err); */
        return {
            success: false,
            error: true,
            message: "Failed to create school deta.",
        };
    }
}

/**
 * Update an existing School record.
 * Signature: (_prev: ActionResponse, formData: FormData) => Promise<ActionResponse>
 */
export async function update(
    _prev: ActionResponse,
    formData: FormData
): Promise<ActionResponse> {
    try {

        type RawPayload = Omit<SchoolSchema, "regnumbercount"> & {
            regnumbercount: string | number;
        };

        // Read everything in as strings or numbers
        const payload = Object.fromEntries(formData) as RawPayload;
        payload.regnumbercount = typeof payload.regnumbercount === "string"
            ? parseInt(payload.regnumbercount, 10)
            : payload.regnumbercount;

        const parsed = schoolSchema
            .safeParse(payload);
        if (!parsed.success) {
            console.error("Validation errors:", parsed.error.format());
            return {
                success: false,
                error: true,
                message: "Validation faileds.",
            };
        }

        // Perform update
        const data = await prisma.school.update({
            where: { id: parsed.data.id },
            data: {
                name: parsed.data.name,
                subtitle: parsed.data.subtitle ?? null,
                schooltype: parsed.data.schooltype,
                email: parsed.data.email,
                phone: parsed.data.phone ?? null,
                address: parsed.data.address,
                logo: parsed.data.logo ?? null,
                contactperson: parsed.data.contactperson ?? null,
                contactpersonphone: parsed.data.contactpersonphone ?? null,
                contactpersonemail: parsed.data.contactpersonemail ?? null,
                youtube: parsed.data.youtube ?? null,
                facebook: parsed.data.facebook ?? null,
                regnumbercount: parsed.data.regnumbercount ?? undefined,
                regnumberprepend: parsed.data.regnumberprepend ?? null,
                regnumberappend: parsed.data.regnumberappend ?? null,
                updatedAt: new Date(),
            },
        });

        revalidatePath("/list/schools");
        return {
            success: true,
            error: false,
            message: "School record updated successfully.",
            data,
        };
    } catch (err: any) {
        // Handle unique constraint violations
        if (err.code === "P2002") {
            const fields = err.meta.target as string[];
            let message = "Unique constraint violation.";
            if (fields.includes("name")) {
                message = "A school with that name already exists.";
            } else if (fields.includes("email")) {
                message = "Email address is already in use.";
            } else if (fields.includes("phone")) {
                message = "Phone number is already in use.";
            }
            return {
                success: false,
                error: true,
                message,
            };
        }

        /* console.error("Error updating school:", err); */
        return {
            success: false,
            error: true,
            message: "Failed to update school record.",
        };
    }
}

/**
 * Handld single and bulk deletion of records.
 * Signature: (_prev: ActionResponse, formData: FormData) => Promise<ActionResponse>
 */
export async function remove(
    _prev: ActionResponse = { success: false, error: false, message: "" },
    formData: FormData
): Promise<ActionResponse> {
    try {
        const ids = formData.getAll("ids") as string[];
        const result = await prisma.school.deleteMany({ where: { id: { in: ids } } });
        revalidatePath("/list/schools");
        return {
            success: true,
            error: false,
            message: `${result.count} school(s) deleted successfully.`,
            data: { count: result.count },
        };
    } catch (err: any) {
        /*  console.error("Error deleting schools:", err); */
        return {
            success: false,
            error: true,
            message: "Failed to delete school records.",
        };
    }
}
