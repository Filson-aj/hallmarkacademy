import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const studentUpdateSchema = z.object({
    username: z.string().min(1, "Username is required").optional(),
    admissionnumber: z.string().min(1, "Admission number is required").optional(),
    firstname: z.string().min(1, "First name is required").optional(),
    surname: z.string().min(1, "Surname is required").optional(),
    othername: z.string().optional(),
    birthday: z.string().datetime().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    religion: z.string().optional(),
    studenttype: z.string().min(1, "Student type is required").optional(),
    house: z.string().min(1, "House is required").optional(),
    bloodgroup: z.string().min(1, "Blood group is required").optional(),
    email: z.string().email("Valid email is required").optional(),
    phone: z.string().optional(),
    address: z.string().min(1, "Address is required").optional(),
    state: z.string().min(1, "State is required").optional(),
    lga: z.string().min(1, "LGA is required").optional(),
    avarta: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    parentid: z.string().min(1, "Parent ID is required").optional(),
    schoolid: z.string().min(1, "School ID is required").optional(),
    classid: z.string().min(1, "Class ID is required").optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const student = await prisma.student.findUnique({
            where: { id: params.id },
            include: {
                class: true,
                parent: true,
                school: true,
                attendances: true,
                assignments: true,
                submissions: true,
                answers: true,
                grades: true,
                payments: true,
            },
        });

        if (!student) {
            return NextResponse.json(
                { error: "Student not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(student);
    } catch (error) {
        console.error("Error fetching student:", error);
        return NextResponse.json(
            { error: "Failed to fetch student" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = studentUpdateSchema.parse(body);

        const updateData: any = { ...validatedData };

        if (validatedData.birthday) {
            updateData.birthday = new Date(validatedData.birthday);
        }

        if (validatedData.password) {
            updateData.password = await bcrypt.hash(validatedData.password, 12);
        }

        const student = await prisma.student.update({
            where: { id: params.id },
            data: updateData,
            include: {
                class: true,
                parent: true,
                school: true,
            },
        });

        return NextResponse.json(student);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating student:", error);
        return NextResponse.json(
            { error: "Failed to update student" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.student.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error("Error deleting student:", error);
        return NextResponse.json(
            { error: "Failed to delete student" },
            { status: 500 }
        );
    }
}