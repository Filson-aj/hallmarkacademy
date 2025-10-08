"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { GradeSchema, gradeSchema } from "@/lib/schemas";

interface NewGradingProps {
    close: () => void;
    onCreated: (created: any) => void;
}

const termOptions = [
    { label: "First", value: "First" },
    { label: "Second", value: "Second" },
    { label: "Third", value: "Third" },
];

interface Option {
    label: string;
    value: string;
}

export default function NewGrading({ close, onCreated }: NewGradingProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [sessions, setSessions] = useState<Option[]>([]);
    const [schools, setSchools] = useState<Option[]>([]);
    const { data: session } = useSession();

    const role = session?.user?.role || 'Guest';

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<GradeSchema>({
        resolver: zodResolver(gradeSchema),
        mode: "onBlur",
    });

    useEffect(() => {
        async function fetchData() {
            // kick off both requests in parallel
            const [termsRes, schoolsRes] = await Promise.allSettled([
                fetch('/api/terms'),
                fetch('/api/schools'),
            ]);

            // --- Terms ---
            if (termsRes.status === 'fulfilled' && termsRes.value.ok) {
                try {
                    const { data } = await termsRes.value.json();
                    const formattedSessions: Option[] = (() => {
                        const seen = new Map<string, string>();

                        for (const t of data as any[]) {
                            const label = [t.session].filter(Boolean).join(" ");
                            if (!label) continue; // skip empty
                            if (!seen.has(label)) seen.set(label, label);
                        }

                        return Array.from(seen.entries()).map(([label, value]) => ({ label, value }));
                    })();
                    setSessions(formattedSessions);
                } catch {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Parsing Error',
                        detail: 'Terms response format invalid.',
                        life: 3000,
                    });
                }
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Fetching Error',
                    detail: 'Failed to load terms.',
                    life: 3000,
                });
            }

            // --- Schools ---
            if (schoolsRes.status === 'fulfilled' && schoolsRes.value.ok) {
                try {
                    const { data } = await schoolsRes.value.json();
                    const formattedSchools: Option[] = data.map((s: any) => ({
                        label: s.name,
                        value: s.id,
                    }));
                    setSchools(formattedSchools);
                } catch {
                    toast.current?.show({
                        severity: 'error',
                        summary: 'Parsing Error',
                        detail: 'Schools response format invalid.',
                        life: 3000,
                    });
                }
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Fetching Error',
                    detail: 'Failed to load schools.',
                    life: 3000,
                });
            }
        }

        fetchData().catch((err) => {
            console.error('Unexpected fetch error:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'An unexpected error occurred.',
                life: 3000,
            });
        });
    }, []);

    const show = (
        severity: "success" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data: GradeSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
            };

            const res = await fetch("/api/gradings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Grading Created", "New Grading has been created successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated(result);
                }, 1500);
            } else {
                show("error", "Creation Error", result.message || result.error || "Failed to create new grading record, please try again.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create new grading record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New Grading"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                <div className="p-field">
                    <label htmlFor="title">Title</label>
                    <InputText
                        id="title"
                        placeholder="Enter title"
                        {...register("title")}
                        className={errors.title ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.title && <small className="p-error">{errors.title.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="term">Grading Term</label>
                    <Controller
                        name="term"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <Dropdown
                                id="term"
                                {...field}
                                options={termOptions}
                                placeholder="Select Term"
                                className={errors.term ? "p-invalid w-full" : "w-full"}
                            />
                        )}
                    />
                    {errors.term && <small className="p-error">{errors.term.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="session">Grading Session</label>
                    <Controller
                        name="session"
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                            <Dropdown
                                id="session"
                                {...field}
                                options={sessions}
                                placeholder="Select Grading Session"
                                className={errors.session ? "p-invalid w-full" : "w-full"}
                            />
                        )}
                    />
                    {errors.session && <small className="p-error">{errors.session.message}</small>}
                </div>

                {role.toLocaleLowerCase() === 'super' && (
                    <div className="p-field">
                        <label htmlFor="schoolid">School</label>
                        <Controller
                            name="schoolid"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="schoolid"
                                    {...field}
                                    options={schools}
                                    placeholder="Select School"
                                    className={errors.schoolid ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.schoolid && <small className="p-error">{errors.schoolid.message}</small>}
                    </div>
                )}

                {(role === "admin" || role === "management" || role === "teacher") && (
                    <input type="hidden" {...register("schoolid")} value={'schoolid'} />
                )}

                <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                    <Button
                        label="Cancel"
                        type="button"
                        outlined
                        onClick={close}
                    />
                    <Button
                        label="Save"
                        type="submit"
                        className="p-button-primary"
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            </form>
        </Dialog>
    );
}
