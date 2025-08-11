import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { administrationSchema } from "@/lib/schemas";
import { getUserSchoolId } from "@/lib/utils";

enum UserRole {
    SUPER = "super",
    ADMIN = "admin",
    MANAGEMENT = "management",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent",
}

interface ListResponse {
    data: any[];
    total: number;
    message?: string;
}
const emptyList = (message = "No records found"): ListResponse => ({ data: [], total: 0, message });

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user.role || "").toLowerCase() as UserRole;

        // Allowed viewer roles
        const allowedViewRoles = [UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN];

        // If role is not allowed to view, return empty list (per request pattern)
        if (!allowedViewRoles.includes(role)) {
            return NextResponse.json(emptyList());
        }

        const url = new URL(request.url);
        const search = url.searchParams.get("search")?.trim() || undefined;

        // Resolve user's school association
        const userSchoolIdRaw = await getUserSchoolId(session);
        const userSchoolId =
            typeof userSchoolIdRaw === "string" ? userSchoolIdRaw : Array.isArray(userSchoolIdRaw) ? userSchoolIdRaw : undefined;

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        // Non-super users must be scoped to their school(s). If no association -> return empty list
        if (role !== UserRole.SUPER) {
            if (!userSchoolId || (Array.isArray(userSchoolId) && userSchoolId.length === 0)) {
                return NextResponse.json(emptyList());
            }

            // userSchoolId may be a string or an array of strings
            where.schoolid = Array.isArray(userSchoolId) ? { in: userSchoolId } : userSchoolId;
        }

        const admins = await prisma.administration.findMany({
            where,
            include: {
                school: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ data: admins, total: admins.length });
    } catch (error) {
        console.error("Error fetching administrations:", error);
        return NextResponse.json({ error: "Failed to fetch administrations" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user.role || "").toLowerCase() as UserRole;

        // Only super and management can create
        if (![UserRole.SUPER, UserRole.MANAGEMENT].includes(role)) {
            return NextResponse.json({
                error: "Access denied - only super admins and management can create administration records",
            }, { status: 403 });
        }

        const body = await request.json();
        const validated = administrationSchema.parse(body);

        // Resolve user's school association
        const userSchoolIdRaw = await getUserSchoolId(session);
        const userSchoolId =
            typeof userSchoolIdRaw === "string" ? userSchoolIdRaw : Array.isArray(userSchoolIdRaw) ? userSchoolIdRaw : undefined;

        // Normalize validated.schoolid if not provided for non-super
        if (role !== UserRole.SUPER) {
            if (!userSchoolId || (Array.isArray(userSchoolId) && userSchoolId.length === 0)) {
                return NextResponse.json({ error: "Access denied - no school association found" }, { status: 403 });
            }

            // If userSchoolId is array, ensure the validated.schoolid is one of them (or set default)
            if (Array.isArray(userSchoolId)) {
                if (!validated.schoolid) {
                    validated.schoolid = userSchoolId[0];
                } else if (!userSchoolId.includes(validated.schoolid)) {
                    return NextResponse.json({
                        error: "Access denied - you can only create administration records for your associated schools",
                    }, { status: 403 });
                }
            } else {
                // userSchoolId is a single string
                validated.schoolid = userSchoolId;
            }
        } else {
            // SUPER: ensure a schoolid can be provided or left null (super can create global admin)
            validated.schoolid = validated.schoolid || undefined;
        }

        // If the role being created is not 'super', ensure the target school exists
        if (validated.role && (validated.role as string).toLowerCase() !== "super") {
            if (!validated.schoolid) {
                return NextResponse.json({ error: "School ID is required for non-super administration records" }, { status: 400 });
            }
            const school = await prisma.school.findUnique({ where: { id: validated.schoolid } });
            if (!school) {
                return NextResponse.json({ error: "School not found" }, { status: 404 });
            }
        }

        // Unique checks
        const conflict = await prisma.administration.findFirst({
            where: {
                OR: [
                    { username: validated.username },
                    { email: validated.email },
                ],
            },
        });
        if (conflict) {
            return NextResponse.json({ error: "Username or email already in use" }, { status: 409 });
        }

        // Hash password (if provided)
        const hashed = validated.password ? await bcrypt.hash(validated.password, 12) : null;

        const newAdmin = await prisma.administration.create({
            data: {
                username: validated.username,
                email: validated.email,
                password: hashed,
                role: validated.role,
                schoolid: validated.schoolid || null,
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                schoolid: true,
                school: {
                    select: { id: true, name: true },
                },
                createdAt: true,
                updateAt: true,
            },
        });

        return NextResponse.json(newAdmin, { status: 201 });
    } catch (error) {
        console.error("Error creating administration:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create administration" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const role = (session.user.role || "").toLowerCase() as UserRole;

        // Only super and management can delete
        if (![UserRole.SUPER, UserRole.MANAGEMENT].includes(role)) {
            return NextResponse.json({
                error: "Access denied - only super admins and management can delete administration records",
            }, { status: 403 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        // Resolve user's school association for non-super
        let allowedIds = ids;
        if (role !== UserRole.SUPER) {
            const userSchoolIdRaw = await getUserSchoolId(session);
            const userSchoolId =
                typeof userSchoolIdRaw === "string" ? userSchoolIdRaw : Array.isArray(userSchoolIdRaw) ? userSchoolIdRaw : undefined;
            if (!userSchoolId || (Array.isArray(userSchoolId) && userSchoolId.length === 0)) {
                return NextResponse.json({ error: "Access denied - no school association found" }, { status: 403 });
            }

            // Get administration records that belong to user's school(s)
            const userAdmins = await prisma.administration.findMany({
                where: {
                    id: { in: ids },
                    schoolid: Array.isArray(userSchoolId) ? { in: userSchoolId } : userSchoolId,
                },
                select: { id: true },
            });

            allowedIds = userAdmins.map((a) => a.id);

            if (allowedIds.length === 0) {
                return NextResponse.json({
                    error: "Access denied - you can only delete administration records from your school",
                }, { status: 403 });
            }
        }

        // Prevent users from deleting themselves
        const filteredIds = allowedIds.filter((id) => id !== session.user.id);
        if (filteredIds.length !== allowedIds.length) {
            console.warn(`User ${session.user.id} attempted to delete their own record`);
        }

        if (filteredIds.length === 0) {
            return NextResponse.json({
                error: "Cannot delete your own administration record or no valid records found",
            }, { status: 400 });
        }

        const result = await prisma.administration.deleteMany({
            where: { id: { in: filteredIds } },
        });

        return NextResponse.json({
            deleted: result.count,
            message: `Successfully deleted ${result.count} administration record(s)`,
        });
    } catch (error) {
        console.error("Error deleting administrations:", error);
        return NextResponse.json({ error: "Failed to delete administrations" }, { status: 500 });
    }
}
