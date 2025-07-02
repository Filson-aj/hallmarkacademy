import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const gallerySchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    imageUrl: z.string().url("Valid image URL is required"),
    category: z.enum(["CAROUSEL", "LOGO", "FACILITIES", "EVENTS", "STUDENTS", "TEACHERS", "ACHIEVEMENTS", "GENERAL"]),
    isActive: z.boolean().default(true),
    order: z.number().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const isActive = searchParams.get("isActive");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const skip = (page - 1) * limit;

        const where: any = {};
        if (category) where.category = category;
        if (isActive !== null) where.isActive = isActive === "true";

        const [gallery, total] = await Promise.all([
            prisma.gallery.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            }),
            prisma.gallery.count({ where }),
        ]);

        return NextResponse.json({
            data: gallery,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching gallery:", error);
        return NextResponse.json(
            { error: "Failed to fetch gallery" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = gallerySchema.parse(body);

        const gallery = await prisma.gallery.create({
            data: validatedData,
        });

        return NextResponse.json(gallery, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating gallery item:", error);
        return NextResponse.json(
            { error: "Failed to create gallery item" },
            { status: 500 }
        );
    }
}