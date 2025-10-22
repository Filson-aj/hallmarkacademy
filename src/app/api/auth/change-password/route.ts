import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
    validateSession,
    validateRequestBody,
    handleError,
    successResponse,
    checkResourceExists,
    UserRole,
} from "@/lib/utils/api-helpers";

/**
 * Request body shape:
 * {
 *   userId: string,
 *   role: 'super'|'management'|'admin'|'teacher'|'student'|'parent',
 *   oldPassword?: string, // required when changing own password
 *   newPassword: string
 * }
 */
const changePasswordSchema = z.object({
    userId: z.string().min(1),
    role: z.enum(["super", "management", "admin", "teacher", "student", "parent"]),
    oldPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

type ChangePasswordBody = z.infer<typeof changePasswordSchema>;

export async function POST(request: NextRequest) {
    try {
        // Validate session (pass request so helpers can read headers/cookies)
        const validation = await validateSession();
        if (validation.error) return validation.error;

        const { session, userRole: sessionUserRole } = validation;

        // Validate request body
        const bodyValidation = await validateRequestBody(request, changePasswordSchema);
        if (bodyValidation.error) return bodyValidation.error;

        const { userId, role, oldPassword, newPassword } = bodyValidation.data as ChangePasswordBody;

        // Helper: select model based on role (Administration model holds admin/super/management)
        const getModel = (r: ChangePasswordBody["role"]) => {
            switch (r) {
                case "admin":
                case "super":
                case "management":
                    return { model: prisma.administration, name: "Administrator" };
                case "teacher":
                    return { model: prisma.teacher, name: "Teacher" };
                case "student":
                    return { model: prisma.student, name: "Student" };
                case "parent":
                    return { model: prisma.parent, name: "Parent" };
                default:
                    return null;
            }
        };

        const modelInfo = getModel(role);
        if (!modelInfo) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Is the requester changing someone else's password?
        const isChangingOthers = session!.user.id !== userId;

        // Elevated roles that can change other users' passwords (scoped below by school unless SUPER)
        const elevatedRoles = [UserRole.SUPER, UserRole.ADMIN, UserRole.MANAGEMENT];

        if (isChangingOthers && !elevatedRoles.includes(sessionUserRole)) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Ensure resource exists (general check)
        const resourceCheck = await checkResourceExists(modelInfo.model, userId, `${modelInfo.name} not found`);
        if (resourceCheck.error) return resourceCheck.error;

        // Fetch current record (include password and schoolId for scope checks)
        const current = await (modelInfo.model as any).findUnique({
            where: { id: userId },
            select: { id: true, password: true, schoolId: true },
        });

        if (!current) {
            return NextResponse.json({ error: `${modelInfo.name} not found` }, { status: 404 });
        }

        // If changing someone else's password, enforce school scoping for non-super users
        if (isChangingOthers) {
            // Only SUPER may change admins across schools; non-super elevated users only within their school
            if (role === "admin" && sessionUserRole !== UserRole.SUPER) {
                return NextResponse.json({ error: "Access denied to change administrator password" }, { status: 403 });
            }

            // If requester is not SUPER, ensure both users belong to same school (if session has school info)
            if (sessionUserRole !== UserRole.SUPER) {
                const requesterSchoolId = (session!.user as any).schoolId;
                // If either side lacks schoolId we deny to be safe, unless you intentionally allow cross-school changes
                if (!requesterSchoolId || !current.schoolId || requesterSchoolId !== current.schoolId) {
                    return NextResponse.json({ error: "Access denied: cross-school password changes are not allowed" }, { status: 403 });
                }
            }
        } else {
            // User is changing their own password -> oldPassword required & must match
            if (!oldPassword) {
                return NextResponse.json({ error: "Old password is required", code: "missing_old_password" }, { status: 400 });
            }

            if (!current.password) {
                // no password stored (e.g., external auth) — cannot change without special flow
                return NextResponse.json({ code: "invalid_old_password", message: "Old password is incorrect." }, { status: 401 });
            }

            const isValid = await bcrypt.compare(oldPassword, current.password);
            if (!isValid) {
                return NextResponse.json({ code: "invalid_old_password", message: "Old password is incorrect." }, { status: 401 });
            }

            // Prevent reusing the same password (quick client-side safeguard)
            if (oldPassword === newPassword) {
                return NextResponse.json({ error: "New password must be different from the old password" }, { status: 400 });
            }
        }

        // Hash new password and update appropriate model
        const hashed = await bcrypt.hash(newPassword, 12);

        // Build update payload and select fields to return
        const updateData: any = { password: hashed };
        const selectFields: any = { id: true, updatedAt: true };

        const updated = await (modelInfo.model as any).update({
            where: { id: userId },
            data: updateData,
            select: selectFields,
        });

        return successResponse({ message: "Password changed successfully", data: updated });
    } catch (error) {
        return handleError(error, "Failed to change password");
    }
}
