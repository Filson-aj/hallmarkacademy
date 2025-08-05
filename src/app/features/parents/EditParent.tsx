"use client";

import React, { useRef, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { MultiSelect } from "primereact/multiselect";
import { parentSchema, ParentSchema } from "@/lib/schemas";

// Define your own Student type
interface Student {
    id: string;
    firstname: string;
    othername?: string;
    surname: string;
}

// Omit the `students` field from ParentSchema (which is string[]), then re-add it as Student[]
interface EditParentProps {
    parent: Omit<ParentSchema, "students"> & {
        id: string;
        students: Student[];
    };
    close: () => void;
    onUpdated: (updated: any) => void;
}

interface Option {
    label: string;
    value: string;
}

const titleOptions: Option[] = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Miss.", value: "Miss." },
    { label: "Dr.", value: "Dr." },
    { label: "Prof.", value: "Prof." },
    { label: "Engr.", value: "Engr." },
];
const genderOptions: Option[] = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];
const bloodgroupOptions: Option[] = [
    { label: "A+", value: "A+" },
    { label: "A-", value: "A-" },
    { label: "B+", value: "B+" },
    { label: "B-", value: "B-" },
    { label: "AB+", value: "AB+" },
    { label: "AB-", value: "AB-" },
    { label: "O+", value: "O+" },
    { label: "O-", value: "O-" },
];
const religionOptions: Option[] = [
    { label: "Christianity", value: "Christianity" },
    { label: "Islam", value: "Islam" },
    { label: "Traditional", value: "Traditional" },
    { label: "Other", value: "Other" },
];
const occupationOptions: Option[] = [
    { label: "Teacher", value: "Teacher" },
    { label: "Doctor", value: "Doctor" },
    { label: "Politician", value: "Politician" },
    { label: "Engineer", value: "Engineer" },
    { label: "Business", value: "Business" },
    { label: "Civil Servant", value: "Civil Servant" },
    { label: "Other", value: "Other" },
];

export default function EditParent({ parent, close, onUpdated }: EditParentProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [states, setStates] = useState<Option[]>([]);
    const [lgas, setLgas] = useState<Option[]>([]);
    const [students, setStudents] = useState<Option[]>([]);
    const { data: session } = useSession();

    // Now parent.students is Student[], so this compiles
    const initialStudentIds = parent.students.map(s => s.id);

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
        setValue,
    } = useForm<ParentSchema>({
        resolver: zodResolver(parentSchema),
        mode: "onBlur",
        defaultValues: {
            title: parent.title || "",
            firstname: parent.firstname || "",
            surname: parent.surname || "",
            othername: parent.othername || "",
            birthday: parent.birthday ? new Date(parent.birthday) : undefined,
            bloodgroup: parent.bloodgroup || "",
            gender: parent.gender || "",
            occupation: parent.occupation || "",
            religion: parent.religion || "",
            state: parent.state || "",
            lga: parent.lga || "",
            email: parent.email || "",
            phone: parent.phone || "",
            address: parent.address || "",
            students: initialStudentIds,
        },
    });

    const selectedState = watch("state");

    // fetch states & full students list
    useEffect(() => {
        fetch("https://nga-states-lga.onrender.com/fetch")
            .then(r => r.ok ? r.json() : Promise.reject("States failed"))
            .then((data: string[]) =>
                setStates(data.map(s => ({ label: s, value: s }))))
            .catch(() =>
                toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load states", life: 3000 })
            );

        fetch("/api/students")
            .then(r => r.ok ? r.json() : Promise.reject("Students failed"))
            .then(({ data }) =>
                setStudents(data.map((s: any) => ({
                    label: `${s.firstname} ${s.othername || ""} ${s.surname}`.trim(),
                    value: s.id,
                }))))
            .catch(() => {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load students", life: 3000 });
                setStudents([]);
            });
    }, []);

    // fetch LGAs when state changes
    useEffect(() => {
        if (!selectedState) {
            setLgas([]);
            setValue("lga", "");
            return;
        }

        fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedState)}`)
            .then(r => r.ok ? r.json() : Promise.reject("LGAs failed"))
            .then((data: string[]) =>
                setLgas(data.map(l => ({ label: l, value: l }))))
            .catch(() => {
                toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load LGAs", life: 3000 });
                setLgas([]);
                setValue("lga", "");
            });
    }, [selectedState, setValue]);

    const show = (sev: "success" | "error", sum: string, det: string) =>
        toast.current?.show({ severity: sev, summary: sum, detail: det, life: 3000 });

    const onSubmit = async (data: ParentSchema) => {
        setLoading(true);
        try {
            const payload = { ...data, birthday: data.birthday ? new Date(data.birthday) : null };
            const res = await fetch(`/api/parents/${parent.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Parent Updated", "Parent has been updated successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onUpdated(result);
                }, 1500);
            } else {
                show("error", "Update Error", result.message || "Failed to update parent.");
            }
        } catch (err: any) {
            show("error", "Update Error", err.message || "Could not update parent.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog header="Edit Parent" visible onHide={close}
            style={{ width: "50vw" }} breakpoints={{ "1024px": "70vw", "640px": "94vw" }}>
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">

                {/* Title */}
                <div className="p-field">
                    <label htmlFor="title">Title</label>
                    <Controller name="title" control={control}
                        render={({ field }) => (
                            <Dropdown id="title" {...field}
                                options={titleOptions}
                                placeholder="Select Title"
                                className={errors.title ? "p-invalid w-full" : "w-full"} />
                        )}
                    />
                    {errors.title && <small className="p-error">{errors.title.message}</small>}
                </div>

                {/* First / Other Name */}
                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstname">First Name</label>
                        <Controller name="firstname" control={control}
                            render={({ field }) =>
                                <InputText id="firstname" {...field}
                                    className={errors.firstname ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.firstname && <small className="p-error">{errors.firstname.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="othername">Other Name</label>
                        <Controller name="othername" control={control}
                            render={({ field }) =>
                                <InputText id="othername" {...field}
                                    className={errors.othername ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.othername && <small className="p-error">{errors.othername.message}</small>}
                    </div>
                </div>

                {/* Surname */}
                <div className="p-field">
                    <label htmlFor="surname">Surname</label>
                    <Controller name="surname" control={control}
                        render={({ field }) =>
                            <InputText id="surname" {...field}
                                className={errors.surname ? "p-invalid w-full" : "w-full"} />
                        }
                    />
                    {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                </div>

                {/* Birthday / Gender */}
                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="birthday">Birthday</label>
                        <Controller name="birthday" control={control}
                            render={({ field }) =>
                                <Calendar id="birthday" {...field}
                                    dateFormat="dd/mm/yy"
                                    placeholder="Select Date"
                                    className={errors.birthday ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.birthday && <small className="p-error">{errors.birthday.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="gender">Gender</label>
                        <Controller name="gender" control={control}
                            render={({ field }) =>
                                <Dropdown id="gender" {...field}
                                    options={genderOptions}
                                    placeholder="Select Gender"
                                    className={errors.gender ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.gender && <small className="p-error">{errors.gender.message}</small>}
                    </div>
                </div>

                {/* Blood / Email */}
                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bloodgroup">Blood Group</label>
                        <Controller name="bloodgroup" control={control}
                            render={({ field }) =>
                                <Dropdown id="bloodgroup" {...field}
                                    options={bloodgroupOptions}
                                    placeholder="Select Blood Group"
                                    className={errors.bloodgroup ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.bloodgroup && <small className="p-error">{errors.bloodgroup.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="email">Email</label>
                        <Controller name="email" control={control}
                            render={({ field }) =>
                                <InputText id="email" type="email" {...field}
                                    className={errors.email ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.email && <small className="p-error">{errors.email.message}</small>}
                    </div>
                </div>

                {/* Phone / Occupation */}
                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone">Phone</label>
                        <Controller name="phone" control={control}
                            render={({ field }) =>
                                <InputText id="phone" {...field}
                                    className={errors.phone ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="occupation">Occupation</label>
                        <Controller name="occupation" control={control}
                            render={({ field }) =>
                                <Dropdown id="occupation" {...field}
                                    options={occupationOptions}
                                    placeholder="Select Occupation"
                                    className={errors.occupation ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.occupation && <small className="p-error">{errors.occupation.message}</small>}
                    </div>
                </div>

                {/* Religion / State */}
                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="religion">Religion</label>
                        <Controller name="religion" control={control}
                            render={({ field }) =>
                                <Dropdown id="religion" {...field}
                                    options={religionOptions}
                                    placeholder="Select Religion"
                                    className={errors.religion ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.religion && <small className="p-error">{errors.religion.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="state">State</label>
                        <Controller name="state" control={control}
                            render={({ field }) =>
                                <Dropdown id="state" {...field}
                                    options={states}
                                    placeholder="Select State"
                                    className={errors.state ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.state && <small className="p-error">{errors.state.message}</small>}
                    </div>
                </div>

                {/* LGA / Address */}
                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="lga">LGA</label>
                        <Controller name="lga" control={control}
                            render={({ field }) =>
                                <Dropdown id="lga" {...field}
                                    options={lgas}
                                    placeholder={selectedState ? "Select LGA" : "Select state first"}
                                    disabled={!selectedState}
                                    className={errors.lga ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.lga && <small className="p-error">{errors.lga.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="address">Address</label>
                        <Controller name="address" control={control}
                            render={({ field }) =>
                                <InputTextarea id="address" rows={3} {...field}
                                    className={errors.address ? "p-invalid w-full" : "w-full"} />
                            }
                        />
                        {errors.address && <small className="p-error">{errors.address.message}</small>}
                    </div>
                </div>

                {/* Children MultiSelect */}
                <div className="p-field">
                    <label htmlFor="students">Children</label>
                    <Controller name="students" control={control}
                        render={({ field }) => (
                            <MultiSelect id="students"
                                value={field.value}
                                onChange={e => field.onChange(e.value)}
                                options={students}
                                display="chip"
                                placeholder="Select Students"
                                className={errors.students ? "p-invalid w-full" : "w-full"} />
                        )}
                    />
                    {errors.students && <small className="p-error">{errors.students.message}</small>}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-3">
                    <Button label="Cancel" type="button" outlined onClick={close} />
                    <Button label="Save" type="submit" className="p-button-primary"
                        loading={loading} disabled={loading} />
                </div>
            </form>
        </Dialog>
    );
}
