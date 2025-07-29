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
import { administrationSchema, AdministrationSchema } from "@/lib/schemas";

interface NewAdminProps {
    close: () => void;
    onCreated: (created: any) => void;
}

interface Option {
    label: string;
    value: string;
}

export default function NewAdmin({ close, onCreated }: NewAdminProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<Option[]>([]);
    const { data: session } = useSession();

    const role = session?.user?.role || 'Guest';

    // Define role options based on current user's role
    const roleOptions = role.toLowerCase() === 'super'
        ? [
            { label: "Admin", value: "Admin" },
            { label: "Management", value: "Management" },
            { label: "Super", value: "Super" },
        ]
        : [
            { label: "Admin", value: "Admin" },
            { label: "Management", value: "Management" },
        ];

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AdministrationSchema>({
        resolver: zodResolver(administrationSchema),
        mode: "onBlur",
        defaultValues: {
            username: "",
            email: "",
            role: "Admin",
            schoolid: "",
        },
    });

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const res = await fetch('/api/schools');

                if (!res.ok) {
                    throw new Error(`Server returned ${res.status}`);
                }

                const json = await res.json();
                const schools: Option[] = (json?.data || []).map((s: any) => ({
                    label: s.name,
                    value: s.id,
                }));

                setSchools(schools);
            } catch (err) {
                console.error('Error fetching schools:', err);

                let message = 'Unknown error occurred.';
                if (err instanceof SyntaxError) {
                    message = 'Invalid response format.';
                } else if (err instanceof Error) {
                    message = err.message;
                }

                toast.current?.show({
                    severity: 'error',
                    summary: 'Failed to Load Schools',
                    detail: message,
                    life: 3000,
                });
            }
        };

        fetchSchools();
    }, []);

    const show = (
        severity: "success" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data: AdministrationSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                // Only include schoolid in payload if role is super
                ...(role.toLowerCase() !== 'super' ? { schoolid: undefined } : {}),
            };

            const res = await fetch("/api/admins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Admin Created", "New Admin has been created successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated(result);
                }, 1500);
            } else {
                show("error", "Creation Error", result.error || result.message || "Failed to create new admin record, please try again.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create new admin record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New Admin"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                <div className="p-field">
                    <label htmlFor="username">Username</label>
                    <InputText
                        id="username"
                        placeholder="Enter username"
                        {...register("username")}
                        className={errors.username ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.username && <small className="p-error">{errors.username.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="email">Email Address</label>
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <InputText
                                {...field}
                                id="email"
                                type="email"
                                placeholder="Enter email address"
                                className={errors.email ? 'p-invalid' : ''}
                                autoComplete="email"
                            />
                        )}
                    />
                    {errors.email && <small className="p-error">{errors.email.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="role">Admin Role</label>
                    <Controller
                        name="role"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="role"
                                {...field}
                                options={roleOptions}
                                placeholder="Select Role"
                                className={errors.role ? "p-invalid w-full" : "w-full"}
                                onChange={(e) => field.onChange(e.value)}
                                value={field.value || ""} // Ensure controlled value
                            />
                        )}
                    />
                    {errors.role && <small className="p-error">{errors.role.message}</small>}
                </div>

                {role.toLowerCase() === 'super' && (
                    <div className="p-field">
                        <label htmlFor="schoolid">School</label>
                        <Controller
                            name="schoolid"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="schoolid"
                                    {...field}
                                    options={schools}
                                    placeholder="Select School"
                                    className={errors.schoolid ? "p-invalid w-full" : "w-full"}
                                    onChange={(e) => field.onChange(e.value)}
                                    value={field.value || ""} // Ensure controlled value
                                />
                            )}
                        />
                        {errors.schoolid && <small className="p-error">{errors.schoolid.message}</small>}
                    </div>
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