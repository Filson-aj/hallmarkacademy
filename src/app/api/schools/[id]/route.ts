import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schoolSchema } from "@/lib/schemas";
import path from "path";
import { promises as fs } from "fs";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // --- authorization ---
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // --- read multipart form data ---
        const formData = await request.formData();

        // --- collect all non-file fields into a plain object ---
        const raw: Record<string, any> = {};
        for (const [key, val] of formData.entries()) {
            if (key === "logo") continue;
            raw[key] = typeof val === "string" ? val : String(val);
        }

        // --- coerce regnumbercount to number if present ---
        if (raw.regnumbercount != null) {
            const n = Number(raw.regnumbercount);
            if (Number.isNaN(n)) {
                return NextResponse.json(
                    { error: "regnumbercount must be a valid number" },
                    { status: 400 }
                );
            }
            raw.regnumbercount = n;
        }

        // --- validate payload ---
        const validated = schoolSchema.parse(raw);

        // --- look up existing record (to get old logo) ---
        const existing = await prisma.school.findUnique({
            where: { id },
            select: { logo: true },
        });
        if (!existing) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }

        let newLogoFilename: string | null = existing.logo;

        // --- handle new logo upload if provided ---
        const file = formData.get("logo");
        if (file instanceof Blob && (file as any).size > 0) {
            // delete old file when local
            if (existing.logo && !existing.logo.startsWith("http")) {
                const oldPath = path.join(process.cwd(), "uploads/logo", existing.logo);
                fs.unlink(oldPath).catch(() => {
                    console.warn("Failed to delete old logo:", existing.logo);
                });
            }

            // validate mime & size
            const allowed = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/gif",
                "image/svg+xml",
            ];
            if (!allowed.includes(file.type)) {
                return NextResponse.json(
                    { error: "Invalid file type" },
                    { status: 400 }
                );
            }
            // @ts-ignore Blob.size
            if ((file as any).size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: "File too large (max 5MB)" },
                    { status: 400 }
                );
            }

            // save new file
            const uploadsDir = path.join(process.cwd(), "uploads/logo");
            await fs.mkdir(uploadsDir, { recursive: true });
            const timestamp = Date.now();
            const safeName = (file as any).name.replace(/[^a-zA-Z0-9.-]/g, "_");
            newLogoFilename = `${timestamp}_${safeName}`;
            const arrayBuf = await (file as Blob).arrayBuffer();
            await fs.writeFile(
                path.join(uploadsDir, newLogoFilename),
                Buffer.from(arrayBuf)
            );
        }

        // --- perform update ---
        const updated = await prisma.school.update({
            where: { id },
            data: {
                name: validated.name,
                subtitle: validated.subtitle || null,
                schooltype: validated.schooltype,
                email: validated.email,
                phone: validated.phone || null,
                address: validated.address,
                logo: newLogoFilename,
                contactperson: validated.contactperson || null,
                contactpersonphone: validated.contactpersonphone || null,
                contactpersonemail: validated.contactpersonemail || null,
                youtube: validated.youtube || null,
                facebook: validated.facebook || null,
                regnumbercount: validated.regnumbercount ?? undefined,
                regnumberprepend: validated.regnumberprepend || null,
                regnumberappend: validated.regnumberappend || null,
                updateAt: new Date(),
            },
        });

        return NextResponse.json(updated);
    } catch (err: any) {
        console.error("Error updating school:", err);
        return NextResponse.json(
            { error: "Failed to update school" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !["super", "admin", "management"].includes(session.user.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Fetch the school to get its logo filename
        const school = await prisma.school.findUnique({
            where: { id },
            select: { logo: true }
        });

        if (!school) {
            return NextResponse.json({ error: "School not found" }, { status: 404 });
        }

        // If there's a logo and it looks like a local upload, delete the file
        if (school.logo && !school.logo.startsWith("http")) {
            const filePath = path.join(process.cwd(), "uploads/logo", school.logo);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.warn(`Could not delete logo file ${school.logo}:`, err);
            }
        }

        // Now delete the school record
        await prisma.school.delete({
            where: { id }
        });

        return NextResponse.json({ message: "School deleted successfully" });
    } catch (error) {
        console.error("Error deleting school:", error);
        return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
    }
}
