export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";
import { deleteFromDropbox } from "@/lib/files.util";
import { getUserSchoolId } from "@/lib/server/getUserSchoolId";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userSchoolId = await getUserSchoolId(session);

        // Build the where clause based on user role
        let whereClause = {};

        if (session.user.role.toLowerCase() !== 'super') {
            if (!userSchoolId) {
                return NextResponse.json({ error: "Access denied - no school association found" }, { status: 403 });
            }

            // For parents who might have children in multiple schools
            if (Array.isArray(userSchoolId)) {
                whereClause = {
                    id: { in: userSchoolId }
                };
            } else {
                whereClause = {
                    id: userSchoolId
                };
            }
        }

        const schools = await prisma.school.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                        subjects: true,
                        paymentsetups: true,
                        payments: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ data: schools, total: schools.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Only super admins can create new schools
        if (!session || session.user.role.toLowerCase() !== 'super') {
            return NextResponse.json({
                error: "Unauthorized - Only super administrators can create schools"
            }, { status: 401 });
        }

        // Expect JSON with logo URL instead of multipart
        const body = await request.json();
        const validated = schoolSchema.parse(body);

        const school = await prisma.school.create({
            data: {
                name: validated.name,
                subtitle: validated.subtitle || null,
                schooltype: validated.schooltype,
                email: validated.email,
                phone: validated.phone || null,
                address: validated.address,
                logo: validated.logo,  // URL from client/upload
                contactperson: validated.contactperson || null,
                contactpersonphone: validated.contactpersonphone || null,
                contactpersonemail: validated.contactpersonemail || null,
                youtube: validated.youtube || null,
                facebook: validated.facebook || null,
                regnumbercount: validated.regnumbercount,
                regnumberprepend: validated.regnumberprepend || null,
                regnumberappend: validated.regnumberappend || null,
            }
        });

        return NextResponse.json(school, { status: 201 });
    } catch (err: any) {
        console.error("Error creating school:", err);
        if (err.name === 'ZodError') {
            return NextResponse.json({ error: err.errors.map((e: any) => e.message).join(', ') }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (ids.length === 0 || ids.some(id => !id)) {
            return NextResponse.json({ error: "Valid school ID(s) are required" }, { status: 400 });
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

            // For non-super roles, only allow deletion of their own school
            if (Array.isArray(userSchoolId)) {
                // For parents - can only delete schools their children attend
                allowedIds = ids.filter(id => userSchoolId.includes(id));
            } else {
                // For other roles - can only delete their own school
                allowedIds = ids.filter(id => id === userSchoolId);
            }

            if (allowedIds.length === 0) {
                return NextResponse.json({
                    error: "Access denied - you can only delete your own school"
                }, { status: 403 });
            }

            // For management and admin roles, they probably shouldn't delete their own school
            // This is a business logic decision - you might want to prevent this entirely
            if (['management', 'admin'].includes(session.user.role.toLowerCase())) {
                return NextResponse.json({
                    error: "Access denied - school administrators cannot delete their school"
                }, { status: 403 });
            }
        }

        // fetch logo URLs for each record
        const schools = await prisma.school.findMany({
            where: { id: { in: allowedIds } },
            select: { logo: true }
        });

        // delete each file from Dropbox
        await Promise.all(
            schools.map(async ({ logo }) => {
                if (logo) {
                    try {
                        await deleteFromDropbox(logo);
                    } catch (error) {
                        console.warn(`Could not delete Dropbox file ${logo}:`, error);
                    }
                }
            })
        );

        // bulk delete DB records
        await prisma.school.deleteMany({
            where: { id: { in: allowedIds } }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting schools:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
