import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PostType } from "@/generated/prisma";

const newsUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    content: z.string().min(1, "Content is required").optional(),
    excerpt: z.string().optional(),
    author: z.string().min(1, "Author is required").optional(),
    category: z.enum(["ACHIEVEMENT", "SPORTS", "FACILITIES", "ARTS", "EDUCATION", "COMMUNITY", "GENERAL"]).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
    featured: z.boolean().optional(),
    image: z.string().optional(),
    readTime: z.number().optional(),
    publishedAt: z.string().datetime().optional(),
});

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const news = await prisma.post.findFirst({
            where: { id, type: PostType.NEWS },
        });

        if (!news) {
            return NextResponse.json(
                { error: "News article not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(news);
    } catch (error) {
        console.error("Error fetching news:", error);
        return NextResponse.json(
            { error: "Failed to fetch news" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = newsUpdateSchema.parse(body);

        const existing = await prisma.post.findFirst({
            where: { id, type: PostType.NEWS },
            select: { id: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "News article not found" },
                { status: 404 }
            );
        }

        const updateData: any = { ...validatedData };

        if (validatedData.publishedAt) {
            updateData.publishedAt = new Date(validatedData.publishedAt);
        } else if (validatedData.status === "PUBLISHED") {
            updateData.publishedAt = new Date();
        }

        const news = await prisma.post.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(news);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating news:", error);
        return NextResponse.json(
            { error: "Failed to update news" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const existing = await prisma.post.findFirst({
            where: { id, type: PostType.NEWS },
            select: { id: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "News article not found" },
                { status: 404 }
            );
        }

        await prisma.post.delete({
            where: { id },
        });

        return NextResponse.json({ message: "News article deleted successfully" });
    } catch (error) {
        console.error("Error deleting news:", error);
        return NextResponse.json(
            { error: "Failed to delete news" },
            { status: 500 }
        );
    }
}
