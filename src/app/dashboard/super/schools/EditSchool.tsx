// components/EditSchool.tsx
"use client";

import React, { useRef, useState, useEffect } from "react";
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

interface EditSchoolProps {
  school: SchoolSchema & { id: string; logo?: string };
  close: () => void;
  onUpdated: (updated: any) => void;
}

const schoolTypeOptions = [
  { label: "Nursery", value: "NURSERY" },
  { label: "Nursery/Primary", value: "NURSERY/Primary" },
  { label: "Primary", value: "PRIMARY" },
  { label: "Junior Secondary", value: "JUNIOR" },
  { label: "Secondary", value: "SECONDARY" },
];

export default function EditSchool({ school, close, onUpdated }: EditSchoolProps) {
  const toast = useRef<Toast>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | undefined>(school.logo);

  const { register, control, handleSubmit, reset, formState: { errors } } =
    useForm<SchoolSchema>({
      resolver: zodResolver(schoolSchema),
      mode: "onBlur",
      defaultValues: {
        name: school.name,
        subtitle: school.subtitle ?? "",
        schooltype: school.schooltype,
        email: school.email,
        phone: school.phone ?? "",
        address: school.address,
        contactperson: school.contactperson ?? "",
        contactpersonphone: school.contactpersonphone ?? "",
        contactpersonemail: school.contactpersonemail ?? "",
        youtube: school.youtube ?? "",
        facebook: school.facebook ?? "",
        regnumbercount: school.regnumbercount,
        regnumberprepend: school.regnumberprepend ?? "",
        regnumberappend: school.regnumberappend ?? "",
      },
    });

  useEffect(() => {
    reset({
      ...school,
      subtitle: school.subtitle ?? "",
      phone: school.phone ?? "",
      contactperson: school.contactperson ?? "",
      contactpersonphone: school.contactpersonphone ?? "",
      contactpersonemail: school.contactpersonemail ?? "",
      youtube: school.youtube ?? "",
      facebook: school.facebook ?? "",
      regnumberprepend: school.regnumberprepend ?? "",
      regnumberappend: school.regnumberappend ?? "",
    });
    setLogoUrl(school.logo);
  }, [school, reset]);

  const show = (severity: "success" | "error", summary: string, detail: string) =>
    toast.current?.show({ severity, summary, detail, life: 3000 });

  const onSubmit = async (data: SchoolSchema) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        logo: logoUrl,
      };

      const res = await fetch(`/api/schools/${school.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        show("success", "Updated", "School updated successfully.");
        onUpdated(updated);
        close();
      } else {
        const err = await res.json().catch(() => ({}));
        show("error", "Updation Error", err.error || "Failed to update school record, please try again.");
      }
    } catch (error) {
      show("error", "Updation Error", "Could not update school record.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      header="Edit School"
      visible
      onHide={close}
      style={{ width: "50vw" }}
      breakpoints={{ "1024px": "70vw", "640px": "80vw" }}
    >
      <Toast ref={toast} />

      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
        {/* Logo Uploader */}
        <div className="p-field">
          <label>Logo</label>
          <FileUploader
            dropboxFolder="/hallmark"
            chooseLabel={logoUrl ? "Change Logo" : "Upload Logo"}
            onUploadSuccess={(meta) => {
              // The FileUploader returns metadata; use path_lower or id as URL
              setLogoUrl((meta as any).path_lower ?? (meta as any).id);
            }}
          />
          {logoUrl && (
            <small className="block mt-1 text-sm">
              Current logo:{" "}
              <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="underline">
                {logoUrl}
              </a>
            </small>
          )}
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
          {errors.address && (
            <small className="p-error">{errors.address.message}</small>
          )}
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
          {errors.facebook && (
            <small className="p-error">{errors.facebook.message}</small>
          )}
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

        {/* Reg. No. Prefix */}
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

        {/* Reg. No. Suffix */}
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
