import { z } from "zod";
import {
    UserSex,
    Roles,
    Terms,
    TestStatus,
    TermStatus,
    PaymentStatus,
    TraitCategory,
    PromotionStatus,
    Day,
    NewsCategory,
    NewsStatus,
    GalleryCategory,
    NotificationType,
} from "@/generated/prisma";

// Common
export const idSchema = z.string().cuid();
export const emailSchema = z.string().email();
export const phoneSchema = z.string().min(7).max(20);
export const passwordSchema = z.string().min(6);
export const dateSchema = z.string().datetime().or(z.date());

// --- Administration ---
export const administrationSchema = z.object({
    id: idSchema.optional(),
    username: z.string().optional(),
    email: emailSchema,
    password: passwordSchema.optional(), // hashed on server
    role: z.nativeEnum(Roles),
    active: z.boolean().optional(),
    avatar: z.string().optional(),
    schoolId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type AdministrationSchema = z.infer<typeof administrationSchema>;
export const administrationUpdateSchema = administrationSchema.partial();

// --- Parent ---
export const parentSchema = z.object({
    id: idSchema.optional(),
    username: z.string().optional(),
    title: z.string().optional(),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: dateSchema.optional(),
    bloodgroup: z.string().optional(),
    gender: z.nativeEnum(UserSex),
    occupation: z.string().optional(),
    religion: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: z.string().optional(),
    password: passwordSchema.optional(),
    avatar: z.string().optional(),
    active: z.boolean().optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type ParentSchema = z.infer<typeof parentSchema>;
export const parentUpdateSchema = parentSchema.partial();

// --- Student ---
export const studentSchema = z.object({
    id: idSchema.optional(),
    username: z.string().optional(),
    admissionNumber: z.string().optional(),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: dateSchema,
    gender: z.nativeEnum(UserSex),
    religion: z.string().optional(),
    studenttype: z.string().optional(),
    house: z.string().optional(),
    bloodgroup: z.string().optional(),
    admissionDate: dateSchema.optional(),
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: z.string().optional(),
    state: z.string().optional(),
    lga: z.string().optional(),
    avatar: z.string().optional(),
    password: passwordSchema.optional(),
    active: z.boolean().optional(),
    parentId: idSchema,
    schoolId: idSchema,
    classId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type StudentSchema = z.infer<typeof studentSchema>;
export const studentUpdateSchema = studentSchema.partial();

// --- Teacher ---
export const teacherSchema = z.object({
    id: idSchema.optional(),
    username: z.string().optional(),
    title: z.string().optional(),
    firstname: z.string().min(1),
    surname: z.string().min(1),
    othername: z.string().optional(),
    birthday: dateSchema.optional(),
    bloodgroup: z.string().optional(),
    gender: z.nativeEnum(UserSex),
    state: z.string().optional(),
    lga: z.string().optional(),
    email: emailSchema,
    phone: phoneSchema.optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
    active: z.boolean().optional(),
    password: passwordSchema.optional(),
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type TeacherSchema = z.infer<typeof teacherSchema>;
export const teacherUpdateSchema = teacherSchema.partial();

// --- Subject ---
export const subjectSchema = z.object({
    id: idSchema.optional(),
    name: z.string().min(1),
    category: z.string().optional(),
    schoolId: idSchema,
    teacherId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type SubjectSchema = z.infer<typeof subjectSchema>;
export const subjectUpdateSchema = subjectSchema.partial();

// --- Class ---
export const classSchema = z.object({
    id: idSchema.optional(),
    name: z.string().min(1),
    category: z.string().optional(),
    level: z.string().optional(),
    capacity: z.number().int().optional(),
    formmasterId: idSchema.optional(),
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type ClassSchema = z.infer<typeof classSchema>;
export const classUpdateSchema = classSchema.partial();

// --- PaymentSetup ---
export const paymentSetupSchema = z.object({
    id: idSchema.optional(),
    amount: z.number().int(),
    fees: z.number().int().optional(),
    partpayment: z.boolean().optional(),
    session: z.string().min(1),
    term: z.string().min(1),
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type PaymentSetupSchema = z.infer<typeof paymentSetupSchema>;
export const paymentSetupUpdateSchema = paymentSetupSchema.partial();

// --- Payment ---
export const paymentSchema = z.object({
    id: idSchema.optional(),
    session: z.string().min(1),
    term: z.nativeEnum(Terms),
    amount: z.number().int(),
    status: z.nativeEnum(PaymentStatus).optional(),
    studentId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type PaymentSchema = z.infer<typeof paymentSchema>;
export const paymentUpdateSchema = paymentSchema.partial();

// --- Term (model named Term) ---
export const termSchema = z.object({
    id: idSchema.optional(),
    start: dateSchema,
    end: dateSchema,
    nextTerm: dateSchema,
    daysOpen: z.number().int().optional(),
    session: z.string().min(1),
    term: z.nativeEnum(Terms),
    status: z.nativeEnum(TermStatus).optional(),
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type TermSchema = z.infer<typeof termSchema>;
export const termUpdateSchema = termSchema.partial();

// --- Lesson ---
export const lessonSchema = z.object({
    id: z.number().int().optional(),
    name: z.string().min(1),
    day: z.nativeEnum(Day),
    startTime: dateSchema,
    endTime: dateSchema,
    subjectId: idSchema,
    classId: idSchema,
    teacherId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type LessonSchema = z.infer<typeof lessonSchema>;
export const lessonUpdateSchema = lessonSchema.partial();

// --- Assignment ---
export const assignmentSchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    text: z.string().min(1),
    file: z.string().optional(),
    dueDate: dateSchema,
    graded: z.boolean().optional(),
    subjectId: idSchema,
    teacherId: idSchema,
    classId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type AssignmentSchema = z.infer<typeof assignmentSchema>;
export const assignmentUpdateSchema = assignmentSchema.partial();

// --- Test ---
export const testSchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    status: z.nativeEnum(TestStatus),
    instructions: z.string().min(1),
    duration: z.number().int(),
    maxscore: z.number().int(),
    open: z.boolean().optional(),
    testDate: dateSchema,
    testTime: dateSchema.optional(),
    term: z.string().min(1),
    subjectId: idSchema,
    teacherId: idSchema,
    classId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type TestSchema = z.infer<typeof testSchema>;
export const testUpdateSchema = testSchema.partial();

// --- Question ---
export const questionSchema = z.object({
    id: idSchema.optional(),
    text: z.string().min(1),
    options: z.any(), // JSON stored in DB
    answer: z.string().min(1),
    testId: idSchema,
});
export type QuestionSchema = z.infer<typeof questionSchema>;
export const questionUpdateSchema = questionSchema.partial();

// --- Answer ---
export const answerSchema = z.object({
    id: idSchema.optional(),
    score: z.number().optional(),
    testId: idSchema,
    studentId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type AnswerSchema = z.infer<typeof answerSchema>;
export const answerUpdateSchema = answerSchema.partial();

// --- Submission ---
export const submissionSchema = z.object({
    id: idSchema.optional(),
    answer: z.string().min(1),
    feedback: z.string().optional(),
    score: z.number().optional(),
    file: z.string().optional(),
    assignmentId: idSchema.optional(),
    studentId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type SubmissionSchema = z.infer<typeof submissionSchema>;
export const submissionUpdateSchema = submissionSchema.partial();

// --- GradingPolicy ---
export const gradingPolicySchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    passMark: z.number().int(),
    maxScore: z.number().int(),
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type GradingPolicySchema = z.infer<typeof gradingPolicySchema>;
export const gradingPolicyUpdateSchema = gradingPolicySchema.partial();

// --- Assessment ---
export const assessmentSchema = z.object({
    id: idSchema.optional(),
    name: z.string().min(1),
    weight: z.number(),
    maxScore: z.number().int(),
    gradingPolicyId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type AssessmentSchema = z.infer<typeof assessmentSchema>;
export const assessmentUpdateSchema = assessmentSchema.partial();

// --- Grading ---
export const gradingSchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    session: z.string().min(1),
    term: z.nativeEnum(Terms),
    published: z.boolean().optional(),
    gradingPolicyId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type GradingSchema = z.infer<typeof gradingSchema>;
export const gradingUpdateSchema = gradingSchema.partial();

// --- StudentGrade ---
export const studentGradeSchema = z.object({
    id: idSchema.optional(),
    score: z.number(),
    grade: z.string().optional(),
    remark: z.string().optional(),
    subjectPosition: z.string().optional(),
    studentId: idSchema,
    classId: idSchema,
    subjectId: idSchema,
    gradingId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type StudentGradeSchema = z.infer<typeof studentGradeSchema>;
export const studentGradeUpdateSchema = studentGradeSchema.partial();

// --- StudentAssessment ---
export const studentAssessmentSchema = z.object({
    id: idSchema.optional(),
    studentId: idSchema,
    assessmentId: idSchema,
    subjectId: idSchema,
    classId: idSchema,
    gradingId: idSchema,
    score: z.number(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type StudentAssessmentSchema = z.infer<typeof studentAssessmentSchema>;
export const studentAssessmentUpdateSchema = studentAssessmentSchema.partial();

// --- Trait & StudentTrait ---
export const traitSchema = z.object({
    id: idSchema.optional(),
    name: z.string().min(1),
    category: z.nativeEnum(TraitCategory),
    gradingPolicyId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export const studentTraitSchema = z.object({
    id: idSchema.optional(),
    score: z.number().int(),
    remark: z.string().optional(),
    traitId: idSchema,
    studentId: idSchema,
    gradingId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});

// --- ReportCard ---
export const reportCardSchema = z.object({
    id: idSchema.optional(),
    totalScore: z.number().optional(),
    averageScore: z.number().optional(),
    classPosition: z.string().optional(),
    remark: z.string().optional(),
    formmasterRemark: z.string().optional(),
    studentId: idSchema,
    classId: idSchema,
    gradingId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export type ReportCardSchema = z.infer<typeof reportCardSchema>;
export const reportCardUpdateSchema = reportCardSchema.partial();

// --- StudentPromotion ---
export const studentPromotionSchema = z.object({
    id: idSchema.optional(),
    studentId: idSchema,
    fromClassId: idSchema,
    toClassId: idSchema,
    session: z.string().min(1),
    promotedAt: dateSchema.optional(),
    status: z.nativeEnum(PromotionStatus),
    remark: z.string().optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});

// --- Attendance ---
export const attendanceSchema = z.object({
    id: z.number().int().optional(),
    date: dateSchema,
    present: z.boolean(),
    studentId: idSchema,
    schoolId: idSchema,
    createdAt: dateSchema.optional(),
});
export const attendanceUpdateSchema = attendanceSchema.partial();

// --- Event ---
export const eventSchema = z.object({
    id: z.number().int().optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    startTime: dateSchema,
    endTime: dateSchema,
    classId: idSchema.optional(),
    schoolId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export const eventUpdateSchema = eventSchema.partial();

// --- Announcement ---
export const announcementSchema = z.object({
    id: z.number().int().optional(),
    title: z.string().min(1),
    description: z.string().min(1),
    date: dateSchema,
    classId: idSchema.optional(),
    schoolId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export const announcementUpdateSchema = announcementSchema.partial();

// --- News ---
export const newsSchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    author: z.string().min(1),
    category: z.nativeEnum(NewsCategory),
    status: z.nativeEnum(NewsStatus).optional(),
    featured: z.boolean().optional(),
    image: z.string().optional(),
    readTime: z.number().int().optional(),
    publishedAt: dateSchema.optional(),
    schoolId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export const newsUpdateSchema = newsSchema.partial();

// --- Gallery ---
export const gallerySchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    category: z.nativeEnum(GalleryCategory),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
    schoolId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export const galleryUpdateSchema = gallerySchema.partial();

// --- Notification ---
export const notificationSchema = z.object({
    id: idSchema.optional(),
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.nativeEnum(NotificationType),
    broadcast: z.boolean().optional(),
    isRead: z.boolean().optional(),
    studentId: idSchema.optional(),
    teacherId: idSchema.optional(),
    parentId: idSchema.optional(),
    adminId: idSchema.optional(),
    schoolId: idSchema.optional(),
    createdAt: dateSchema.optional(),
    updatedAt: dateSchema.optional(),
});
export const notificationUpdateSchema = notificationSchema.partial();

// --- Misc exports ---
export type NewsSchema = z.infer<typeof newsSchema>;
export type GallerySchema = z.infer<typeof gallerySchema>;
export type NotificationSchema = z.infer<typeof notificationSchema>;
