"use server";

import { revalidatePath } from "next/cache";
import {
    ClassSchema,
    TestSchema,
    StudentSchema,
    SubjectSchema,
    TeacherSchema,
    SchoolSchema,
} from "./schemas";
import prisma from "./prisma";
import { clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

// Delete multiple teachers
// This function is a server action that deletes multiple teachers from the database
export async function deleteTeachersAction(ids: string[]) {
    await prisma.teacher.deleteMany({ where: { id: { in: ids } } });
}

// Bulk-delete schools, now revalidates cache
export const deleteSchoolsAction = async (
    ids: string[]
): Promise<{ success: boolean; error: boolean }> => {
    try {
        await prisma.school.deleteMany({ where: { id: { in: ids } } })
        return { success: true, error: false }
    } catch (err) {
        console.error(err)
        return { success: false, error: true }
    }
}

// ── CREATE SCHOOL ────────────────────────────────────────
export const createSchool = async (
    currentState: { success: boolean; error: boolean },
    data: SchoolSchema
): Promise<{ success: boolean; error: boolean }> => {
    try {
        await prisma.school.create({
            data: {
                name: data.name,
                subtitle: data.subtitle ?? null,
                schooltype: data.schooltype,
                email: data.email,
                phone: data.phone ?? null,
                address: data.address,
                logo: data.logo ?? null,
                /* subjects: {
                    connect: data.subjects.map((subjectId) => ({ id: subjectId })),
                },
                teachers: {
                    connect: data.teachers.map((teacherId) => ({ id: teacherId })),
                },
                students: {
                    connect: data.students.map((studentId) => ({ id: studentId })),
                },
                payments: {
                    connect: data.payments.map((paymentId) => ({ id: paymentId })),
                }, */
                updateAt: new Date(),
            },
        });

        return { success: true, error: false };
    } catch (err) {
        console.error("Error creating school:", err);
        return { success: false, error: true };
    }
};

export const updateSchool = async (
    currentState: { success: boolean; error: boolean },
    data: SchoolSchema & { id: string }
): Promise<{ success: boolean; error: boolean }> => {
    try {
        await prisma.school.update({
            where: { id: data.id },
            data: {
                name: data.name,
                subtitle: data.subtitle ?? null,
                schooltype: data.schooltype,
                email: data.email,
                phone: data.phone ?? null,
                address: data.address,
                logo: data.logo ?? null,
                /* subjects: {
                    set: data.subjects.map((subjectId) => ({ id: subjectId })),
                },
                teachers: {
                    set: data.teachers.map((teacherId) => ({ id: teacherId })),
                },
                students: {
                    set: data.students.map((studentId) => ({ id: studentId })),
                },
                payments: {
                    set: data.payments.map((paymentId) => ({ id: paymentId })),
                }, */
                updateAt: new Date(),
            },
        });

        return { success: true, error: false };
    } catch (err) {
        console.error("Error updating school:", err);
        return { success: false, error: true };
    }
};

// ── DELETE SINGLE SCHOOL ────────────────────────────────
export const deleteSchool = async (
    currentState: { success: boolean; error: boolean },
    data: FormData
): Promise<{ success: boolean; error: boolean }> => {
    const id = data.get('id') as string
    try {
        await prisma.school.delete({ where: { id } })
        return { success: true, error: false }
    } catch (err) {
        console.error(err)
        return { success: false, error: true }
    }
}

//
// ── SUBJECT ─────────────────────────────────────────────────────────────────────
//
export const createSubject = async (
    currentState: CurrentState,
    data: SubjectSchema
) => {
    try {
        await prisma.subject.create({
            data: {
                name: data.name,
                category: data.category,
                school: { connect: { id: data.schoolid } },
            },
        });
        revalidatePath("/list/subjects");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const updateSubject = async (
    currentState: CurrentState,
    data: SubjectSchema
) => {
    try {
        await prisma.subject.update({
            where: { id: data.id! },
            data: {
                name: data.name,
                category: data.category,
                // update the school relation
                school: { connect: { id: data.schoolid } },
                // replace all teachers
            },
        });
        revalidatePath("/list/subjects");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const deleteSubject = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        await prisma.subject.delete({ where: { id } });
        revalidatePath("/list/subjects");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};



export const updateClass = async (
    currentState: CurrentState,
    data: ClassSchema
) => {
    try {
        await prisma.class.update({
            where: { id: data.id! },
            data: {
                name: data.name,
                category: data.category,
                level: data.level,
                capacity: data.capacity,
                formmaster: data.formmasterid
                    ? { connect: { id: data.formmasterid } }
                    : { disconnect: true },
            },
        });
        revalidatePath("/list/classes");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const deleteClass = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        await prisma.class.delete({ where: { id } });
        revalidatePath("/list/classes");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

//
// ── TEACHER ─────────────────────────────────────────────────────────────────────
//
export const createTeacher = async (
    currentState: CurrentState,
    data: TeacherSchema
) => {
    try {
        // ── Clerk: get client instance ──────────────────────────────────────────
        const client = await clerkClient();

        // ── Clerk: create user ─────────────────────────────────────────────────
        const user = await client.users.createUser({
            emailAddress: [data.email],
            password: data.password,
            firstName: data.firstname,
            lastName: data.surname,
            publicMetadata: { role: "teacher" },
        });

        // ── Prisma: create Teacher  ───────────────
        await prisma.teacher.create({
            data: {
                id: user.id,
                username: data.email,
                title: data.title,
                firstname: data.firstname,
                surname: data.surname,
                othername: data.othername ?? null,
                birthday: data.birthday,
                bloodgroup: data.bloodgroup,
                gender: data.sex,
                state: data.state,
                lga: data.lga,
                email: data.email,
                phone: data.phone ?? null,
                address: data.address,
                avarta: data.avarta ?? null,
                school: { connect: { id: data.schoolid } },
                subjects: {
                    connect: data.subjects?.map((subjectId) => ({ id: subjectId })) ?? [],
                },
            },
        });

        revalidatePath("/list/teachers");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const updateTeacher = async (
    currentState: CurrentState,
    data: TeacherSchema
) => {
    if (!data.id) return { success: false, error: true };

    try {
        // 1) Update Clerk user
        const client = await clerkClient();
        await client.users.updateUser(data.id, {
            ...(data.password && { password: data.password }),
            firstName: data.firstname,
            lastName: data.surname,
        });

        // 2) Update in Prisma
        await prisma.teacher.update({
            where: { id: data.id },
            data: {
                title: data.title,
                firstname: data.firstname,
                surname: data.surname,
                othername: data.othername || null,
                birthday: data.birthday,
                bloodgroup: data.bloodgroup,
                gender: data.sex,
                state: data.state,
                lga: data.lga,
                phone: data.phone || null,
                address: data.address,
                avarta: data.avarta || null,
                school: { connect: { id: data.schoolid } },
                subjects: {
                    set: data.subjects?.map((subjectId) => ({ id: subjectId })) || [],
                },
            },
        });

        revalidatePath("/list/teachers");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const deleteTeacher = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        const client = await clerkClient();
        await client.users.deleteUser(id);
        await prisma.teacher.delete({ where: { id } });
        revalidatePath("/list/teachers");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

//
// ── STUDENT ─────────────────────────────────────────────────────────────────────
//
export const createStudent = async (
    currentState: CurrentState,
    data: StudentSchema
) => {
    try {
        // enforce class capacity
        const cls = await prisma.class.findUnique({
            where: { id: data.classid },
            include: { _count: { select: { students: true } } },
        });
        if (cls && cls.capacity === cls._count.students) {
            return { success: false, error: true };
        }

        // 1) Clerk user
        const client = await clerkClient();
        const user = await client.users.createUser({
            emailAddress: [data.email],
            password: data.password,
            firstName: data.firstname,
            lastName: data.surname,
            publicMetadata: { role: "student" },
        });

        // 2) Prisma student
        await prisma.student.create({
            data: {
                id: user.id,
                username: data.email,
                admissionnumber: data.admissionnumber,
                firstname: data.firstname,
                surname: data.surname,
                othername: data.othername || null,
                birthday: data.birthday,
                gender: data.gender,
                religion: data.religion,
                studenttype: data.studenttype,
                house: data.house,
                bloodgroup: data.bloodgroup,
                email: data.email,
                phone: data.phone || null,
                address: data.address,
                state: data.state,
                lga: data.lga,
                avarta: data.avarta || null,
                parent: { connect: { id: data.parentid } },
                school: { connect: { id: data.schoolid } },
                class: { connect: { id: data.classid } },
            },
        });

        revalidatePath("/list/students");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const updateStudent = async (
    currentState: CurrentState,
    data: StudentSchema
) => {
    if (!data.id) return { success: false, error: true };

    try {
        const client = await clerkClient();
        await client.users.updateUser(data.id, {
            ...(data.password && { password: data.password }),
            firstName: data.firstname,
            lastName: data.surname,
        });

        await prisma.student.update({
            where: { id: data.id },
            data: {
                firstname: data.firstname,
                surname: data.surname,
                othername: data.othername || null,
                birthday: data.birthday,
                gender: data.gender,
                religion: data.religion,
                studenttype: data.studenttype,
                house: data.house,
                bloodgroup: data.bloodgroup,
                phone: data.phone || null,
                address: data.address,
                state: data.state,
                lga: data.lga,
                avarta: data.avarta || null,
                parent: { connect: { id: data.parentid } },
                school: { connect: { id: data.schoolid } },
                class: { connect: { id: data.classid } },
            },
        });

        revalidatePath("/list/students");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const deleteStudent = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        const client = await clerkClient();
        await client.users.deleteUser(id);
        await prisma.student.delete({ where: { id } });
        revalidatePath("/list/students");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

//
// ── TEST (formerly “exam”) ──────────────────────────────────────────────────────
//
export const createTest = async (
    currentState: CurrentState,
    data: TestSchema
) => {
    try {
        await prisma.test.create({
            data: {
                title: data.title,
                status: data.status,
                instructions: data.instructions || '',
                duration: data.duration,
                maxscore: data.maxscore,
                open: data.open,
                testdate: data.testdate,
                testtime: data.testtime,
                term: data.term,
                subject: { connect: { id: data.subjectid } },
                teacher: { connect: { id: data.teacherid } },
            },
        });
        revalidatePath("/list/tests");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const updateTest = async (
    currentState: CurrentState,
    data: TestSchema
) => {
    try {
        await prisma.test.update({
            where: { id: data.id! },
            data: {
                title: data.title,
                status: data.status,
                instructions: data.instructions,
                duration: data.duration,
                maxscore: data.maxscore,
                open: data.open,
                testdate: data.testdate,
                testtime: data.testtime,
                term: data.term,
                subject: { connect: { id: data.subjectid } },
                teacher: { connect: { id: data.teacherid } },
            },
        });
        revalidatePath("/list/tests");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};

export const deleteTest = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        await prisma.test.delete({ where: { id } });
        revalidatePath("/list/tests");
        return { success: true, error: false };
    } catch (err) {
        console.error(err);
        return { success: false, error: true };
    }
};
