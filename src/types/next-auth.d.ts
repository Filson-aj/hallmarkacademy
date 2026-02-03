import NextAuth from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            schoolId?: string | null;
            admissionNumber?: string | null;
            avatar?: string | null;
            section?: string | null;
        };
    }

    interface User {
        id: string;
        email: string;
        name: string;
        role: string;
        schoolId?: string | null;
        admissionNumber?: string | null;
        avatar?: string | null;
        section: string?
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
    }
}