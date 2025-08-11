import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getUserSchoolId } from "@/lib/utils";
import { studentSchema } from "@/lib/schemas";

/**
 * Generate a new admission number for a student.
 */
const generateAdmissionNumber = (
    existingAdmissions: string[] = [],
    currentDate = new Date(),
    prefix = "HALL"
) => {
    const yearStr = currentDate.getFullYear().toString();
    const safePrefix = prefix || "";
    const escapedPrefix = safePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`^${escapedPrefix}/${yearStr}/(\\d{5})$`);
    const sequences = existingAdmissions.reduce((acc: number[], admission: string) => {
        const match = admission.match(regex);
        if (match) acc.push(parseInt(match[1], 10));
        return acc;
    }, []);
    const baseSequence = 1;
    const nextSequence = sequences.length === 0 ? baseSequence : Math.max(...sequences) + 1;
    const paddedSequence = nextSequence.toString().padStart(5, "0");
    return `${safePrefix}/${yearStr}/${paddedSequence}`;
};

interface ListResponse {
    data: any[];
    total: number;
    message?: string;
}
const emptyList = (message = "No records found"): ListResponse => ({ data: [], total: 0, message });

export async function GET(request: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user.role || "").toLowerCase();

    // No query params accepted (per request)
    // Build where filter based on role only
    const where: Prisma.StudentWhereInput = {};

    try {
        if (role === "super") {
            // SUPER: no scoping, return all students
        } else if (role === "admin" || role === "management") {
            // ADMIN/MANAGEMENT: scope to their school; if none -> return empty
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolid: true },
            });
            if (!admin || !admin.schoolid) {
                return NextResponse.json(emptyList());
            }
            where.schoolid = admin.schoolid;
        } else if (role === "teacher") {
            // TEACHER: students in classes where teacher is formmaster
            const teacher = await prisma.teacher.findUnique({
                where: { id: session.user.id },
                select: { classes: { where: { formmasterid: session.user.id }, select: { id: true } } },
            });
            const classIds = teacher?.classes?.map((c) => c.id) ?? [];
            if (classIds.length === 0) return NextResponse.json(emptyList());
            where.classid = { in: classIds };
        } else if (role === "student") {
            // STUDENT: only their own record
            where.id = session.user.id;
        } else if (role === "parent") {
            // PARENT: students that belong to their children (by class)
            const children = await prisma.student.findMany({
                where: { parentid: session.user.id },
                select: { classid: true },
            });
            const classIds = children.map((c) => c.classid).filter(Boolean);
            if (classIds.length === 0) return NextResponse.json(emptyList());
            where.classid = { in: classIds };
        } else {
            // unknown/other roles -> empty
            return NextResponse.json(emptyList());
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                class: true,
                submissions: true,
                grades: true,
                attendances: true,
                parent: true,
                school: { select: { name: true } },
            },
            orderBy: [
                { surname: "asc" },
                { createdAt: "desc" },
            ],
        });

        return NextResponse.json({ data: students, total: students.length });
    } catch (err) {
        console.error("Error fetching students:", err);
        return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user.role || "").toLowerCase();
        if (!["super", "admin", "management", "teacher"].includes(role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const validated = studentSchema.parse(body);

        // Resolve school id
        let schoolIdToUse: string;
        if (role === "super") {
            if (!validated.schoolid) {
                return NextResponse.json({ error: "School ID is required" }, { status: 400 });
            }
            schoolIdToUse = validated.schoolid;
        } else {
            // management/admin: use their administration record for schoolid
            const admin = await prisma.administration.findUnique({
                where: { id: session.user.id },
                select: { schoolid: true },
            });
            if (!admin || !admin.schoolid) {
                return NextResponse.json({ error: "Access denied - No school record found" }, { status: 403 });
            }
            schoolIdToUse = admin.schoolid;
        }

        // Teacher-specific: ensure teacher creates only for their class
        if (role === "teacher") {
            const teacher = await prisma.teacher.findUnique({
                where: { id: session.user.id },
                select: { classes: { where: { formmasterid: session.user.id }, select: { id: true } } },
            });
            const allowedClassIds = teacher?.classes?.map((c) => c.id) ?? [];
            if (!allowedClassIds.includes(validated.classid)) {
                return NextResponse.json(
                    { error: "You can only create students for your assigned form master class" },
                    { status: 403 }
                );
            }
        }

        // Verify school exists and get prefix
        const school = await prisma.school.findUnique({
            where: { id: schoolIdToUse },
            select: { regnumberprepend: true },
        });
        if (!school) return NextResponse.json({ error: "School not found or regnumberprepend not defined" }, { status: 400 });

        // Verify class exists and capacity
        const classDetails = await prisma.class.findUnique({
            where: { id: validated.classid },
            select: { capacity: true },
        });
        if (!classDetails) return NextResponse.json({ error: "Class not found" }, { status: 400 });

        const studentCount = await prisma.student.count({ where: { classid: validated.classid } });
        if (classDetails.capacity !== null && studentCount >= classDetails.capacity) {
            return NextResponse.json({ error: "Class capacity reached. Cannot add more students." }, { status: 400 });
        }

        // Existing admissions and generate new admission number
        const existingAdmissions = await prisma.student.findMany({
            where: { schoolid: validated.schoolid },
            select: { admissionnumber: true },
        });
        const admissionNumbers: string[] = existingAdmissions
            .map((s) => s.admissionnumber)
            .filter((n): n is string => !!n);
        const admissionNumber = generateAdmissionNumber(admissionNumbers, new Date(), school.regnumberprepend || "");

        // Hash password (default to 'password')
        const hashedPassword = validated.password
            ? await bcrypt.hash(validated.password, 12)
            : await bcrypt.hash("password", 12);

        // Create student
        const newStudent = await prisma.$transaction(async (tx) => {
            return tx.student.create({
                data: {
                    admissionnumber: admissionNumber,
                    firstname: validated.firstname,
                    surname: validated.surname,
                    othername: validated.othername,
                    birthday: new Date(validated.birthday),
                    gender: validated.gender,
                    religion: validated.religion || null,
                    studenttype: validated.studenttype || null,
                    house: validated.house || null,
                    bloodgroup: validated.bloodgroup || null,
                    email: validated.email,
                    phone: validated.phone || null,
                    address: validated.address || null,
                    state: validated.state || null,
                    lga: validated.lga || null,
                    password: hashedPassword,
                    parentid: validated.parentid,
                    schoolid: validated.schoolid,
                    classid: validated.classid,
                },
                include: {
                    class: true,
                    parent: true,
                    school: { select: { name: true } },
                },
            });
        });

        return NextResponse.json(newStudent, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
        }
        console.error("Error creating student:", error);
        return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const role = (session.user.role || "").toLowerCase();
        if (!["super", "admin", "management", "teacher"].includes(role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(request.url);
        const ids = url.searchParams.getAll("ids");
        if (!ids.length) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

        // Non-super users: validate school association
        if (role !== "super") {
            const userSchoolIdRaw = await getUserSchoolId(session);
            const userSchoolId =
                typeof userSchoolIdRaw === "string"
                    ? userSchoolIdRaw
                    : Array.isArray(userSchoolIdRaw)
                        ? userSchoolIdRaw[0]
                        : undefined;
            if (!userSchoolId) return NextResponse.json({ error: "Access denied - no school association" }, { status: 403 });

            const students = await prisma.student.findMany({
                where: { id: { in: ids } },
                select: { schoolid: true, classid: true },
            });

            if (students.some((s) => s.schoolid !== userSchoolId)) {
                return NextResponse.json({ error: "You can only delete students from your assigned school" }, { status: 403 });
            }

            // If teacher, ensure those students are in their form-master class(es)
            if (role === "teacher") {
                const teacher = await prisma.teacher.findUnique({
                    where: { id: session.user.id },
                    select: { classes: { where: { formmasterid: session.user.id }, select: { id: true } } },
                });
                const allowedClassIds = teacher?.classes?.map((c) => c.id) ?? [];
                const studentsInAllowed = students.some((s) => allowedClassIds.includes(s.classid));
                if (!studentsInAllowed) {
                    return NextResponse.json(
                        { error: "You can only delete students from your assigned form master class" },
                        { status: 403 }
                    );
                }
            }
        }

        const result = await prisma.student.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ deleted: result.count }, { status: 200 });
    } catch (error) {
        console.error("Error deleting students:", error);
        return NextResponse.json({ error: "Failed to delete students" }, { status: 500 });
    }
}
