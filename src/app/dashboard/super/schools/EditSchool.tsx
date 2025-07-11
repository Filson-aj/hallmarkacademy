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
import { FileUpload } from "primereact/fileupload";

import { schoolSchema, SchoolSchema } from "@/lib/schemas";

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

const EditSchool: React.FC<EditSchoolProps> = ({ school, close, onUpdated }) => {
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
    reset({ ...school });
  }, [school, reset]);

  const show = (
    severity: "success" | "error",
    summary: string,
    detail: string
  ) => toast.current?.show({ severity, summary, detail, life: 3000 });

  const onSubmit = async (data: SchoolSchema) => {
    try {
      setLoading(true);
      const fd = new FormData();
      // append all data
      Object.entries(data).forEach(([key, value]) => {
        if (value != null) fd.append(key, String(value));
      });
      // if new file selected
      if (file) fd.append("logo", file, file.name);

      const res = await fetch(`/api/schools/${school.id}`, {
        method: "PUT",
        body: fd,
      });

      if (res.ok) {
        const json = await res.json();
        show("success", "Updated", "School updated successfully.");
        onUpdated(json);
        close();
      } else {
        const err = await res.json().catch(() => ({}));
        show("error", "Update Failed", err.error || "Failed to update school.");
      }
    } catch (error) {
      console.error("Error updating school:", error);
      show("error", "Update Failed", "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog header="Edit School" visible onHide={close} style={{ width: "50vw" }}>
      <Toast ref={toast} />
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
        {/* Logo Upload */}
        <div className="p-field">
          <label>Logo</label>
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
          {!file && school.logo && (
            <small>Current: {school.logo.split("_").slice(1).join("_")}</small>
          )}
        </div>

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

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
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
};

export default EditSchool;
