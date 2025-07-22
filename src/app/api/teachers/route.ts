import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { teacherSchema } from "@/lib/schemas";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const teachers = await prisma.teacher.findMany({
            include: {
                subjects: true,
                school: true
            }
        });

        return NextResponse.json(teachers);
    } catch (error) {
        console.log("An error occured:", error);
        return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = teacherSchema.parse(body);

        if (!validatedData.password) {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(validatedData.password, 12);

        const teacher = await prisma.teacher.create({
            data: {
                username: validatedData.email,
                title: validatedData.title,
                firstname: validatedData.firstname,
                surname: validatedData.surname,
                othername: validatedData.othername || null,
                birthday: validatedData.birthday,
                bloodgroup: validatedData.bloodgroup,
                gender: validatedData.sex,
                state: validatedData.state,
                lga: validatedData.lga,
                email: validatedData.email,
                phone: validatedData.phone || null,
                address: validatedData.address,
                avarta: validatedData.avarta || null,
                password: hashedPassword,
                schoolid: validatedData.schoolid,
                subjects: {
                    connect: validatedData.subjects?.map((id) => ({ id })) || []
                }
            }
        });

        return NextResponse.json(teacher, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
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

        await prisma.teacher.deleteMany({
            where: { id: { in: ids } }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete teachers" }, { status: 500 });
    }
}