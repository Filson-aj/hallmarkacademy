import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const galleryUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    description: z.string().optional(),
    imageUrl: z.string().url("Valid image URL is required").optional(),
    category: z.enum(["CAROUSEL", "LOGO", "FACILITIES", "EVENTS", "STUDENTS", "TEACHERS", "ACHIEVEMENTS", "GENERAL"]).optional(),
    isActive: z.boolean().optional(),
    order: z.number().optional(),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } },

) {
    try {
        const { id } = params;
        const gallery = await prisma.gallery.findUnique({
            where: { id },
        });

        if (!gallery) {
            return NextResponse.json(
                { error: "Gallery item not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(gallery);
    } catch (error) {
        console.error("Error fetching gallery item:", error);
        return NextResponse.json(
            { error: "Failed to fetch gallery item" },
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
        const validatedData = galleryUpdateSchema.parse(body);

        const gallery = await prisma.gallery.update({
            where: { id: params.id },
            data: validatedData,
        });

        return NextResponse.json(gallery);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating gallery item:", error);
        return NextResponse.json(
            { error: "Failed to update gallery item" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.gallery.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Gallery item deleted successfully" });
    } catch (error) {
        console.error("Error deleting gallery item:", error);
        return NextResponse.json(
            { error: "Failed to delete gallery item" },
            { status: 500 }
        );
    }
}