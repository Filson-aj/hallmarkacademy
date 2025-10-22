import { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req): Promise<User | null> {
                const { username, password } = credentials ?? {};
                if (!username || !password) {
                    return null;
                }

                try {
                    // admministration authentication
                    const admin = await prisma.administration.findUnique({
                        where: { email: username },
                    });

                    if (admin) {
                        if (!admin.active) {
                            throw new Error("inactive");
                        }
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
                        } else {
                            throw new Error("invalid_credentials");
                        }
                    }

                    // Teacher authentication
                    const teacher = await prisma.teacher.findUnique({
                        where: { email: username },
                    });

                    if (teacher) {
                        if (!teacher.active) {
                            throw new Error("inactive");
                        }
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
                        } else {
                            throw new Error("invalid_credentials");
                        }
                    }

                    // Student authentication
                    const student = await prisma.student.findUnique({
                        where: { admissionNumber: username },
                    });

                    if (student) {
                        if (!student.active) {
                            throw new Error("inactive");
                        }
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
                        } else {
                            throw new Error("invalid_credentials");
                        }
                    }

                    // Parent authentication
                    const parent = await prisma.parent.findUnique({
                        where: { email: username },
                    });

                    if (parent) {
                        if (!parent.active) {
                            throw new Error("inactive");
                        }
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
                } catch (err: any) {
                    if (err instanceof Error && ["inactive", "invalid_credentials"].includes(err.message)) {
                        throw err;
                    }
                    console.error("Authorization Error:", err);
                    throw new Error("server_error");
                }
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