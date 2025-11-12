"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Spinner from "@/components/Spinner/Spinner";
import { termSchema, TermSchema } from "@/lib/schemas";
import { useSchools } from "@/hooks/useSchools";
import { useUpdateTerm, useGetTermById } from "@/hooks/useTerms";
import { useQueryClient } from "@tanstack/react-query";
import type { Term } from "@/generated/prisma";

const termOptions = [
    { label: "First", value: "First" },
    { label: "Second", value: "Second" },
    { label: "Third", value: "Third" },
];

const EditTerm: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string | undefined;
    const toast = useRef<Toast | null>(null);
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const updateTerm = useUpdateTerm();
    const { data: schoolsData, isLoading: schoolsLoading, error: schoolsError } = useSchools();

    // fetch the term by id
    const { data: term, isLoading: termLoading, error: termError } = useGetTermById(id ?? "");

    const viewerRole = ((session?.user?.role as string) || "guest").toLowerCase();
    const sessionSchoolId = (session?.user as any)?.schoolId as string | undefined;

    const [localLoading, setLocalLoading] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<TermSchema>({
        resolver: zodResolver(termSchema),
        mode: "onBlur",
        defaultValues: {
            session: "",
            term: undefined,
            start: undefined,
            end: undefined,
            nextterm: undefined,
            schoolId: viewerRole === "super" ? undefined : sessionSchoolId,
        } as any,
    });

    // When term loads, populate the form
    useEffect(() => {
        if (term) {
            reset({
                session: term.session ?? "",
                term: (term.term as any) ?? undefined,
                start: term.start ? new Date(term.start) : undefined,
                end: term.end ? new Date(term.end) : undefined,
                nextterm: (term as any).nextTerm ? new Date((term as any).nextTerm) : (term as any).nextterm ? new Date((term as any).nextterm) : undefined,
                schoolId: term.schoolId ?? (viewerRole === "super" ? undefined : sessionSchoolId),
            } as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [term, reset]);

    // Ensure non-super users have schoolId set from session
    useEffect(() => {
        if (viewerRole !== "super" && sessionSchoolId) {
            setValue("schoolId" as any, sessionSchoolId as any);
        }
    }, [viewerRole, sessionSchoolId, setValue]);

    useEffect(() => {
        if (schoolsError) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (schoolsError as any)?.message || "Failed to load schools",
                life: 3000,
            });
        }
    }, [schoolsError]);

    useEffect(() => {
        if (termError) {
            toast.current?.show({
                severity: "error",
                summary: "Load Error",
                detail: (termError as any)?.message || "Failed to load term",
                life: 3000,
            });
        }
    }, [termError]);

    const schoolOptions = (schoolsData ?? []).map((s: any) => ({ label: s.name, value: s.id }));

    const show = (severity: "success" | "error" | "info" | "warn", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    // Helper to build API payload
    const buildPayload = (data: TermSchema) => {
        return {
            session: data.session,
            term: data.term,
            start: data.start ? new Date(data.start).toISOString() : undefined,
            end: data.end ? new Date(data.end).toISOString() : undefined,
            nextterm: data.nextterm ? new Date(data.nextterm).toISOString() : undefined,
            daysopen: (data as any).daysopen ?? undefined,
            status: (data as any).status ?? undefined,
            schoolId: (data as any).schoolId ?? undefined,
        } as any;
    };

    const onSubmit = async (data: TermSchema) => {
        if (!id) {
            show("error", "No ID", "No term id provided in route.");
            return;
        }

        setLocalLoading(true);
        const payload = buildPayload(data);
        const termId = id;

        // Snapshot caches to rollback if needed
        const previousTerms = queryClient.getQueryData<Term[]>(["terms"]) ?? [];
        const previousBySchool = queryClient.getQueryData<Term[]>(["terms", "bySchool", payload.schoolId ?? ""]) ?? null;
        const previousById = queryClient.getQueryData<Term>(["terms", termId]);

        // Build optimistic updated term object using existing term as base
        const optimistic: Term = {
            ...(term as Term),
            session: payload.session ?? (term as any)?.session,
            term: payload.term ?? (term as any)?.term,
            start: payload.start ? new Date(payload.start) : (term as any)?.start,
            end: payload.end ? new Date(payload.end) : (term as any)?.end,
            nextTerm: payload.nextterm ? new Date(payload.nextterm) : (term as any)?.nextTerm ?? (term as any)?.nextterm ?? null,
            daysOpen: payload.daysopen ?? (term as any)?.daysOpen ?? 0,
            status: (payload.status as any) ?? (term as any)?.status ?? "Active",
            schoolId: payload.schoolId ?? (term as any)?.schoolId ?? null,
            updatedAt: new Date(),
        } as any;

        try {
            // Optimistically update caches
            queryClient.setQueryData<Term[]>(["terms"], (old = []) => old.map((t) => (t.id === termId ? optimistic : t)));
            if (payload.schoolId) {
                queryClient.setQueryData<Term[]>(["terms", "bySchool", payload.schoolId], (old = []) =>
                    old.map((t) => (t.id === termId ? optimistic : t))
                );
            }
            queryClient.setQueryData<Term>(["terms", termId], optimistic);

            // Call server
            const updated = await updateTerm.mutateAsync({ id: termId, data: payload });

            // Replace optimistic entries with server result
            queryClient.setQueryData<Term[]>(["terms"], (old = []) => old.map((t) => (t.id === termId ? updated : t)));
            if (updated?.id && payload.schoolId) {
                queryClient.setQueryData<Term[]>(["terms", "bySchool", payload.schoolId], (old = []) =>
                    old.map((t) => (t.id === termId ? updated : t))
                );
            }
            queryClient.setQueryData<Term>(["terms", updated.id], updated);

            // ensure canonical sync
            queryClient.invalidateQueries({ queryKey: ["terms"] });
            if (payload.schoolId) queryClient.invalidateQueries({ queryKey: ["terms", "bySchool", payload.schoolId] });

            show("success", "Term Updated", "The term has been updated successfully.");
            reset({
                session: updated.session ?? "",
                term: updated.term as any,
                start: updated.start ? new Date(updated.start) : undefined,
                end: updated.end ? new Date(updated.end) : undefined,
                nextterm: (updated as any).nextTerm ? new Date((updated as any).nextTerm) : (updated as any).nextterm ? new Date((updated as any).nextterm) : undefined,
                schoolId: updated.schoolId ?? (viewerRole === "super" ? undefined : sessionSchoolId),
            } as any);

            setTimeout(() => router.back(), 700);
        } catch (err: any) {
            // rollback
            if (previousTerms) queryClient.setQueryData(["terms"], previousTerms);
            if (previousBySchool && payload.schoolId) queryClient.setQueryData(["terms", "bySchool", payload.schoolId], previousBySchool);
            if (previousById) queryClient.setQueryData(["terms", termId], previousById);

            show("error", "Update Error", err?.message || "Failed to update term.");
        } finally {
            setLocalLoading(false);
        }
    };

    const loading = localLoading || updateTerm.isPending;

    if (!id || termLoading || schoolsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (!term) {
        return (
            <section className="w-[90%] bg-white mx-auto my-4 rounded-md shadow-md p-6 text-center">
                <p className="text-gray-600">Term not found.</p>
                <Button label="Back" onClick={() => router.back()} className="mt-4" />
            </section>
        );
    }

    return (
        <section className="w-[90%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {loading && <Spinner visible onHide={() => setLocalLoading(false)} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 p-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80">Edit Term</h2>
                <div className="hidden sm:flex gap-2">
                    <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        onClick={() => router.back()}
                        className="bg-red-600 text-white rounded-lg text-sm sm:text-base border border-red-600 inline-flex items-center gap-2 py-2 px-3 hover:bg-red-700 hover:border-red-700 transition-all duration-200"
                    />
                </div>
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* School: super can change, others see or have it auto-filled */}
                    {viewerRole === "super" ? (
                        <div className="p-field">
                            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                            <Controller
                                name="schoolId"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        {...field}
                                        options={schoolOptions}
                                        placeholder="Select school (optional)"
                                        onChange={(e) => field.onChange(e.value)}
                                        value={field.value || ""}
                                        className={`w-full ${errors?.schoolId ? "p-invalid" : ""}`}
                                        showClear
                                        filter
                                        filterPlaceholder="Type to search..."
                                    />
                                )}
                            />
                            {errors.schoolId && <small className="p-error">{(errors.schoolId as any).message}</small>}
                        </div>
                    ) : (
                        sessionSchoolId && (
                            <div className="p-field">
                                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                                <div className="p-inputgroup">
                                    <InputText value={schoolOptions.find((s: any) => s.value === sessionSchoolId)?.label ?? sessionSchoolId} readOnly />
                                </div>
                            </div>
                        )
                    )}

                    {/* Session */}
                    <div className="p-field">
                        <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                        <InputText id="session" placeholder="Enter session" {...register("session" as any)} className={errors.session ? "p-invalid w-full" : "w-full"} />
                        {errors.session && <small className="p-error">{errors.session.message}</small>}
                    </div>

                    {/* Term */}
                    <div className="p-field">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                        <Controller
                            name="term"
                            control={control}
                            render={({ field }) => (
                                <Dropdown id="term" {...field} options={termOptions} placeholder="Select a term" onChange={(e) => field.onChange(e.value)} value={field.value || ""} className={errors.term ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.term && <small className="p-error">{errors.term.message}</small>}
                    </div>

                    {/* Start */}
                    <div className="p-field">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                        <Controller
                            name="start"
                            control={control}
                            render={({ field }) => (
                                <Calendar id="start" value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon placeholder="Term start date" className={errors.start ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.start && <small className="p-error">{errors.start.message}</small>}
                    </div>

                    {/* End */}
                    <div className="p-field">
                        <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                        <Controller
                            name="end"
                            control={control}
                            render={({ field }) => (
                                <Calendar id="end" value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon placeholder="Term end date" className={errors.end ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.end && <small className="p-error">{errors.end.message}</small>}
                    </div>

                    {/* Next Term Begins */}
                    <div className="p-field">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Next Term Begins</label>
                        <Controller
                            name="nextterm"
                            control={control}
                            render={({ field }) => (
                                <Calendar id="nextterm" value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon placeholder="Next term date" className={errors.nextterm ? "p-invalid w-full" : "w-full"} />
                            )}
                        />
                        {errors.nextterm && <small className="p-error">{errors.nextterm.message}</small>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={() => { reset(); router.back(); }} />
                        <Button label="Update" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default EditTerm;
