import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { promises as fs } from "fs";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const schools = await prisma.school.findMany({
            include: {
                _count: {
                    select: {
                        students: true,
                        teachers: true,
                        subjects: true,
                        paymentsetups: true,
                        payments: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(schools);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        // --- auth check ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- get multipart form data ---
        const formData = await request.formData();

        // --- build plain object of string values ---
        const rawData: Record<string, any> = {};
        for (const [key, val] of formData.entries()) {
            if (key === "logo") continue;
            rawData[key] = typeof val === "string" ? val : String(val);
        }

        // --- coerce regnumbercount to number ---
        if (rawData.regnumbercount != null) {
            const n = Number(rawData.regnumbercount);
            if (Number.isNaN(n)) {
                return NextResponse.json(
                    { error: "regnumbercount must be a valid number" },
                    { status: 400 }
                );
            }
            rawData.regnumbercount = n;
        }

        // --- run Zod validation ---
        const validatedData = schoolSchema.parse(rawData);

        // --- file handling ---
        const file = formData.get("logo");
        if (!(file instanceof Blob)) {
            return NextResponse.json({ error: "Logo is required" }, { status: 400 });
        }

        // --- validate image ---
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
        if (!allowed.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
        }
        // @ts-ignore Blob.size on Web Blob
        if ((file as any).size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
        }

        // --- save file ---
        const uploadsDir = path.join(process.cwd(), "uploads/logo");
        await mkdir(uploadsDir, { recursive: true });
        const timestamp = Date.now();
        const orig = (file as any).name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${timestamp}_${orig}`;
        const buf = Buffer.from(await (file as Blob).arrayBuffer());
        await writeFile(path.join(uploadsDir, filename), buf);

        // --- persist to DB ---
        const school = await prisma.school.create({
            data: {
                name: validatedData.name,
                subtitle: validatedData.subtitle || null,
                schooltype: validatedData.schooltype,
                email: validatedData.email,
                phone: validatedData.phone || null,
                address: validatedData.address,
                logo: filename,
                contactperson: validatedData.contactperson || null,
                contactpersonphone: validatedData.contactpersonphone || null,
                contactpersonemail: validatedData.contactpersonemail || null,
                youtube: validatedData.youtube || null,
                facebook: validatedData.facebook || null,
                regnumbercount: validatedData.regnumbercount,
                regnumberprepend: validatedData.regnumberprepend || null,
                regnumberappend: validatedData.regnumberappend || null,
            },
        });

        return NextResponse.json(school, { status: 201 });
    } catch (err: any) {
        console.error("Error creating school:", err);
        return NextResponse.json({ error: "Failed to create school" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        // --- authorization ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "management", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // --- parse ?ids=... query params ---
        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (ids.length === 0 || ids.some(id => !id)) {
            return NextResponse.json(
                { error: "Valid school ID(s) are required" },
                { status: 400 }
            );
        }

        // --- fetch all matching schools to get logo filenames ---
        const schools = await prisma.school.findMany({
            where: { id: { in: ids } },
            select: { logo: true },
        });

        // --- delete each local logo file (if present) ---
        await Promise.all(
            schools.map(async ({ logo }) => {
                if (logo && !logo.startsWith("http")) {
                    const filePath = path.join(process.cwd(), "uploads/logo", logo);
                    try {
                        await fs.unlink(filePath);
                    } catch (err) {
                        console.warn(`Could not delete logo file "${logo}":`, err);
                    }
                }
            })
        );

        // --- bulk delete DB records ---
        await prisma.school.deleteMany({
            where: { id: { in: ids } },
        });

        // 204 No Content on success
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting schools:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}