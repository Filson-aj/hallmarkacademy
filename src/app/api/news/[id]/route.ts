import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

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
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const news = await prisma.news.findUnique({
            where: { id },
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
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const validatedData = newsUpdateSchema.parse(body);

        const updateData: any = { ...validatedData };

        if (validatedData.publishedAt) {
            updateData.publishedAt = new Date(validatedData.publishedAt);
        } else if (validatedData.status === "PUBLISHED") {
            updateData.publishedAt = new Date();
        }

        const news = await prisma.news.update({
            where: { id: params.id },
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
    { params }: { params: { id: string } }
) {
    try {
        await prisma.news.delete({
            where: { id: params.id },
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