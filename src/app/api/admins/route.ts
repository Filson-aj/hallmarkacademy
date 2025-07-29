import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { administrationSchema } from "@/lib/schemas";
import { getUserSchoolId } from "@/lib/utils";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow management, admin, and super roles to view administration records
        if (!["super", "management", "admin"].includes(session.user.role.toLowerCase())) {
            return NextResponse.json({
                error: "Access denied - insufficient permissions"
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");

        const userSchoolId = await getUserSchoolId(session);

        // Build the where clause based on user role
        const where: Record<string, any> = {};

        if (search) {
            where.OR = [
                { username: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({
                    error: "Access denied - no school association found"
                }, { status: 403 });
            }
            where.schoolid = userSchoolId;
        }

        const admins = await prisma.administration.findMany({
            where,
            include: {
                school: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
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
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow management and super roles to create administration records
        if (!["super", "management"].includes(session.user.role.toLowerCase())) {
            return NextResponse.json({
                error: "Access denied - only super admins and management can create administration records"
            }, { status: 403 });
        }

        const body = await request.json();
        const validated = administrationSchema.parse(body);

        const userSchoolId = await getUserSchoolId(session);

        if (typeof userSchoolId === "string") {
            validated.schoolid = userSchoolId;
        } else if (Array.isArray(userSchoolId) && userSchoolId.length > 0) {
            validated.schoolid = userSchoolId[0];
        }

        // Validate school access for non-super users
        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({
                    error: "Access denied - no school association found"
                }, { status: 403 });
            }

            // Check if user can create admins for the specified school
            if (Array.isArray(userSchoolId)) {
                if (typeof validated.schoolid === "string" && !userSchoolId.includes(validated.schoolid)) {
                    return NextResponse.json({
                        error: "Access denied - you can only create administration records for your associated schools"
                    }, { status: 403 });
                }
            } else {
                if (userSchoolId !== validated.schoolid) {
                    return NextResponse.json({
                        error: "Access denied - you can only create administration records for your school"
                    }, { status: 403 });
                }
            }
        }

        // Verify the school exists
        const school = await prisma.school.findUnique({
            where: { id: validated.schoolid },
            select: { id: true }
        });

        if (!school && validated.role.toLowerCase() !== 'super') {
            return NextResponse.json({
                error: "School not found"
            }, { status: 404 });
        }

        // Check uniqueness
        const conflict = await prisma.administration.findFirst({
            where: {
                OR: [
                    { username: validated.username },
                    { email: validated.email }
                ]
            }
        });
        if (conflict) {
            return NextResponse.json(
                { error: "Username or email already in use" },
                { status: 409 }
            );
        }

        // Hash password
        const hashed = validated.password
            ? await bcrypt.hash(validated.password, 12)
            : null;

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
                    select: {
                        id: true,
                        name: true
                    }
                },
                createdAt: true,
                updateAt: true,
            }
        });

        return NextResponse.json(newAdmin, { status: 201 });
    } catch (error) {
        console.error("Error creating administration:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: "Validation failed",
                details: error.errors
            }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create administration" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only allow management and super roles to delete administration records
        if (!["super", "management"].includes(session.user.role.toLowerCase())) {
            return NextResponse.json({
                error: "Access denied - only super admins and management can delete administration records"
            }, { status: 403 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const userSchoolId = await getUserSchoolId(session);

        // Filter IDs based on user role and permissions
        let allowedIds = ids;

        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({
                    error: "Access denied - no school association found"
                }, { status: 403 });
            }

            // Get administration records that belong to user's school(s)
            const userAdmins = await prisma.administration.findMany({
                where: {
                    id: { in: ids },
                    schoolid: Array.isArray(userSchoolId)
                        ? { in: userSchoolId }
                        : userSchoolId
                },
                select: { id: true }
            });

            allowedIds = userAdmins.map(admin => admin.id);

            if (allowedIds.length === 0) {
                return NextResponse.json({
                    error: "Access denied - you can only delete administration records from your school"
                }, { status: 403 });
            }
        }

        // Prevent users from deleting themselves
        const filteredIds = allowedIds.filter(id => id !== session.user.id);

        if (filteredIds.length !== allowedIds.length) {
            console.warn(`User ${session.user.id} attempted to delete their own record`);
        }

        if (filteredIds.length === 0) {
            return NextResponse.json({
                error: "Cannot delete your own administration record or no valid records found"
            }, { status: 400 });
        }

        const result = await prisma.administration.deleteMany({
            where: { id: { in: filteredIds } }
        });

        return NextResponse.json({
            deleted: result.count,
            message: `Successfully deleted ${result.count} administration record(s)`
        });
    } catch (error) {
        console.error("Error deleting administrations:", error);
        return NextResponse.json({ error: "Failed to delete administrations" }, { status: 500 });
    }
}