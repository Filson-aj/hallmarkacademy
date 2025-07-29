import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getUserSchoolId } from "@/lib/utils";
import { termSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get and prepare search params
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const session_param = searchParams.get("session");

        const userSchoolId = await getUserSchoolId(session);

        // Build the where clause
        const where: any = {};
        if (status) where.status = status;
        if (session_param) where.session = session_param;

        const terms = await prisma.term.findMany({
            where,
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" }
            ],
        });

        return NextResponse.json({
            data: terms,
            total: terms.length,
        });
    } catch (error) {
        console.error("Error fetching terms:", error);
        return NextResponse.json(
            { error: "Failed to fetch terms" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["admin", "super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = termSchema.parse(body);

        // Calculate days open if not provided
        const startDate = new Date(validatedData.start);
        const endDate = new Date(validatedData.end);
        const daysopen = validatedData.daysopen || Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        // Start a transaction to handle term creation and status updates
        const result = await prisma.$transaction(async (tx) => {
            // Set all existing terms to Inactive
            await tx.term.updateMany({
                where: {
                    status: "Active",
                },
                data: { status: "Inactive" }
            });

            // Create new term as Active
            const newTerm = await tx.term.create({
                data: {
                    session: validatedData.session,
                    term: validatedData.term,
                    start: startDate,
                    end: endDate,
                    nextterm: new Date(validatedData.nextterm),
                    daysopen,
                    status: "Active",
                },
            });

            return newTerm;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error("Error creating term:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation failed", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create term" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (
            !session ||
            !['admin', 'super', 'management'].includes(session.user.role)
        ) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse & validate IDs
        const url = new URL(request.url);
        const ids = url.searchParams.getAll('ids');
        if (ids.length === 0 || ids.some((id) => !id)) {
            return NextResponse.json(
                { error: 'Valid term ID(s) are required' },
                { status: 400 }
            );
        }

        // Transaction: delete + re‑activate if needed
        const result = await prisma.$transaction(async (tx) => {
            // Fetch terms to delete
            const toDelete = await tx.term.findMany({
                where: { id: { in: ids } },
                select: { id: true, status: true },
            });
            if (toDelete.length === 0) {
                throw new Error('No matching terms found');
            }

            // Check if any “Active” term is being deleted
            const hadActiveDeleted = toDelete.some((t) => t.status === 'Active');

            // Delete them
            await tx.term.deleteMany({
                where: { id: { in: ids } },
            });

            // If an active term was removed, activate the newest remaining term
            if (hadActiveDeleted) {
                const newest = await tx.term.findFirst({
                    orderBy: { createdAt: 'desc' },
                });
                if (newest) {
                    await tx.term.update({
                        where: { id: newest.id },
                        data: { status: 'Active' },
                    });
                }
            }

            return {
                message: 'Terms deleted successfully',
                deletedCount: toDelete.length,
            };
        });

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error('Error deleting terms:', error);
        const status = error.message === 'No matching terms found' ? 404 : 500;
        return NextResponse.json(
            { error: error.message || 'Failed to delete terms' },
            { status }
        );
    }
}