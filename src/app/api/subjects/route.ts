import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { getUserSchoolId } from "@/lib/utils";
import { subjectSchema } from "@/lib/schemas";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const schoolidParam = searchParams.get("schoolid");

    const userSchoolId = await getUserSchoolId(session);
    const role = session.user.role.toLowerCase();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) where.category = category;

    // Scope by role
    if (!["super", "management", "admin"].includes(role)) {
      const sid = typeof userSchoolId === 'string'
        ? userSchoolId
        : Array.isArray(userSchoolId)
          ? userSchoolId[0]
          : null;
      if (!sid) {
        return NextResponse.json({ error: "Access denied - no school association" }, { status: 403 });
      }
      where.schoolid = sid;

      if (role === "teacher") {
        where.teacherid = session.user.id;
      }
      if (role === "student") {
        const student = await prisma.student.findUnique({
          where: { id: session.user.id },
          select: { classid: true }
        });
        if (student) where.lessons = { some: { classid: student.classid } };
      }
      if (role === "parent") {
        const children = await prisma.student.findMany({
          where: { parentid: session.user.id },
          select: { classid: true }
        });
        const classIds = children.map(c => c.classid);
        where.lessons = { some: { classid: { in: classIds } } };
      }
    } else {
      if (schoolidParam) where.schoolid = schoolidParam;
    }

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
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role.toLowerCase();
    if (!["super", "management", "admin"].includes(role)) {
      return NextResponse.json({ error: "Access denied - insufficient permissions" }, { status: 403 });
    }

    const body = await request.json();
    const validated = subjectSchema.parse(body);

    let schoolIdToUse: string;

    if (role === "super") {
      // Super must supply the schoolid in the request
      schoolIdToUse = validated.schoolid || "";
    } else {
      // Management & Admin: ignore incoming schoolid, use their own
      const userSchoolId = await getUserSchoolId(session);
      schoolIdToUse = typeof userSchoolId === 'string'
        ? userSchoolId
        : Array.isArray(userSchoolId)
          ? userSchoolId[0]
          : '';
      if (!schoolIdToUse) {
        return NextResponse.json({ error: "Access denied - no school association" }, { status: 403 });
      }
    }

    // Verify school exists
    const school = await prisma.school.findUnique({ where: { id: schoolIdToUse } });
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 400 });
    }

    // Verify teacher belongs to that school
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role.toLowerCase();
    if (!["super", "management", "admin"].includes(role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const url = new URL(request.url);
    const ids = url.searchParams.getAll("ids");
    if (!ids.length) {
      return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
    }

    const result = await prisma.subject.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error deleting subjects:", error);
    return NextResponse.json({ error: "Failed to delete subjects" }, { status: 500 });
  }
}
