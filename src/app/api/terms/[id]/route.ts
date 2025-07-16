import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const termUpdateSchema = z.object({
    session: z.string().min(1, "Session is required").optional(),
    term: z.enum(["First", "Second", "Third"]).optional(),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    nextterm: z.string().datetime().optional(),
    daysopen: z.number().int().min(1).optional(),
    status: z.enum(["Active", "Inactive"]).optional(),
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

        const term = await prisma.term.findUnique({
            where: { id },
        });

        if (!term) {
            return NextResponse.json(
                { error: "Term not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(term);
    } catch (error) {
        console.error("Error fetching term:", error);
        return NextResponse.json(
            { error: "Failed to fetch term" },
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
        const validatedData = termUpdateSchema.parse(body);

        const updateData: any = {};

        if (validatedData.session) updateData.session = validatedData.session;
        if (validatedData.term) updateData.term = validatedData.term;
        if (validatedData.start) updateData.start = new Date(validatedData.start);
        if (validatedData.end) updateData.end = new Date(validatedData.end);
        if (validatedData.nextterm) updateData.nextterm = new Date(validatedData.nextterm);
        if (validatedData.daysopen) updateData.daysopen = validatedData.daysopen;
        if (validatedData.status) updateData.status = validatedData.status;

        // If setting this term to active, deactivate all others
        const result = await prisma.$transaction(async (tx) => {
            if (validatedData.status === "Active") {
                // Set all other terms to Inactive
                await tx.term.updateMany({
                    where: {
                        id: { not: id },
                        status: "Active"
                    },
                    data: { status: "Inactive" }
                });
            }

            // Update the term
            const updatedTerm = await tx.term.update({
                where: { id },
                data: updateData,
            });

            return updatedTerm;
        });

        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        console.error("Error updating term:", error);
        return NextResponse.json(
            { error: "Failed to update term" },
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

        const result = await prisma.$transaction(async (tx) => {
            // Get the term to be deleted
            const termToDelete = await tx.term.findUnique({
                where: { id }
            });

            if (!termToDelete) {
                throw new Error("Term not found");
            }

            // Delete the term
            await tx.term.delete({
                where: { id },
            });

            // If the deleted term was active, make the most recent term active
            if (termToDelete.status === "Active") {
                const mostRecentTerm = await tx.term.findFirst({
                    where: { id: { not: id } },
                    orderBy: { createdAt: "desc" }
                });

                if (mostRecentTerm) {
                    await tx.term.update({
                        where: { id: mostRecentTerm.id },
                        data: { status: "Active" }
                    });
                }
            }

            return { message: "Term deleted successfully" };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error deleting term:", error);
        return NextResponse.json(
            { error: "Failed to delete term" },
            { status: 500 }
        );
    }
}