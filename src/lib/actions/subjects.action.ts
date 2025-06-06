"use server";

import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { SubjectSchema, subjectSchema } from "../schemas";

/**
 * Standard response for actions
 */
interface ActionResponse {
  success: boolean;
  error: boolean;
  message: string;
  data?: any;
}

/**
 * Create a new Subject record.
 */
export async function create(
  _prev: ActionResponse,
  payload: SubjectSchema
): Promise<ActionResponse> {
  try {
    const parsed = subjectSchema.safeParse(payload);
    if (!parsed.success) {
      return { success: false, error: true, message: "Validation failed." };
    }

    // Normalize schoolid
    const schoolid =
      parsed.data.schoolid && parsed.data.schoolid.trim() !== ""
        ? parsed.data.schoolid
        : null;

    // Verify school exists if provided
    if (schoolid) {
      const school = await prisma.school.findUnique({
        where: { id: schoolid },
      });
      if (!school) {
        return {
          success: false,
          error: true,
          message: "A school with that ID does not exist.",
        };
      }
    }

    // Prepare teacher connections
    const teacherConnect = parsed.data.teachers?.length
      ? { connect: parsed.data.teachers.map((id) => ({ id })) }
      : undefined;

    const createData: any = {
      name: parsed.data.name,
      category: parsed.data.category,
      teachers: teacherConnect,
    };
    if (schoolid) {
      createData.schoolid = schoolid;
    }

    const data = await prisma.subject.create({
      data: createData,
    });

    revalidatePath("/subjects");
    return {
      success: true,
      error: false,
      message: "Subject created successfully.",
      data,
    };
  } catch (err: any) {
    // Handle unique constraint violation on name
    if (err.code === "P2002") {
      const fields = err.meta.target as string[];
      let msg = "Unique constraint violation.";
      if (fields.includes("name")) {
        msg = "A subject with that name already exists.";
      }
      return { success: false, error: true, message: msg };
    }
    console.error("An error occurred creating subject:", err);
    return { success: false, error: true, message: "Failed to create subject." };
  }
}

/**
 * Update an existing Subject record.
 */
export async function update(
  _prev: ActionResponse,
  payload: SubjectSchema & { id: string }
): Promise<ActionResponse> {
  try {
    const parsed = subjectSchema.safeParse(payload);
    if (!parsed.success || !parsed.data.id) {
      return { success: false, error: true, message: "Validation failed or missing ID." };
    }

    // Normalize and verify schoolid if present
    const schoolid =
      parsed.data.schoolid && parsed.data.schoolid.trim() !== ""
        ? parsed.data.schoolid
        : null;
    if (schoolid) {
      const school = await prisma.school.findUnique({
        where: { id: schoolid },
      });
      if (!school) {
        return {
          success: false,
          error: true,
          message: "A school with that ID does not exist.",
        };
      }
    }

    // Prepare teacher set
    const teacherSet = parsed.data.teachers?.length
      ? { set: parsed.data.teachers.map((id) => ({ id })) }
      : { set: [] };

    const data = await prisma.subject.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        schoolid: schoolid ?? undefined,
        updateAt: new Date(),
        teachers: teacherSet,
      },
    });

    revalidatePath("/subjects");
    return { success: true, error: false, message: "Subject updated successfully.", data };
  } catch (err: any) {
    // Handle unique constraint on name
    if (err.code === "P2002") {
      const fields = err.meta.target as string[];
      let msg = "Unique constraint violation.";
      if (fields.includes("name")) {
        msg = "A subject with that name already exists.";
      }
      return { success: false, error: true, message: msg };
    }
    console.error("An error occurred updating subject:", err);
    return { success: false, error: true, message: "Failed to update subject." };
  }
}

/**
 * Delete one or more Subject records.
 */
export async function remove(
  _prev: ActionResponse = { success: false, error: false, message: "" },
  ids: string[]
): Promise<ActionResponse> {
  try {
    const result = await prisma.subject.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/subjects");
    return {
      success: true,
      error: false,
      message: `${result.count} subject(s) deleted successfully.`,
      data: { count: result.count },
    };
  } catch (err: any) {
    console.error("An error occurred deleting subjects:", err);
    return { success: false, error: true, message: "Failed to delete subject(s)." };
  }
}
