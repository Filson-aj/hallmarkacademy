import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { classSchema } from "@/lib/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        formmaster: {
          select: { id: true, title: true, firstname: true, surname: true, othername: true }
        },
        students: {
          select: { id: true, firstname: true, surname: true, admissionNumber: true }
        },
        lessons: {
          include: {
            subject: { select: { name: true } },
            teacher: { select: { title: true, firstname: true, surname: true } }
          }
        },
        _count: { select: { students: true, lessons: true } }
      }
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(classData);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super", "management"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = classSchema.parse(body);

    // Duplicate check: name + category must be unique
    const conflict = await prisma.class.findFirst({
      where: {
        name: validated.name,
        category: validated.category,
        id: { not: id },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Another class with that name and category already exists" },
        { status: 409 }
      );
    }

    // Verify form master exists if provided
    if (validated.formmasterid) {
      const fm = await prisma.teacher.findUnique({ where: { id: validated.formmasterid } });
      if (!fm) {
        return NextResponse.json({ error: "Form master not found" }, { status: 400 });
      }
    }

    // Build update payload
    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.level !== undefined) updateData.level = validated.level;
    if (validated.capacity !== undefined) updateData.capacity = validated.capacity;
    if (validated.formmasterid !== undefined) {
      updateData.formmasterid = validated.formmasterid || null;
    }

    // Perform update
    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        formmaster: {
          select: { id: true, title: true, firstname: true, surname: true, othername: true }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        },
        _count: { select: { students: true, lessons: true } }
      }
    });

    return NextResponse.json(updatedClass);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super", "management"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Prevent deletion if students exist
    const studentCount = await prisma.student.count({ where: { classId: id } });
    if (studentCount > 0) {
      return NextResponse.json({ error: "Cannot delete class with enrolled students" }, { status: 400 });
    }

    await prisma.class.delete({ where: { id } });
    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
