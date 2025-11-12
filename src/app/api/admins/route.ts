import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { administrationSchema } from "@/lib/schemas/index";
import {
    validateSession,
    validateRequestBody,
    handleError,
    successResponse,
    UserRole,
} from "@/lib/utils/api-helpers";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma";

/**
 * GET - list administrations
 *
 * Query params:
 *  - search (optional): search string for username/email
 *  - schoolid (optional/required depending on requester role)
 *  - role (optional): role filter
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Validate session & allowed roles (SUPER, MANAGEMENT, ADMIN can view)
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole } = validation;
        const url = new URL(request.url);
        const search = url.searchParams.get("search")?.trim() || undefined;
        const schoolId = url.searchParams.get("schoolid")?.trim() || undefined;
        const roleFilter = url.searchParams.get("role")?.trim()?.toLowerCase() || undefined;

        // Build where clause gradually
        const where: Prisma.AdministrationWhereInput = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (userRole === UserRole.SUPER) {
            if (schoolId) where.schoolId = schoolId;
            if (roleFilter) where.role = roleFilter as any;
        } else if (userRole === UserRole.MANAGEMENT) {
            if (!schoolId) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }
            where.schoolId = schoolId;
            // exclude supers
            where.NOT = { role: "Super" };
        } else if (userRole === UserRole.ADMIN) {
            if (!schoolId) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }
            where.schoolId = schoolId;
            where.role = "Admin";
        }

        const administrators = await prisma.administration.findMany({
            where,
            include: {
                school: { select: { id: true, name: true } },
                _count: { select: { notifications: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse({ data: administrators, total: administrators.length });
    } catch (error) {
        return handleError(error, "Failed to fetch administrators");
    }
}

/**
 * POST - create administration
 *
 * Allowed: SUPER, MANAGEMENT, ADMIN
 * - MANAGEMENT cannot create SUPER and must provide schoolid in body
 * - ADMIN cannot create SUPER or MANAGEMENT and must provide schoolid in body
 * - SUPER may create with or without schoolid
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole } = validation;

        const bodyValidation = await validateRequestBody(request, administrationSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const validated = bodyValidation.data!;

        // MANAGEMENT cannot create super
        if (userRole === UserRole.MANAGEMENT && String(validated.role).toLowerCase() === "super") {
            return NextResponse.json({ error: "Access denied - You are not allowed to performed this action" }, { status: 403 });
        }
        if (userRole === UserRole.ADMIN && ["super", "management"].includes(String(validated.role).toLowerCase())) {
            return NextResponse.json({ error: "Access denied - You are not allowed to performed this action" }, { status: 403 });
        }

        // MANAGEMENT must provide schoolId in body
        if (userRole === UserRole.MANAGEMENT || userRole === UserRole.ADMIN) {
            if (!validated.schoolId) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }
        }

        // For non-super administration records, ensure school exists
        if (String(validated.role).toLowerCase() !== "super") {
            if (!validated.schoolId) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }
            const school = await prisma.school.findUnique({ where: { id: validated.schoolId } });
            if (!school) {
                return NextResponse.json({ error: "School not found" }, { status: 404 });
            }
        }

        // Unique checks (username/email)
        const conflict = await prisma.administration.findFirst({
            where: {
                OR: [
                    ...(validated.username ? [{ username: validated.username }] : []),
                    ...(validated.email ? [{ email: validated.email }] : []),
                ],
            },
        });
        if (conflict) {
            return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
        }

        // Hash password if provided
        const hashedPassword = validated.password ? await bcrypt.hash(validated.password, 12) : null;

        const created = await prisma.administration.create({
            data: {
                username: validated.username,
                email: validated.email,
                password: hashedPassword,
                role: validated.role,
                active: validated.active ?? true,
                schoolId: validated.schoolId ?? null,
                avatar: (validated as any).avatar ?? (validated as any).avarta ?? null,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                active: true,
                avatar: true,
                schoolId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return successResponse(created, 201);
    } catch (error) {
        return handleError(error, "Failed to create administrator.");
    }
}

/**
 * DELETE - delete one or many administration records
 *
 * Query param:
 *  - ids (multiple allowed) e.g. ?ids=aaa&ids=bbb
 *  - schoolid (required for MANAGEMENT and ADMIN)
 *
 * Rules:
 *  - SUPER can delete any (except we still prevent self-deletion)
 *  - MANAGEMENT can delete only records within provided schoolid and cannot delete super
 * - ADMIN can delete only ADMIN records within provided schoolid and cannot delete super or management
 *  - Prevent deleting current user
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const validation = await validateSession([UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN]);
        if (validation.error) return validation.error;

        const { userRole, session } = validation;
        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        const schoolId = url.searchParams.get("schoolid")?.trim() || undefined;

        if (!ids || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        let safeIds = ids;

        if (userRole === UserRole.MANAGEMENT) {
            // MANAGEMENT must pass schoolId to scope deletions
            if (!schoolId) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }

            // Find administration records belonging to that school and in ids, excluding super
            const candidates = await prisma.administration.findMany({
                where: {
                    id: { in: ids },
                    schoolId,
                    NOT: { role: "Super" },
                },
                select: { id: true },
            });

            safeIds = candidates.map((c) => c.id);

            if (safeIds.length === 0) {
                return NextResponse.json({ error: "Access denied - no record found" }, { status: 403 });
            }
        } else if (userRole === UserRole.ADMIN) {
            // ADMIN: must pass schoolId and can only delete their own records
            if (!schoolId) {
                return NextResponse.json({ error: "No school specified" }, { status: 400 });
            }

            const candidates = await prisma.administration.findMany({
                where: {
                    id: { in: ids },
                    schoolId,
                    role: "Admin",
                },
                select: { id: true },
            });

            safeIds = candidates.map((c) => c.id);

            if (safeIds.length === 0) {
                return NextResponse.json({ error: "Access denied - no record found" }, { status: 403 });
            }
        } else {
            // SUPER: safeIds remain the requested ids
            safeIds = ids;
        }

        // Prevent deleting self
        const currentUserId = session!.user.id;
        const filteredIds = safeIds.filter((id) => id !== currentUserId);

        if (filteredIds.length === 0) {
            return NextResponse.json({ error: "Invalid operation - you are not allowed to perform this action!" }, { status: 400 });
        }

        const result = await prisma.administration.deleteMany({
            where: { id: { in: filteredIds } },
        });

        return successResponse({
            deleted: result.count,
            message: `Successfully deleted ${result.count} administrative user(s).`,
        });
    } catch (error) {
        return handleError(error, "Failed to delete administrative users.");
    }
}
