import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { parentSchema } from "@/lib/schemas";

export async function GET(request: NextRequest): Promise<NextResponse> {
    // --- AUTHORIZATION ---
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- QUERY PARAMS ---
    const url = new URL(request.url);
    const getParam = (key: string) => url.searchParams.get(key)?.trim() || undefined;

    const studentId = getParam("studentId");
    const pageParam = getParam("page");
    const limitParam = getParam("limit");
    const minimal = getParam("minimal") === "true";

    const page = pageParam ? Math.max(parseInt(pageParam, 10) || 1, 1) : undefined;
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 0), 500) : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    // --- BUILD WHERE FILTER ---
    const where: Prisma.ParentWhereInput = {};

    if (studentId) {
        where.students = { some: { id: studentId } };
    }

    // --- DATA FETCH ---
    try {
        const [parents, total] = await Promise.all([
            prisma.parent.findMany({
                where,
                skip,
                take: limit,
                ...(minimal
                    ? {
                        select: {
                            id: true,
                            title: true,
                            firstname: true,
                            surname: true,
                            othername: true,
                            email: true,
                            phone: true,
                        },
                    }
                    : {
                        include: {
                            students: {
                                select: {
                                    id: true,
                                    firstname: true,
                                    othername: true,
                                    surname: true,
                                },
                            },
                        },
                    }),
                orderBy: [
                    { surname: "asc" },
                    { createdAt: "desc" },
                ],
            }),
            prisma.parent.count({ where }),
        ]);

        return NextResponse.json({ data: parents, total });
    } catch (err) {
        console.error("Error fetching parents:", err);
        return NextResponse.json(
            { error: "Failed to fetch parents" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = parentSchema.parse(body);

        if (!validated.password) {
            validated.password = "password";
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(validated.password, 12);

        const newParent = await prisma.$transaction(async (tx) => {
            return tx.parent.create({
                data: {
                    username: validated.username || validated.email,
                    title: validated.title,
                    firstname: validated.firstname,
                    surname: validated.surname,
                    othername: validated.othername || null,
                    birthday: validated.birthday ? new Date(validated.birthday) : null,
                    bloodgroup: validated.bloodgroup || null,
                    gender: validated.gender,
                    occupation: validated.occupation || null,
                    religion: validated.religion || null,
                    state: validated.state || null,
                    lga: validated.lga || null,
                    email: validated.email,
                    phone: validated.phone || null,
                    address: validated.address || null,
                    password: hashedPassword,
                    students: {
                        connect: validated.students?.map((id) => ({ id })) || [],
                    },
                },
                include: {
                    students: {
                        select: {
                            id: true,
                            firstname: true,
                            othername: true,
                            surname: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json(newParent, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating parent:", error);
        return NextResponse.json(
            { error: "Failed to create parent" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const result = await prisma.parent.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ deleted: result.count }, { status: 200 });
    } catch (error) {
        console.error("Error deleting parents:", error);
        return NextResponse.json(
            { error: "Failed to delete parents" },
            { status: 500 }
        );
    }
}
