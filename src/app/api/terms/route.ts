import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { termSchema } from "@/lib/schemas";
import { z } from "zod";
import { Prisma } from "@/generated/prisma";
import {
    validateSession,
    validateRequestBody,
    handleError,
    successResponse,
    UserRole,
} from "@/lib/utils/api-helpers";

/**
 * GET - list terms
 *
 * Query params:
 *  - status (optional)
 *  - session (optional)
 *  - schoolid (optional for SUPER, required for MANAGEMENT/ADMIN)
 *
 * Rules:
 *  - SUPER: may view all terms; may optionally pass schoolid to filter
 *  - MANAGEMENT / ADMIN: must pass schoolid and will only view terms for that school
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole } = validation;
        const url = new URL(request.url);
        const status = url.searchParams.get("status")?.trim() || undefined;
        const sessionParam = url.searchParams.get("session")?.trim() || undefined;
        const schoolIdParam = url.searchParams.get("schoolid")?.trim() || undefined;
        const pageParam = url.searchParams.get("page");
        const limitParam = url.searchParams.get("limit");
        const minimal = url.searchParams.get("minimal") === "true";

        const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : undefined;
        const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 0), 500) : undefined;
        const skip = page && limit ? (page - 1) * limit : undefined;

        // Build where clause
        const where: Prisma.TermWhereInput = {};

        if (status) where.status = status as "Inactive" || "Active";
        if (sessionParam) where.session = sessionParam;

        if (userRole === UserRole.SUPER) {
            if (schoolIdParam) where.schoolId = schoolIdParam;
        } else {
            if (!schoolIdParam) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }
            where.schoolId = schoolIdParam;
        }

        const [terms, total] = await Promise.all([
            prisma.term.findMany({
                where,
                skip,
                take: limit,
                ...(minimal
                    ? {
                        select: {
                            id: true,
                            session: true,
                            term: true,
                            status: true,
                            start: true,
                            end: true,
                            schoolId: true,
                        },
                    }
                    : {}),
                orderBy: [
                    { status: "asc" },
                    { createdAt: "desc" },
                ],
            }),
            prisma.term.count({ where }),
        ]);

        return successResponse({ data: terms, total });
    } catch (error) {
        return handleError(error, "Failed to fetch terms");
    }
}

/**
 * POST - create term
 *
 * Allowed: SUPER, MANAGEMENT, ADMIN
 * - MANAGEMENT/ADMIN must supply schoolId in body
 * - Creating a new Active term will set existing Active terms (for same school) to Inactive
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole } = validation;

        // Validate body using existing helper (zod schema)
        const bodyValidation = await validateRequestBody(request, termSchema);
        if (bodyValidation.error) return bodyValidation.error;
        const validated = bodyValidation.data!;

        // MANAGEMENT / ADMIN must provide schoolId
        if ((userRole === UserRole.MANAGEMENT || userRole === UserRole.ADMIN) && !validated.schoolId) {
            return NextResponse.json({ error: "No school specified" }, { status: 400 });
        }

        // Calculate daysOpen if not provided
        const startDate = new Date(validated.start);
        const endDate = new Date(validated.end);
        const daysOpen = validated.daysopen ?? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Use a transaction: set existing Active terms for that school to Inactive, then create the new term
        const created = await prisma.$transaction(async (tx) => {
            // If the new term is Active (or default to Active), make sure we scope updates to the same school
            const schoolId = validated.schoolId ?? null;

            // Deactivate existing active terms for this school
            await tx.term.updateMany({
                where: {
                    status: "Active",
                    schoolId: schoolId,
                },
                data: { status: "Inactive" },
            });

            // Create new term (we store nextTerm as a Date if provided)
            const newTerm = await tx.term.create({
                data: {
                    session: validated.session,
                    term: validated.term,
                    start: startDate,
                    end: endDate,
                    nextTerm: validated.nextterm ? new Date(validated.nextterm) : "",
                    daysOpen,
                    status: validated.status ?? "Active",
                    schoolId: validated.schoolId ?? null,
                },
            });

            return newTerm;
        });

        return successResponse(created, 201);
    } catch (error) {
        return handleError(error, "Failed to create term.");
    }
}

/**
 * DELETE - delete one or many terms
 *
 * Query params:
 *  - ids (multiple allowed) e.g. ?ids=aaa&ids=bbb
 *  - schoolid (required for MANAGEMENT and ADMIN)
 *
 * Behavior:
 *  - SUPER can delete any term(s)
 *  - MANAGEMENT/ADMIN can only delete terms for the provided schoolid
 *  - After deletion, if an Active term was removed for a school, the newest remaining term for that school is set Active
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole } = validation;
        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        const schoolIdParam = url.searchParams.get("schoolid")?.trim() || undefined;

        if (!ids || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        let safeIds = ids;

        if (userRole === UserRole.MANAGEMENT || userRole === UserRole.ADMIN) {
            // Must provide schoolid to scope deletions
            if (!schoolIdParam) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }

            // Find terms in that school only
            const candidates = await prisma.term.findMany({
                where: {
                    id: { in: ids },
                    schoolId: schoolIdParam,
                },
                select: { id: true, status: true, schoolId: true },
            });

            safeIds = candidates.map((c) => c.id);

            if (safeIds.length === 0) {
                return NextResponse.json({ error: "Access denied - no record found" }, { status: 403 });
            }
        } else {
            // SUPER: safeIds unchanged
            safeIds = ids;
        }

        // Perform deletion transactionally and handle re-activations per affected school
        const result = await prisma.$transaction(async (tx) => {
            // Fetch terms to be deleted (including status & schoolId)
            const toDelete = await tx.term.findMany({
                where: { id: { in: safeIds } },
                select: { id: true, status: true, schoolId: true },
            });

            if (toDelete.length === 0) {
                throw new Error("No matching terms found");
            }

            // Build a map of affected schoolIds -> whether an Active term was deleted
            const affectedSchools = new Map<string | null, { hadActiveDeleted: boolean; deletedIds: string[] }>();

            for (const t of toDelete) {
                const key = t.schoolId ?? null;
                if (!affectedSchools.has(key)) {
                    affectedSchools.set(key, { hadActiveDeleted: false, deletedIds: [] });
                }
                const entry = affectedSchools.get(key)!;
                entry.deletedIds.push(t.id);
                if (t.status === "Active") entry.hadActiveDeleted = true;
            }

            // Delete the terms
            const deleteResult = await tx.term.deleteMany({
                where: { id: { in: safeIds } },
            });

            // For each affected school where an Active term was deleted, reactivate newest remaining term (if any)
            for (const [schoolKey, meta] of affectedSchools.entries()) {
                if (!meta.hadActiveDeleted) continue;

                // Find newest remaining term in that school (or globally if schoolKey is null)
                const newest = await tx.term.findFirst({
                    where: { schoolId: schoolKey ?? undefined },
                    orderBy: { createdAt: "desc" },
                });

                if (newest) {
                    await tx.term.update({
                        where: { id: newest.id },
                        data: { status: "Active" },
                    });
                }
            }

            return {
                deleted: deleteResult.count,
                message: `Successfully deleted ${deleteResult.count} term(s).`,
            };
        });

        return successResponse(result);
    } catch (error) {
        return handleError(error, "Failed to delete terms");
    }
}
