// components/NewSchool.tsx
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import Uploader from "@/components/Uploader/Uploader";

import { schoolSchema, SchoolSchema } from "@/lib/schemas";
import Spinner from "@/components/Spinner/Spinner";
import { useCreateSchool } from "@/hooks/useSchools";

const schoolTypeOptions = [
    { label: "Nursery", value: "NURSERY" },
    { label: "Nursery/Primary", value: "NURSERY/PRIMARY" },
    { label: "Primary", value: "PRIMARY" },
    { label: "Secondary", value: "SECONDARY" },
];

const NewSchool: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState<{ path: string; id: string; url?: string | null } | null>(null);

    const createSchool = useCreateSchool();

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SchoolSchema>({
        resolver: zodResolver(schoolSchema),
        mode: "onBlur",
        defaultValues: {
            name: "",
            subtitle: "",
            schooltype: "",
            email: "",
            phone: "",
            address: "",
            logo: "",
            contactperson: "",
            contactpersonphone: "",
            contactpersonemail: "",
            youtube: "",
            facebook: "",
            regnumbercount: 1, // number default
            regnumberprepend: "",
            regnumberappend: "",
        },
    });

    // Helper to show toast
    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    // Back handler
    const handleBack = () => {
        router.back();
    };

    // Submit
    const onSubmit = async (data: SchoolSchema) => {
        if (!uploaded?.path) {
            show("error", "Upload Required", "Please upload a school logo.");
            return;
        }
        setLoading(true);
        try {
            const payload: SchoolSchema = {
                ...data,
                logo: uploaded.path,
            };

            await createSchool.mutateAsync(payload as any);

            show("success", "School Created", "New school has been created successfully.");
            setTimeout(() => {
                reset();
                setUploaded(null);
                handleBack();
            }, 1200);
        } catch (err: any) {
            show("error", "Creation Error", err?.message || "Failed to create school.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="w-[90%] bg-white mx-auto my-4 rounded-md shadow-md">
            <Toast ref={toast} />
            {loading && <Spinner visible onHide={() => setLoading(false)} />}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 p-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900/80">Create New School</h2>
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
                    {/* Logo Uploader */}
                    <div className="p-field">
                        <Uploader
                            onUploadSuccess={(meta) => setUploaded(meta)}
                            chooseLabel="Drag & Drop or Click to Upload School Logo"
                            dropboxFolder="/hallmark"
                        />
                        {!uploaded && <small className="p-error">Logo is required</small>}
                    </div>

                    {/* Name */}
                    <div className="p-field">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            School Name
                        </label>
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="name"
                                    placeholder="Enter school name"
                                    className={`w-full ${errors.name ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.name && <small className="p-error">{errors.name.message}</small>}
                    </div>

                    {/* Subtitle */}
                    <div className="p-field">
                        <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                            Subtitle (Optional)
                        </label>
                        <Controller
                            name="subtitle"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="subtitle"
                                    placeholder="e.g. Excellence in Education"
                                    className={`w-full ${errors.subtitle ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.subtitle && <small className="p-error">{errors.subtitle.message}</small>}
                    </div>

                    {/* School Type */}
                    <div className="p-field">
                        <label htmlFor="schooltype" className="block text-sm font-medium text-gray-700 mb-1">
                            School Type
                        </label>
                        <Controller
                            name="schooltype"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="schooltype"
                                    {...field}
                                    options={schoolTypeOptions}
                                    placeholder="Select school type"
                                    className={`w-full ${errors.schooltype ? "p-invalid" : ""}`}
                                    onChange={(e) => field.onChange(e.value)}
                                    value={field.value || ""}
                                    showClear
                                />
                            )}
                        />
                        {errors.schooltype && <small className="p-error">{errors.schooltype.message}</small>}
                    </div>

                    {/* Email */}
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
                                    placeholder="school@example.com"
                                    className={`w-full ${errors.email ? "p-invalid" : ""}`}
                                    autoComplete="email"
                                />
                            )}
                        />
                        {errors.email && <small className="p-error">{errors.email.message}</small>}
                    </div>

                    {/* Phone */}
                    <div className="p-field">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Phone (Optional)
                        </label>
                        <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="phone"
                                    placeholder="+234 000 000 0000"
                                    className={`w-full ${errors.phone ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                    </div>

                    {/* Address */}
                    <div className="p-field">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <Controller
                            name="address"
                            control={control}
                            render={({ field }) => (
                                <InputTextarea
                                    {...field}
                                    id="address"
                                    rows={3}
                                    placeholder="Full physical address"
                                    className={`w-full ${errors.address ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.address && <small className="p-error">{errors.address.message}</small>}
                    </div>

                    {/* Contact Person */}
                    <div className="p-field">
                        <label htmlFor="contactperson" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Person (Optional)
                        </label>
                        <Controller
                            name="contactperson"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="contactperson"
                                    placeholder="e.g. Dr. Jane Doe"
                                    className={`w-full ${errors.contactperson ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.contactperson && <small className="p-error">{errors.contactperson.message}</small>}
                    </div>

                    {/* Contact Person Phone */}
                    <div className="p-field">
                        <label htmlFor="contactpersonphone" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Phone (Optional)
                        </label>
                        <Controller
                            name="contactpersonphone"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="contactpersonphone"
                                    placeholder="+234 000 000 0000"
                                    className={`w-full ${errors.contactpersonphone ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.contactpersonphone && <small className="p-error">{errors.contactpersonphone.message}</small>}
                    </div>

                    {/* Contact Person Email */}
                    <div className="p-field">
                        <label htmlFor="contactpersonemail" className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Email (Optional)
                        </label>
                        <Controller
                            name="contactpersonemail"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="contactpersonemail"
                                    type="email"
                                    placeholder="contact@school.com"
                                    className={`w-full ${errors.contactpersonemail ? "p-invalid" : ""}`}
                                    autoComplete="email"
                                />
                            )}
                        />
                        {errors.contactpersonemail && <small className="p-error">{errors.contactpersonemail.message}</small>}
                    </div>

                    {/* YouTube */}
                    <div className="p-field">
                        <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-1">
                            YouTube URL (Optional)
                        </label>
                        <Controller
                            name="youtube"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="youtube"
                                    placeholder="https://youtube.com/@school"
                                    className={`w-full ${errors.youtube ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.youtube && <small className="p-error">{errors.youtube.message}</small>}
                    </div>

                    {/* Facebook */}
                    <div className="p-field">
                        <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">
                            Facebook URL (Optional)
                        </label>
                        <Controller
                            name="facebook"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="facebook"
                                    placeholder="https://facebook.com/school"
                                    className={`w-full ${errors.facebook ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.facebook && <small className="p-error">{errors.facebook.message}</small>}
                    </div>

                    {/* Reg No. Count (use InputNumber to handle numeric values) */}
                    <div className="p-field">
                        <label htmlFor="regnumbercount" className="block text-sm font-medium text-gray-700 mb-1">
                            Reg. No. Count
                        </label>
                        <Controller
                            name="regnumbercount"
                            control={control}
                            render={({ field }) => (
                                <InputNumber
                                    id="regnumbercount"
                                    value={field.value ?? 1}
                                    onValueChange={(e) => field.onChange(e.value ?? 1)}
                                    mode="decimal"
                                    min={1}
                                    placeholder="1"
                                    className={`w-full ${errors.regnumbercount ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.regnumbercount && <small className="p-error">{errors.regnumbercount.message}</small>}
                    </div>

                    {/* Reg No. Prefix */}
                    <div className="p-field">
                        <label htmlFor="regnumberprepend" className="block text-sm font-medium text-gray-700 mb-1">
                            Reg. No. Prefix (Optional)
                        </label>
                        <Controller
                            name="regnumberprepend"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="regnumberprepend"
                                    placeholder="e.g. HMS/"
                                    className={`w-full ${errors.regnumberprepend ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.regnumberprepend && <small className="p-error">{errors.regnumberprepend.message}</small>}
                    </div>

                    {/* Reg No. Suffix */}
                    <div className="p-field">
                        <label htmlFor="regnumberappend" className="block text-sm font-medium text-gray-700 mb-1">
                            Reg. No. Suffix (Optional)
                        </label>
                        <Controller
                            name="regnumberappend"
                            control={control}
                            render={({ field }) => (
                                <InputText
                                    {...field}
                                    id="regnumberappend"
                                    placeholder="e.g. /2025"
                                    className={`w-full ${errors.regnumberappend ? "p-invalid" : ""}`}
                                />
                            )}
                        />
                        {errors.regnumberappend && <small className="p-error">{errors.regnumberappend.message}</small>}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                        <Button label="Cancel" type="button" outlined onClick={handleBack} />
                        <Button
                            label="Create School"
                            type="submit"
                            className="p-button-primary"
                            loading={loading || createSchool.isPending}
                            disabled={loading || createSchool.isPending}
                        />
                    </div>
                </form>
            </div>
        </section>
    );
};

export default NewSchool;
