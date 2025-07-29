import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const studentId = searchParams.get("studentId");
        const classId = searchParams.get("classId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const skip = (page - 1) * limit;

        // Build where clause with the exact Prisma field names
        const where: any = {};

        if (from) {
            where.date = { ...where.date, gte: new Date(from) };
        }
        if (to) {
            where.date = { ...where.date, lte: new Date(to) };
        }
        if (studentId) {
            where.studentid = studentId;
        }
        if (classId) {
            where.student = { classid: classId };
        }

        // Role‐based filtering
        switch (session.user.role) {
            case "student":
                where.studentid = session.user.id;
                break;
            case "parent":
                where.student = { parentid: session.user.id };
                break;
        }

        const [attendance, total] = await Promise.all([
            prisma.attendance.findMany({
                where,
                skip,
                take: limit,
                include: {
                    student: {
                        select: {
                            id: true,
                            firstname: true,
                            surname: true,
                            admissionnumber: true,
                            class: {
                                select: { name: true },
                            },
                        },
                    },
                },
                orderBy: { date: "desc" },
            }),
            prisma.attendance.count({ where }),
        ]);

        return NextResponse.json({
            data: attendance,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return NextResponse.json(
            { error: "Failed to fetch attendance data" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session ||
            !["admin", "super", "management", "teacher"].includes(
                session.user.role
            )
        ) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { studentId, schoolId, date, present } = body;

        if (
            !studentId ||
            !schoolId ||
            !date ||
            typeof present !== "boolean"
        ) {
            return NextResponse.json(
                { error: "Missing required fields: studentId, schoolId, date, present" },
                { status: 400 }
            );
        }

        // See if an attendance record already exists for that student+school+date
        const existing = await prisma.attendance.findFirst({
            where: {
                studentid: studentId,
                schoolid: schoolId,
                date: new Date(date),
            },
        });

        if (existing) {
            // Update only the 'present' flag
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: { present },
                include: {
                    student: {
                        select: {
                            firstname: true,
                            surname: true,
                            admissionnumber: true,
                        },
                    },
                },
            });
            return NextResponse.json(updated);
        } else {
            // Create a brand‐new attendance record
            const created = await prisma.attendance.create({
                data: {
                    studentid: studentId,
                    schoolid: schoolId,
                    date: new Date(date),
                    present,
                },
                include: {
                    student: {
                        select: {
                            firstname: true,
                            surname: true,
                            admissionnumber: true,
                        },
                    },
                },
            });
            return NextResponse.json(created, { status: 201 });
        }
    } catch (error) {
        console.error("Error creating/updating attendance:", error);
        return NextResponse.json(
            { error: "Failed to record attendance" },
            { status: 500 }
        );
    }
}
