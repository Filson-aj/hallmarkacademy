"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Uploader from "@/components/Uploader/Uploader";

import { administrationSchema, AdministrationSchema } from "@/lib/schemas/index";
import Spinner from "@/components/Spinner/Spinner";

type Option = { label: string; value: string };

const NewAdmin: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState<{ path: string; id: string; url?: string | null } | null>(null);
    const [schools, setSchools] = useState<Option[]>([]);
    const { data: session } = useSession();

    const role = (session?.user?.role as string) || "Guest";

    // Define role options based on current user's role
    const roleOptions: Option[] =
        role.toLowerCase() === "super"
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
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<AdministrationSchema>({
        resolver: zodResolver(administrationSchema),
        mode: "onBlur",
        defaultValues: {
            email: "",
            username: "",
            role: "Admin",
            password: "password",
            schoolId: "",
            avatar: "",
        },
    });

    useEffect(() => {
        const ac = new AbortController();
        const fetchSchools = async () => {
            try {
                const res = await fetch("/api/schools", { signal: ac.signal });
                if (!res.ok) throw new Error(`Server returned ${res.status}`);
                const json = await res.json();
                const opts: Option[] = (json?.data || []).map((s: any) => ({ label: s.name, value: s.id }));
                setSchools(opts);
            } catch (err: any) {
                if (err?.name === "AbortError") return;
                console.error("Error fetching schools:", err);
                toast.current?.show({
                    severity: "error",
                    summary: "Failed to Load Schools",
                    detail: err?.message || "Unable to load schools",
                    life: 3000,
                });
            }
        };
        fetchSchools();
        return () => ac.abort();
    }, []);

    // Helper to show toast
    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    // Back handler
    const handleBack = () => {
        router.back();
    };

    // Submit
    const onSubmit = async (data: AdministrationSchema) => {
        setLoading(true);
        try {
            const payload: any = {
                ...data,
                avarta: uploaded ? uploaded.path : null,
                schoolId: data.schoolId || null,
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
                    router.back();
                }, 1200);
            } else {
                show("error", "Creation Error", result.error || result.message || "Failed to create admin.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err?.message || "An error occurred while creating admin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-[90%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {loading && <Spinner visible onHide={() => setLoading(false)} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 p-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80">Create New System Administrator</h2>
                <div className="hidden sm:flex gap-2">
                    <Button
                        label="Back"
                        icon="pi pi-arrow-left"
                        onClick={handleBack}
                        className="bg-red-600 text-white rounded-lg text-sm sm:text-base border border-red-600 inline-flex items-center gap-2 py-2 px-3 hover:bg-red-700 hover:border-red-700 transition-all duration-200"
                    />
                </div>
            </div>

            <div className="space-y-4 p-4">
                <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                    {/* Uploader for profile picture (same as earlier page) */}
                    <div className="p-field">
                        <Uploader
                            onUploadSuccess={(meta) => setUploaded(meta)}
                            chooseLabel="Drag & Drop or Click to Upload Profile Picture"
                            dropboxFolder="/hallmark"
                        />
                        {uploaded && <div className="mt-2 text-sm text-gray-600">Uploaded: {uploaded.path}</div>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="email"
                                    type="email"
                                    placeholder="Enter email address"
                                    className={`w-full ${errors.email ? "p-invalid" : ""}`}
                                    autoComplete="email"
                                />
                            )}
                        />
                        {errors.email && <small className="p-error">{errors.email.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="username"
                                    type="text"
                                    placeholder="Enter username"
                                    className={`w-full ${errors.username ? "p-invalid" : ""}`}
                                    autoComplete="username"
                                />
                            )}
                        />
                        {errors.username && <small className="p-error">{errors.username.message}</small>}
                    </div>

                    <div className="p-field">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                            Role
                        </label>
                        <Controller
                            name="role"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="role"
                                    {...field}
                                    options={roleOptions}
                                    placeholder="Select Role"
                                    className={`${errors.role ? "p-invalid w-full" : "w-full"}`}
                                    onChange={(e) => field.onChange(e.value)}
                                    value={field.value || ""}
                                    filter
                                    showClear
                                />
                            )}
                        />
                        {errors.role && <small className="p-error">{errors.role.message}</small>}
                    </div>

                    {/* -- FIX POINT: replaced simple text input with a searchable Dropdown that fetches schools -- */}
                    {role.toLowerCase() === "super" && (
                        <div className="p-field">
                            <label htmlFor="schoolId" className="block text-sm font-medium text-gray-700 mb-1">
                                School
                            </label>
                            <Controller
                                name="schoolId"
                                control={control}
                                render={({ field }) => (
                                    <Dropdown
                                        id="schoolId"
                                        {...field}
                                        options={schools}
                                        placeholder="Search & select School"
                                        className={`${errors.schoolId ? "p-invalid w-full" : "w-full"}`}
                                        onChange={(e) => field.onChange(e.value)}
                                        value={field.value || ""}
                                        filter
                                        showClear
                                        filterPlaceholder="Type to search..."
                                    />
                                )}
                            />
                            {errors.schoolId && <small className="p-error">{(errors.schoolId as any).message}</small>}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button label="Save" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default NewAdmin;
