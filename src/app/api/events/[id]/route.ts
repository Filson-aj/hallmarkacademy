import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const eventUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().min(1, "Description is required").optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
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

        const event = await prisma.event.findUnique({
            where: { id: parseInt(id) },
            include: {
                class: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(event);
    } catch (error) {
        console.error("Error fetching event:", error);
        return NextResponse.json(
            { error: "Failed to fetch event" },
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
        const validatedData = eventUpdateSchema.parse(body);

        const updateData: any = {};
        if (validatedData.title) updateData.title = validatedData.title;
        if (validatedData.description) updateData.description = validatedData.description;
        if (validatedData.startTime) updateData.startTime = new Date(validatedData.startTime);
        if (validatedData.endTime) updateData.endTime = new Date(validatedData.endTime);
        if (validatedData.classId !== undefined) updateData.classId = validatedData.classId || null;

        const event = await prisma.event.update({
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

        return NextResponse.json(event);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating event:", error);
        return NextResponse.json(
            { error: "Failed to update event" },
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

        await prisma.event.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        return NextResponse.json(
            { error: "Failed to delete event" },
            { status: 500 }
        );
    }
}