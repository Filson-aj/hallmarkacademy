import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const classUpdateSchema = z.object({
  name: z.string().min(1, "Class name is required").optional(),
  category: z.string().min(1, "Category is required").optional(),
  level: z.string().min(1, "Level is required").optional(),
  capacity: z.number().int().min(1).optional(),
  formmasterid: z.string().optional(),
});

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
          select: {
            id: true,
            firstname: true,
            surname: true,
            title: true,
          }
        },
        students: {
          select: {
            id: true,
            firstname: true,
            surname: true,
            admissionnumber: true,
          }
        },
        lessons: {
          include: {
            subject: {
              select: {
                name: true,
              }
            },
            teacher: {
              select: {
                firstname: true,
                surname: true,
                title: true,
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            lessons: true,
          }
        }
      }
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
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
    const validatedData = classUpdateSchema.parse(body);

    // Verify form master exists if provided
    if (validatedData.formmasterid) {
      const formmaster = await prisma.teacher.findUnique({
        where: { id: validatedData.formmasterid }
      });
      if (!formmaster) {
        return NextResponse.json(
          { error: "Form master not found" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.category) updateData.category = validatedData.category;
    if (validatedData.level) updateData.level = validatedData.level;
    if (validatedData.capacity) updateData.capacity = validatedData.capacity;
    if (validatedData.formmasterid !== undefined) {
      updateData.formmasterid = validatedData.formmasterid || null;
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        formmaster: {
          select: {
            id: true,
            firstname: true,
            surname: true,
            title: true,
          }
        },
        _count: {
          select: {
            students: true,
            lessons: true,
          }
        }
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
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
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
    
    // Check if class has students
    const studentsCount = await prisma.student.count({
      where: { classid: id }
    });

    if (studentsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete class with enrolled students" },
        { status: 400 }
      );
    }

    await prisma.class.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}