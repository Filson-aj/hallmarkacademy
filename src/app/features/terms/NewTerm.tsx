"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useCreateTerm } from "@/hooks/useTerms";
import { useSchools } from "@/hooks/useSchools";
import { useQueryClient } from "@tanstack/react-query";
import type { Term } from "@/generated/prisma";

const termOptions = [
    { label: "First", value: "First" },
    { label: "Second", value: "Second" },
    { label: "Third", value: "Third" },
];

const NewTerm: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast | null>(null);
    const { data: session } = useSession();
    const queryClient = useQueryClient();

    const createTerm = useCreateTerm();
    const { data: schoolsData, isPending: schoolsLoading, error: schoolsError } = useSchools();

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

    useEffect(() => {
        if (viewerRole !== "super" && sessionSchoolId) {
            setValue("schoolId" as any, sessionSchoolId as any);
        }
    }, [viewerRole, sessionSchoolId, setValue]);

    // Notification helper
    const show = (severity: "success" | "error" | "info" | "warn", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

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
        };
    };

    // Submit handler
    const onSubmit = async (data: TermSchema) => {
        setLocalLoading(true);

        // Build server payload
        const payload = buildPayload(data);

        // Create term
        const tempId = `temp-${Date.now()}`;
        const optimisticTerm: Term = {
            id: tempId,
            session: payload.session ?? "",
            term: (payload.term as any) ?? "First",
            start: payload.start ? new Date(payload.start) : new Date(),
            end: payload.end ? new Date(payload.end) : new Date(),
            nextTerm: payload.nextterm ? new Date(payload.nextterm) : null,
            daysOpen: (payload.daysopen as any) ?? 0,
            status: (payload.status as any) ?? "Active",
            schoolId: (payload.schoolId as any) ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;

        // Snapshot previous cache to rollback if needed
        const previousTerms = queryClient.getQueryData<Term[]>(["terms"]) ?? [];
        const previousBySchool = queryClient.getQueryData<Term[]>(["terms", "bySchool", payload.schoolId ?? ""]) ?? null;

        try {
            queryClient.setQueryData<Term[]>(["terms"], (old = []) => [optimisticTerm, ...old]);
            if (payload.schoolId) {
                queryClient.setQueryData<Term[]>(["terms", "bySchool", payload.schoolId], (old = []) => [
                    optimisticTerm,
                    ...old,
                ]);
            }
            // seed per-id cache
            queryClient.setQueryData<Term>(["terms", optimisticTerm.id], optimisticTerm);

            // call server
            const created = await createTerm.mutateAsync(payload as any);

            // Replace optimistic entry with server response:
            queryClient.setQueryData<Term[]>(["terms"], (old = []) =>
                old.map((t) => (t.id === tempId ? created : t))
            );

            if (created?.id && payload.schoolId) {
                queryClient.setQueryData<Term[]>(["terms", "bySchool", payload.schoolId], (old = []) =>
                    old.map((t) => (t.id === tempId ? created : t))
                );
            }

            // Set canonical single-term cache
            if (created?.id) queryClient.setQueryData(["terms", created.id], created);

            // Invalidate list queries to be sure everything is in sync server-side
            queryClient.invalidateQueries({ queryKey: ["terms"] });
            if (payload.schoolId) queryClient.invalidateQueries({ queryKey: ["terms", "bySchool", payload.schoolId] });

            show("success", "Term Created", "The term has been created successfully.");
            reset();
            setTimeout(() => router.back(), 900);
        } catch (err: any) {
            // rollback
            queryClient.setQueryData(["terms"], previousTerms);
            if (payload.schoolId && previousBySchool) {
                queryClient.setQueryData(["terms", "bySchool", payload.schoolId], previousBySchool);
            }
            queryClient.setQueryData(["terms", tempId], undefined);

            show("error", "Creation Error", err?.message || "Could not create term record.");
        } finally {
            setLocalLoading(false);
        }
    };

    const loading = localLoading || createTerm.isPending;

    useEffect(() => {
        if (schoolsError) {
            show("error", "Failed to load schools", (schoolsError as any)?.message || "Unable to load schools");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schoolsError]);

    // options for schools dropdown
    const schoolOptions = (schoolsData ?? []).map((s: any) => ({ label: s.name, value: s.id }));

    if (schoolsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <section className="w-[90%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {loading && <Spinner visible onHide={() => setLocalLoading(false)} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 p-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80">Create New Term</h2>
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
                    {/* School: shown for SUPER; auto-set for MANAGEMENT/ADMIN */}
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
                        // show the assigned school as read-only text (optional)
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
                                <Dropdown
                                    id="term"
                                    {...field}
                                    options={termOptions}
                                    placeholder="Select a term"
                                    onChange={(e) => field.onChange(e.value)}
                                    value={field.value || ""}
                                    className={errors.term ? "p-invalid w-full" : "w-full"}
                                />
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
                                <Calendar
                                    id="start"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    placeholder="Term start date"
                                    className={errors.start ? "p-invalid w-full" : "w-full"}
                                />
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
                                <Calendar
                                    id="end"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    placeholder="Term end date"
                                    className={errors.end ? "p-invalid w-full" : "w-full"}
                                />
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
                                <Calendar
                                    id="nextterm"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    showIcon
                                    placeholder="Next term date"
                                    className={errors.nextterm ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.nextterm && <small className="p-error">{errors.nextterm.message}</small>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={() => { reset(); router.back(); }} />
                        <Button label="Save" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                    </div>
                </form>
            </div>
        </section>
    );
}

export default NewTerm;
