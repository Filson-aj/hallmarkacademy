import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import {
    validateSession,
    validateRequestBody,
    handleError,
    successResponse,
    UserRole,
} from "@/lib/utils/api-helpers";

const termUpdateSchema = z.object({
    session: z.string().min(1, "Session is required").optional(),
    term: z.enum(["First", "Second", "Third"]).optional(),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    nextterm: z.string().datetime().optional(),
    daysopen: z.number().int().min(1).optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const { id } = await params;

        // Fetch term first
        const term = await prisma.term.findUnique({ where: { id } });
        if (!term) {
            return NextResponse.json({ error: "Term not found" }, { status: 404 });
        }

        if (userRole !== UserRole.SUPER) {
            const userSchoolId = (session.user as any).schoolId;
            if (!userSchoolId || term.schoolId !== userSchoolId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        return successResponse(term);
    } catch (error) {
        return handleError(error, "Failed to fetch term");
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const { id } = await params;

        // Validate body using helper
        const bodyValidation = await validateRequestBody(request, termUpdateSchema);
        if (bodyValidation.error) return bodyValidation.error;
        const validated = bodyValidation.data!;

        // Ensure term exists
        const existing = await prisma.term.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Term not found" }, { status: 404 });
        }

        // Authorization: non-SUPER users may only update terms for their school
        if (userRole !== UserRole.SUPER) {
            const userSchoolId = (session.user as any).schoolId;
            if (!userSchoolId || existing.schoolId !== userSchoolId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        // Build update payload
        const updateData: Prisma.TermUpdateInput = {};
        if (validated.session !== undefined) updateData.session = validated.session;
        if (validated.term !== undefined) updateData.term = validated.term;
        if (validated.start !== undefined) updateData.start = new Date(validated.start);
        if (validated.end !== undefined) updateData.end = new Date(validated.end);
        if (validated.nextterm !== undefined) updateData.nextTerm = new Date(validated.nextterm);
        if (validated.daysopen !== undefined) updateData.daysOpen = validated.daysopen;
        if (validated.status !== undefined) updateData.status = validated.status as any;

        // Transaction: if activating this term, deactivate other Active terms for same school; then update
        const result = await prisma.$transaction(async (tx) => {
            if (validated.status === "Active") {
                await tx.term.updateMany({
                    where: {
                        id: { not: id },
                        schoolId: existing.schoolId ?? null,
                        status: "Active",
                    } as Prisma.TermWhereInput,
                    data: { status: "Inactive" },
                });
            }

            const updated = await tx.term.update({
                where: { id },
                data: updateData,
            });

            return updated;
        });

        return successResponse(result);
    } catch (error) {
        return handleError(error, "Failed to update term");
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const { id } = await params;

        // Fetch the term first
        const termToDelete = await prisma.term.findUnique({ where: { id } });
        if (!termToDelete) {
            return NextResponse.json({ error: "Term not found" }, { status: 404 });
        }

        // Authorization: non-SUPER users may only delete terms for their school
        if (userRole !== UserRole.SUPER) {
            const userSchoolId = (session.user as any).schoolId;
            if (!userSchoolId || termToDelete.schoolId !== userSchoolId) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        // Delete in a transaction and if active, reactivate newest remaining term for same school
        const result = await prisma.$transaction(async (tx) => {
            await tx.term.delete({ where: { id } });

            if (termToDelete.status === "Active") {
                const newest = await tx.term.findFirst({
                    where: { schoolId: termToDelete.schoolId ?? undefined },
                    orderBy: { createdAt: "desc" },
                });
                if (newest) {
                    await tx.term.update({
                        where: { id: newest.id },
                        data: { status: "Active" },
                    });
                }
            }

            return { message: "Term deleted successfully" };
        });

        return successResponse(result);
    } catch (error) {
        return handleError(error, "Failed to delete term");
    }
}
