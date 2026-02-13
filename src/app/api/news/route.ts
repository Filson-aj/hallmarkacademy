import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { PostType } from "@/generated/prisma";

const newsSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    excerpt: z.string().optional(),
    author: z.string().min(1, "Author is required"),
    category: z.enum(["ACHIEVEMENT", "SPORTS", "FACILITIES", "ARTS", "EDUCATION", "COMMUNITY", "GENERAL"]),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    readTime: z.number().optional(),
    publishedAt: z.string().datetime().optional(),
    schoolId: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const category = searchParams.get("category");
        const status = searchParams.get("status");
        const featured = searchParams.get("featured");

        const skip = (page - 1) * limit;

        const where: any = { type: PostType.NEWS };
        if (category) where.category = category;
        if (status) where.status = status;
        if (featured) where.featured = featured === "true";

        const [news, total] = await Promise.all([
            prisma.post.findMany({
                where,
                skip,
                take: limit,
                orderBy: { publishedAt: "desc" },
            }),
            prisma.post.count({ where }),
        ]);

        return NextResponse.json({
            data: news,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching news:", error);
        return NextResponse.json(
            { error: "Failed to fetch news" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = newsSchema.parse(body);

        const news = await prisma.post.create({
            data: {
                type: PostType.NEWS,
                ...validatedData,
                publishedAt: validatedData.publishedAt
                    ? new Date(validatedData.publishedAt)
                    : validatedData.status === "PUBLISHED"
                        ? new Date()
                        : null,
            },
        });

        return NextResponse.json(news, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error creating news:", error);
        return NextResponse.json(
            { error: "Failed to create news" },
            { status: 500 }
        );
    }
}
