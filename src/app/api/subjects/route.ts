import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { subjectSchema } from "@/lib/schemas";

enum UserRole {
  SUPER = "super",
  ADMIN = "admin",
  MANAGEMENT = "management",
  TEACHER = "teacher",
  STUDENT = "student",
  PARENT = "parent",
}

interface ListResponse {
  data: any[];
  total: number;
  message?: string;
}

const emptyList = (message = "No records found"): ListResponse => ({
  data: [],
  total: 0,
  message,
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  // --- AUTHORIZATION ---
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user.role || "").toLowerCase() as UserRole;

  // --- BUILD WHERE FILTER ---
  const where: Prisma.SubjectWhereInput = {};

  // --- ROLE-BASED SCOPING (no query params used) ---
  if (role === UserRole.SUPER) {
    // SUPER: no school scoping (returns all subjects)
  } else if (role === UserRole.ADMIN || role === UserRole.MANAGEMENT) {
    // ADMIN / MANAGEMENT: scoped to their school; if none -> empty list
    // retrieve schoolid from Administration record
    const admin = await prisma.administration.findUnique({
      where: { id: session.user.id },
      select: { schoolid: true },
    });
    if (!admin || !admin.schoolid) {
      return NextResponse.json(emptyList());
    }
    where.schoolid = admin.schoolid;
  } else if (role === UserRole.TEACHER) {
    // TEACHER: only their assigned subjects
    where.teacherid = session.user.id;
  } else if (role === UserRole.STUDENT) {
    // STUDENT: subjects that have lessons for their class
    const student = await prisma.student.findUnique({
      where: { id: session.user.id },
      select: { classid: true },
    });
    if (student?.classid) {
      where.lessons = { some: { classid: student.classid } };
    } else {
      return NextResponse.json(emptyList());
    }
  } else if (role === UserRole.PARENT) {
    // PARENT: subjects that have lessons for any of their children's classes
    const children = await prisma.student.findMany({
      where: { parentid: session.user.id },
      select: { classid: true },
    });
    const classIds = children.map((c) => c.classid).filter(Boolean);
    if (classIds.length) {
      where.lessons = { some: { classid: { in: classIds } } };
    } else {
      return NextResponse.json(emptyList());
    }
  } else {
    // unknown/other roles -> empty
    return NextResponse.json(emptyList());
  }

  // --- DATA FETCH ---
  try {
    const subjects = await prisma.subject.findMany({
      where,
      include: {
        school: { select: { name: true } },
        teacher: { select: { id: true, firstname: true, surname: true, othername: true, title: true } },
        _count: { select: { assignments: true, lessons: true, tests: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: subjects, total: subjects.length });
  } catch (err) {
    console.error("Error fetching subjects:", err);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user.role || "").toLowerCase() as UserRole;
    if (![UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN].includes(role)) {
      return NextResponse.json({ error: "Access denied - You can't create subject" }, { status: 403 });
    }

    const body = await request.json();
    const validated = subjectSchema.parse(body);

    let schoolIdToUse: string;

    if (role === UserRole.SUPER) {
      // super must supply schoolid in payload
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

    // Verify school exists
    const school = await prisma.school.findUnique({ where: { id: schoolIdToUse } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 400 });
    }

    // Verify teacher belongs to that school (if teacherid provided)
    if (validated.teacherid) {
      const teacher = await prisma.teacher.findUnique({ where: { id: validated.teacherid } });
      if (!teacher || teacher.schoolid !== schoolIdToUse) {
        return NextResponse.json({ error: "Teacher not found in specified school" }, { status: 400 });
      }
    }

    const newSubject = await prisma.subject.create({
      data: {
        name: validated.name,
        category: validated.category,
        schoolid: schoolIdToUse,
        teacherid: validated.teacherid || null,
      },
      include: {
        school: { select: { name: true } },
        teacher: { select: { id: true, firstname: true, surname: true, othername: true, title: true } },
        _count: { select: { assignments: true, lessons: true, tests: true } },
      },
    });

    return NextResponse.json(newSubject, { status: 201 });
  } catch (err: any) {
    console.error("Error creating subject:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user.role || "").toLowerCase() as UserRole;
    if (![UserRole.SUPER, UserRole.MANAGEMENT, UserRole.ADMIN].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const url = new URL(request.url);
    const ids = url.searchParams.getAll("ids");
    if (!ids.length) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    // For non-super users, ensure deleted subjects belong to their school
    if (role !== UserRole.SUPER) {
      const admin = await prisma.administration.findUnique({
        where: { id: session.user.id },
        select: { schoolid: true },
      });
      if (!admin || !admin.schoolid) {
        return NextResponse.json({ error: "Access denied - no school association" }, { status: 403 });
      }

      const schoolIdToUse = admin.schoolid;

      const subjects = await prisma.subject.findMany({
        where: { id: { in: ids } },
        select: { schoolid: true },
      });
      const invalidSubjects = subjects.filter((s) => s.schoolid !== schoolIdToUse);
      if (invalidSubjects.length > 0) {
        return NextResponse.json({ error: "Cannot delete subjects from other schools" }, { status: 403 });
      }
    }

    const result = await prisma.subject.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error deleting subjects:", error);
    return NextResponse.json({ error: "Failed to delete subjects" }, { status: 500 });
  }
}
