import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const studentSchema = z.object({
    username: z.string().min(1, "Username is required"),
    admissionnumber: z.string().min(1, "Admission number is required"),
    firstname: z.string().min(1, "First name is required"),
    surname: z.string().min(1, "Surname is required"),
    othername: z.string().optional(),
    birthday: z.string().datetime(),
    gender: z.enum(["MALE", "FEMALE"]),
    religion: z.string().optional(),
    studenttype: z.string().min(1, "Student type is required"),
    house: z.string().min(1, "House is required"),
    bloodgroup: z.string().min(1, "Blood group is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    state: z.string().min(1, "State is required"),
    lga: z.string().min(1, "LGA is required"),
    avarta: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    parentid: z.string().min(1, "Parent ID is required"),
    schoolid: z.string().min(1, "School ID is required"),
    classid: z.string().min(1, "Class ID is required"),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search");
        const classId = searchParams.get("classId");

        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { firstname: { contains: search, mode: "insensitive" } },
                { surname: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { admissionnumber: { contains: search, mode: "insensitive" } },
            ];
        }
        if (classId) where.classid = classId;

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                skip,
                take: limit,
                include: {
                    class: true,
                    parent: true,
                    school: true,
                },
                orderBy: { createdAt: "desc" },
            }),
            prisma.student.count({ where }),
        ]);

        return NextResponse.json({
            data: students,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        return NextResponse.json(
            { error: "Failed to fetch students" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = studentSchema.parse(body);

        const hashedPassword = validatedData.password
            ? await bcrypt.hash(validatedData.password, 12)
            : await bcrypt.hash("password", 12);

        const student = await prisma.student.create({
            data: {
                ...validatedData,
                birthday: new Date(validatedData.birthday),
                password: hashedPassword,
            },
            include: {
                class: true,
                parent: true,
                school: true,
            },
        });

        return NextResponse.json(student, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating student:", error);
        return NextResponse.json(
            { error: "Failed to create student" },
            { status: 500 }
        );
    }
}