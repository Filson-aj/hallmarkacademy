// components/NewSchool.tsx
"use client";

import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { schoolSchema, SchoolSchema } from "@/lib/schemas";
import FileUploader from "@/components/FileUploader/FileUploader";

interface NewSchoolProps {
    close: () => void;
    onCreated: () => void;
}

const schoolTypeOptions = [
    { label: "Nursery", value: "NURSERY" },
    { label: "Nursery/Primary", value: "NURSERY/Primary" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Junior Secondary", value: "JUNIOR" },
    { label: "Secondary", value: "SECONDARY" },
];

export default function NewSchool({ close, onCreated }: NewSchoolProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SchoolSchema>({
        resolver: zodResolver(schoolSchema),
        mode: "onBlur",
    });

    const show = (
        severity: "success" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    interface ApiResponse {
        ok: boolean;
        message: string;
        data?: unknown;
    }

    const onSubmit = async (data: SchoolSchema) => {
        if (!logoUrl) {
            show("error", "Upload Error", "Logo is required, Please upload logo!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...data,
                logo: logoUrl,
            };

            const response = await fetch("/api/schools", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();
            if (response.ok) {
                show("success", "School Created", "The school record has been created successfully.");
                setTimeout(() => {
                    reset();
                    setLogoUrl(null);
                    close();
                    onCreated();
                }, 3000);
            } else {
                show("error", "Creation Error", result.message || "Failed to create school record, please try again.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create school record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New School"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />

            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                {/* Logo Upload */}
                <div className="p-field">
                    <label>Logo *</label>
                    <FileUploader
                        dropboxFolder="/hallmark"
                        chooseLabel={logoUrl ? "Change Logo" : "Upload Logo"}
                        onUploadSuccess={(meta) => setLogoUrl((meta as any).path_lower || (meta as any).id)}
                    />
                    {!logoUrl && <small className="p-error">Logo is required</small>}
                </div>

                {/* Name */}
                <div className="p-field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="name"
                        {...register("name")}
                        className={errors.name ? "p-invalid" : ""}
                    />
                    {errors.name && <small className="p-error">{errors.name.message}</small>}
                </div>

                {/* Subtitle */}
                <div className="p-field">
                    <label htmlFor="subtitle">Subtitle</label>
                    <InputText
                        id="subtitle"
                        {...register("subtitle")}
                        className={errors.subtitle ? "p-invalid" : ""}
                    />
                    {errors.subtitle && (
                        <small className="p-error">{errors.subtitle.message}</small>
                    )}
                </div>

                {/* School Type */}
                <div className="p-field">
                    <label>School Type</label>
                    <Controller
                        name="schooltype"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                {...field}
                                options={schoolTypeOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select a type"
                                className={errors.schooltype ? "p-invalid" : ""}
                            />
                        )}
                    />
                    {errors.schooltype && (
                        <small className="p-error">{errors.schooltype.message}</small>
                    )}
                </div>

                {/* Email */}
                <div className="p-field">
                    <label>Email</label>
                    <InputText
                        type="email"
                        {...register("email")}
                        className={errors.email ? "p-invalid" : ""}
                    />
                    {errors.email && <small className="p-error">{errors.email.message}</small>}
                </div>

                {/* Phone */}
                <div className="p-field">
                    <label>Phone</label>
                    <InputText
                        {...register("phone")}
                        className={errors.phone ? "p-invalid" : ""}
                    />
                    {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                </div>

                {/* Address */}
                <div className="p-field">
                    <label>Address</label>
                    <InputTextarea
                        {...register("address")}
                        className={errors.address ? "p-invalid" : ""}
                    />
                    {errors.address && (
                        <small className="p-error">{errors.address.message}</small>
                    )}
                </div>

                {/* Contact Person */}
                <div className="p-field">
                    <label>Contact Person</label>
                    <InputText
                        {...register("contactperson")}
                        className={errors.contactperson ? "p-invalid" : ""}
                    />
                    {errors.contactperson && (
                        <small className="p-error">{errors.contactperson.message}</small>
                    )}
                </div>

                {/* Contact Person Phone */}
                <div className="p-field">
                    <label>Contact Person Phone</label>
                    <InputText
                        {...register("contactpersonphone")}
                        className={errors.contactpersonphone ? "p-invalid" : ""}
                    />
                    {errors.contactpersonphone && (
                        <small className="p-error">{errors.contactpersonphone.message}</small>
                    )}
                </div>

                {/* Contact Person Email */}
                <div className="p-field">
                    <label>Contact Person Email</label>
                    <InputText
                        type="email"
                        {...register("contactpersonemail")}
                        className={errors.contactpersonemail ? "p-invalid" : ""}
                    />
                    {errors.contactpersonemail && (
                        <small className="p-error">{errors.contactpersonemail.message}</small>
                    )}
                </div>

                {/* YouTube */}
                <div className="p-field">
                    <label>YouTube URL</label>
                    <InputText
                        {...register("youtube")}
                        className={errors.youtube ? "p-invalid" : ""}
                    />
                    {errors.youtube && <small className="p-error">{errors.youtube.message}</small>}
                </div>

                {/* Facebook */}
                <div className="p-field">
                    <label>Facebook URL</label>
                    <InputText
                        {...register("facebook")}
                        className={errors.facebook ? "p-invalid" : ""}
                    />
                    {errors.facebook && (
                        <small className="p-error">{errors.facebook.message}</small>
                    )}
                </div>

                {/* Reg. No. Count */}
                <div className="p-field">
                    <label>Reg. No. Count</label>
                    <InputText
                        type="number"
                        {...register("regnumbercount", { valueAsNumber: true })}
                        className={errors.regnumbercount ? "p-invalid" : ""}
                    />
                    {errors.regnumbercount && (
                        <small className="p-error">{errors.regnumbercount.message}</small>
                    )}
                </div>

                {/* Registration Number Prepend */}
                <div className="p-field">
                    <label htmlFor="regnumberprepend">Reg. No. Prefix</label>
                    <InputText
                        id="regnumberprepend"
                        {...register("regnumberprepend")}
                        className={errors.regnumberprepend ? "p-invalid" : ""}
                    />
                    {errors.regnumberprepend && (
                        <small className="p-error">{errors.regnumberprepend.message}</small>
                    )}
                </div>

                {/* Registration Number Append */}
                <div className="p-field">
                    <label htmlFor="regnumberappend">Reg. No. Suffix</label>
                    <InputText
                        id="regnumberappend"
                        {...register("regnumberappend")}
                        className={errors.regnumberappend ? "p-invalid" : ""}
                    />
                    {errors.regnumberappend && (
                        <small className="p-error">{errors.regnumberappend.message}</small>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                    <Button label="Cancel" type="button" outlined onClick={close} />
                    <Button
                        label="Save"
                        type="submit"
                        className="p-button-primary"
                        loading={loading}
                    />
                </div>
            </form>
        </Dialog>
    );
}
