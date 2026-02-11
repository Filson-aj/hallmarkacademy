import "server-only";
import prisma from "@/lib/prisma";

// Helper function to get user's school ID based on their role
export async function getUserSchoolId(session: any) {
  const { user } = session;

  switch (user.role.toLowerCase()) {
    case "super":
      return null;

    case "management":
    case "admin": {
      const admin = await prisma.administration.findUnique({
        where: { id: user.id },
        select: { schoolId: true },
      });
      return admin?.schoolId || null;
    }

    case "teacher": {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { schoolId: true },
      });
      return teacher?.schoolId || null;
    }

    case "student": {
      const student = await prisma.student.findUnique({
        where: { id: user.id },
        select: { schoolId: true },
      });
      return student?.schoolId || null;
    }

    case "parent": {
      const parent = await prisma.parent.findUnique({
        where: { id: user.id },
        include: {
          students: {
            select: { schoolId: true },
          },
        },
      });
      return parent?.students.map((s) => s.schoolId) || [];
    }

    default:
      return null;
  }
}
