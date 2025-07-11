"use client";

import React, { useRef, useState, } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";

import { schoolSchema, SchoolSchema } from "@/lib/schemas";

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

const NewSchool: React.FC<NewSchoolProps> = ({ close, onCreated }) => {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);

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

    const show = (severity: 'success' | 'error', summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    interface ApiResponse {
        ok: boolean;
        message: string;
        data?: unknown;
    }

    interface OnSubmitData {
        [key: string]: string | number | null | undefined;
    }

    const onSubmit = async (data: OnSubmitData): Promise<void> => {
        if (!file) {
            show("error", "Upload Error", "Logo is required");
            return;
        }
        try {
            setLoading(true);
            const fd = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (value != null) fd.append(key, String(value));
            });
            if (file) {
                fd.append("logo", file, file.name);
            }
            const response: Response = await fetch("/api/schools", {
                method: "POST",
                body: fd,
            });
            const result: ApiResponse = await response.json();
            if (response.ok) {
                show("success", "School Created", "The school has been created successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    setFile(null);
                    onCreated();
                }, 3000);
            } else {
                console.error("API Error:", result);
                show("error", "Creation Failed", result.message || "An error occurred while creating the school.");
            }
        } catch (error) {
            console.error("Error creating school:", error);
            show("error", "Creation Failed", "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header={"Add New School"}
            visible
            onHide={close}
            style={{ width: "50vw" }}
        >
            <Toast ref={toast} />

            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                {/* Logo Upload */}
                <div className="p-field">
                    <label>Logo *</label>
                    <FileUpload
                        mode="basic"
                        accept="image/*"
                        maxFileSize={5 * 1024 * 1024}
                        auto
                        customUpload
                        uploadHandler={({ files }) => setFile(files[0])}
                        onClear={() => setFile(null)}
                        className="w-full"
                        chooseLabel={file ? "Change Logo" : "Upload Logo"}
                    />
                    {!file && <small className="p-error">Logo is required</small>}
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
                    {errors.subtitle && <small className="p-error">{errors.subtitle.message}</small>}
                </div>

                {/* School Type */}
                <div className="p-field">
                    <label htmlFor="schooltype">School Type</label>
                    <Controller
                        name="schooltype"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="schooltype"
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
                    <label htmlFor="email">Email</label>
                    <InputText
                        id="email"
                        type="email"
                        {...register("email")}
                        className={errors.email ? "p-invalid" : ""}
                    />
                    {errors.email && <small className="p-error">{errors.email.message}</small>}
                </div>

                {/* Phone */}
                <div className="p-field">
                    <label htmlFor="phone">Phone</label>
                    <InputText
                        id="phone"
                        {...register("phone")}
                        className={errors.phone ? "p-invalid" : ""}
                    />
                    {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                </div>

                {/* Address */}
                <div className="p-field">
                    <label htmlFor="address">Address</label>
                    <InputTextarea
                        id="address"
                        {...register("address")}
                        className={errors.address ? "p-invalid" : ""}
                    />
                    {errors.address && <small className="p-error">{errors.address.message}</small>}
                </div>

                {/* Contact Person */}
                <div className="p-field">
                    <label htmlFor="contactperson">Contact Person</label>
                    <InputText
                        id="contactperson"
                        {...register("contactperson")}
                        className={errors.contactperson ? "p-invalid" : ""}
                    />
                    {errors.contactperson && (
                        <small className="p-error">{errors.contactperson.message}</small>
                    )}
                </div>

                {/* Contact Person Phone */}
                <div className="p-field">
                    <label htmlFor="contactpersonphone">Contact Person Phone</label>
                    <InputText
                        id="contactpersonphone"
                        {...register("contactpersonphone")}
                        className={errors.contactpersonphone ? "p-invalid" : ""}
                    />
                    {errors.contactpersonphone && (
                        <small className="p-error">{errors.contactpersonphone.message}</small>
                    )}
                </div>

                {/* Contact Person Email */}
                <div className="p-field">
                    <label htmlFor="contactpersonemail">Contact Person Email</label>
                    <InputText
                        id="contactpersonemail"
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
                    <label htmlFor="youtube">YouTube URL</label>
                    <InputText
                        id="youtube"
                        {...register("youtube")}
                        className={errors.youtube ? "p-invalid" : ""}
                    />
                    {errors.youtube && <small className="p-error">{errors.youtube.message}</small>}
                </div>

                {/* Facebook */}
                <div className="p-field">
                    <label htmlFor="facebook">Facebook URL</label>
                    <InputText
                        id="facebook"
                        {...register("facebook")}
                        className={errors.facebook ? "p-invalid" : ""}
                    />
                    {errors.facebook && <small className="p-error">{errors.facebook.message}</small>}
                </div>

                {/* Registration Number Count */}
                <div className="p-field">
                    <label htmlFor="regnumbercount">Reg. No. Count</label>
                    <InputText
                        id="regnumbercount"
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
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
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
                        disabled={loading || !file}
                    />
                </div>
            </form>
        </Dialog>
    );
};

export default NewSchool;
