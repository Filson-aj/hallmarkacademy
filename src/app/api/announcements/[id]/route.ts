import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const announcementUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    date: z.string().datetime().optional(),
    classId: z.string().optional(),
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

        const announcement = await prisma.announcement.findUnique({
            where: { id: parseInt(id) },
            include: {
                class: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!announcement) {
            return NextResponse.json(
                { error: "Announcement not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(announcement);
    } catch (error) {
        console.error("Error fetching announcement:", error);
        return NextResponse.json(
            { error: "Failed to fetch announcement" },
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
        if (!session || !["admin", "super", "management", "teacher"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = announcementUpdateSchema.parse(body);

        const updateData: any = {};
        if (validatedData.title) updateData.title = validatedData.title;
        if (validatedData.description) updateData.description = validatedData.description;
        if (validatedData.date) updateData.date = new Date(validatedData.date);
        if (validatedData.classId !== undefined) updateData.classId = validatedData.classId || null;

        const announcement = await prisma.announcement.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: {
                class: {
                    select: {
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(announcement);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating announcement:", error);
        return NextResponse.json(
            { error: "Failed to update announcement" },
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
        if (!session || !["admin", "super", "management", "teacher"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.announcement.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Announcement deleted successfully" });
    } catch (error) {
        console.error("Error deleting announcement:", error);
        return NextResponse.json(
            { error: "Failed to delete announcement" },
            { status: 500 }
        );
    }
}