import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                admissionNumber: { label: "Admission Number", type: "text" },
            },
            async authorize(credentials, req): Promise<User | null> {
                const { email, password, admissionNumber } = credentials ?? {};
                if ((!email && !admissionNumber) || !password) {
                    return null;
                }

                // Check in different user tables
                const admin = await prisma.administration.findUnique({
                    where: { email: email },
                });

                if (admin && admin.active) {
                    const isValid = await bcrypt.compare(password, admin.password || "");
                    if (isValid) {
                        return {
                            id: admin.id,
                            email: admin.email,
                            name: admin.username || "Admin",
                            role: admin.role.toLowerCase(),
                            schoolId: admin.schoolId,
                            avatar: admin.avatar,
                        } as unknown as User;
                    }
                }

                const teacher = await prisma.teacher.findUnique({
                    where: { email: email },
                });

                if (teacher && teacher.active) {
                    const isValid = await bcrypt.compare(password, teacher.password || "");
                    if (isValid) {
                        return {
                            id: teacher.id,
                            email: teacher.email,
                            name: `${teacher.firstname} ${teacher.surname} ${teacher.othername || ""}`.trim(),
                            role: "teacher",
                            schoolId: teacher.schoolId,
                            avatar: teacher.avatar,
                        } as unknown as User;
                    }
                }

                const studentWhere: any = {
                    OR: [
                        { email: email },
                        { admissionNumber: admissionNumber }
                    ]
                };
                const student = await prisma.student.findUnique({
                    where: studentWhere,
                });

                if (student && student.active) {
                    const isValid = await bcrypt.compare(password, student.password || "");
                    if (isValid) {
                        return {
                            id: student.id,
                            email: student.email || "",
                            name: `${student.firstname} ${student.surname} ${student.othername || ""}`.trim(),
                            role: "student",
                            schoolId: student.schoolId,
                            admissionNumber: student.admissionNumber,
                            avatar: student.avatar,
                        } as unknown as User;
                    }
                }

                const parent = await prisma.parent.findUnique({
                    where: { email: email },
                });

                if (parent && parent.active) {
                    const isValid = await bcrypt.compare(password, parent.password || "");
                    if (isValid) {
                        return {
                            id: parent.id,
                            email: parent.email,
                            name: `${parent.firstname} ${parent.surname} ${parent.othername || ""}`.trim(),
                            role: "parent",
                            avatar: parent.avatar,
                        } as unknown as User;
                    }
                }

                return null;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.sub!;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
};