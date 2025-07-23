// components/EditClass.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";

import { classSchema, ClassSchema } from "@/lib/schemas";

interface EditClassProps {
    close: () => void;
    onUpdated: (updated: any) => void;
    classData: ClassSchema & { id: string };
}

const levelsOptions = [
    { label: "PRE-NURSERY", value: "PRE-NURSERY" },
    { label: "NURSERY", value: "NURSERY" },
    { label: "PRIMARY", value: "PRIMARY" },
    { label: "JSS", value: "JSS" },
    { label: "SSS", value: "SSS" },
];
const categoryOptions = [
    { label: "Bronze", value: "Bronze" },
    { label: "Diamond", value: "Diamond" },
    { label: "Gold", value: "Gold" },
    { label: "Platinum", value: "Platinum" },
    { label: "Silver", value: "Silver" },
];

export default function EditClass({ close, onUpdated, classData }: EditClassProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [teachers, setTeachers] = useState<{ label: string; value: string }[]>([]);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ClassSchema>({
        resolver: zodResolver(classSchema),
        mode: "onBlur",
        defaultValues: {
            name: classData.name,
            level: classData.level,
            category: classData.category,
            capacity: classData.capacity ?? undefined,
            formmasterid: classData.formmasterid ?? "",
        },
    });

    useEffect(() => {
        async function fetchTeachers() {
            try {
                const res = await fetch("/api/teachers");
                if (!res.ok) throw new Error("Failed to load teachers");
                const { data } = await res.json();
                const formatted = data.map((t: any) => ({
                    label: `${t.title || ""} ${t.firstname} ${t.othername} ${t.surname}`.trim(),
                    value: t.id,
                }));
                setTeachers(formatted);
            } catch (err) {
                console.error(err);
                toast.current?.show({
                    severity: "error",
                    summary: "Load Error",
                    detail: "Could not fetch teachers",
                    life: 3000,
                });
            }
        }
        fetchTeachers();
    }, []);

    const show = (
        severity: "success" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data: ClassSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
            };

            const res = await fetch(`/api/classes/${classData.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();

            if (res.ok) {
                show("success", "Class Updated", "Class details have been updated.");
                setTimeout(() => {
                    reset(data);
                    close();
                    onUpdated(result);
                }, 1500);
            } else {
                show("error", "Update Failed", result.message || "Something went wrong");
            }
        } catch (err: any) {
            console.error(err);
            show("error", "Update Failed", err.message || "Unexpected error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Edit Class"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "80vw" }}
        >
            <Toast ref={toast} />

            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                <div className="p-field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        placeholder="Enter name"
                        {...register("name")}
                        className={errors.name ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.name && <small className="p-error">{errors.name.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="level">Class Level</label>
                    <Controller
                        name="level"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="level"
                                {...field}
                                options={levelsOptions}
                                placeholder="Select Class Level"
                                className={errors.level ? "p-invalid w-full" : "w-full"}
                            />
                        )}
                    />
                    {errors.level && <small className="p-error">{errors.level.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="category">Class Category</label>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="category"
                                {...field}
                                options={categoryOptions}
                                placeholder="Select Class Category"
                                className={errors.category ? "p-invalid w-full" : "w-full"}
                            />
                        )}
                    />
                    {errors.category && <small className="p-error">{errors.category.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="capacity">Capacity</label>
                    <InputText
                        id="capacity"
                        type="number"
                        placeholder="Enter capacity"
                        {...register("capacity", { valueAsNumber: true })}
                        className={errors.capacity ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.capacity && <small className="p-error">{errors.capacity.message}</small>}
                </div>

                <div className="p-field">
                    <label htmlFor="formmasterid">Form Master</label>
                    <Controller
                        name="formmasterid"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="formmasterid"
                                {...field}
                                options={teachers}
                                placeholder="Select Form Master"
                                className={errors.formmasterid ? "p-invalid w-full" : "w-full"}
                            />
                        )}
                    />
                    {errors.formmasterid && <small className="p-error">{errors.formmasterid.message}</small>}
                </div>

                <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
                    <Button label="Cancel" type="button" outlined onClick={close} />
                    <Button label="Update" type="submit" className="p-button-primary" loading={loading} />
                </div>
            </form>
        </Dialog>
    );
}
