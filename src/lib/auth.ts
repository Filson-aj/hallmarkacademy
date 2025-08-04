import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { RequestInternal } from "next-auth";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(
                credentials: Record<"email" | "password", string> | undefined,
                req: Pick<RequestInternal, "body" | "query" | "headers" | "method">
            ) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Check in different user tables
                const admin = await prisma.administration.findUnique({
                    where: { email: credentials.email },
                });

                if (admin) {
                    const isValid = await bcrypt.compare(credentials.password, admin.password || "");
                    if (isValid) {
                        return {
                            id: admin.id,
                            email: admin.email,
                            name: admin.username || "Admin",
                            role: admin.role.toLowerCase(),
                        };
                    }
                }

                const teacher = await prisma.teacher.findUnique({
                    where: { email: credentials.email },
                });

                if (teacher) {
                    const isValid = await bcrypt.compare(credentials.password, teacher.password || "");
                    if (isValid) {
                        return {
                            id: teacher.id,
                            email: teacher.email,
                            name: `${teacher.firstname} ${teacher.surname} ${teacher.othername || ""}`.trim(),
                            role: "teacher",
                        };
                    }
                }

                const student = await prisma.student.findUnique({
                    where: { email: credentials.email },
                });

                if (student) {
                    const isValid = await bcrypt.compare(credentials.password, student.password || "");
                    if (isValid) {
                        return {
                            id: student.id,
                            email: student.email,
                            name: `${student.firstname} ${student.surname} ${student.othername || ""}`.trim(),
                            role: "student",
                        };
                    }
                }

                const parent = await prisma.parent.findUnique({
                    where: { email: credentials.email },
                });

                if (parent) {
                    const isValid = await bcrypt.compare(credentials.password, parent.password || "");
                    if (isValid) {
                        return {
                            id: parent.id,
                            email: parent.email,
                            name: `${parent.firstname} ${parent.surname} ${parent.othername || ""}`.trim(), // Handle null othername
                            role: "parent",
                        };
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