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

interface NewParentProps {
    close: () => void;
    onCreated: (created: any) => void;
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

export default function NewParent({ close, onCreated }: NewParentProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [states, setStates] = useState<Option[]>([]);
    const [lgas, setLgas] = useState<Option[]>([]);
    const [students, setStudents] = useState<Option[]>([]);
    const { data: session } = useSession();

    const {
        register,
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
            username: "",
            title: "",
            firstname: "",
            surname: "",
            othername: "",
            bloodgroup: "",
            gender: "MALE",
            occupation: "",
            religion: "",
            state: "",
            lga: "",
            email: "",
            phone: "",
            address: "",
            students: [],
        },
    });

    const selectedState = watch("state");

    useEffect(() => {
        // Fetch states
        const fetchStates = () => {
            return fetch("https://nga-states-lga.onrender.com/fetch")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch states");
                    return res.json();
                })
                .then((data: string[]) => {
                    const opts: Option[] = data.map((state) => ({ label: state, value: state }));
                    setStates(opts);
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load Nigerian states.", life: 3000 });
                });
        };

        // Fetch students
        const fetchStudents = () => {
            return fetch("/api/students")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch students");
                    return res.json();
                })
                .then(({ data }) => {
                    const opts: Option[] = data.map((s: any) => ({
                        label: `${s.firstname} ${s.othername || ''} ${s.surname}`.trim(),
                        value: s.id,
                    }));
                    setStudents(opts);
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load students.", life: 3000 });
                    return [];
                });
        };

        Promise.all([fetchStates(), fetchStudents()]).catch((err) => {
            console.error("Error fetching data:", err);
        });
    }, []);

    useEffect(() => {
        if (!selectedState) {
            setLgas([]);
            setValue("lga", "");
            return;
        }

        fetch(`https://nga-states-lga.onrender.com/?state=${encodeURIComponent(selectedState)}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch LGAs");
                return res.json();
            })
            .then((data: string[]) => {
                const opts: Option[] = data.map((lga) => ({ label: lga, value: lga }));
                setLgas(opts);
            })
            .catch((err) => {
                console.error(err);
                setLgas([]);
                setValue("lga", "");
                toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load LGAs.", life: 3000 });
            });
    }, [selectedState, setValue]);

    const show = (severity: "success" | "error", summary: string, detail: string) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    const onSubmit = async (data: ParentSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                password: "password",
            };
            const res = await fetch("/api/parents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Parent Created", "New parent has been created successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated(result);
                }, 1500);
            } else {
                show("error", "Creation Error", result.message || "Failed to create parent.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create parent.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New Parent"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                <div className="p-field">
                    <label htmlFor="title">Title</label>
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="title"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.value)}
                                options={titleOptions}
                                placeholder="Select Title"
                                className={errors.title ? "p-invalid w-full" : "w-full"}
                            />
                        )}
                    />
                    {errors.title && <small className="p-error">{errors.title.message}</small>}
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="firstname">First Name</label>
                        <InputText
                            id="firstname"
                            {...register("firstname")}
                            className={errors.firstname ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.firstname && <small className="p-error">{errors.firstname.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="othername">Other Name</label>
                        <InputText
                            id="othername"
                            {...register("othername")}
                            className={errors.othername ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.othername && <small className="p-error">{errors.othername.message}</small>}
                    </div>
                </div>

                <div className="p-field">
                    <label htmlFor="surname">Surname</label>
                    <InputText
                        id="surname"
                        {...register("surname")}
                        className={errors.surname ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="birthday">Birthday</label>
                        <Controller
                            name="birthday"
                            control={control}
                            render={({ field }) => (
                                <Calendar
                                    id="birthday"
                                    {...field}
                                    value={field.value || null}
                                    onChange={(e) => field.onChange(e.value)}
                                    dateFormat="dd/mm/yy"
                                    placeholder="Select Date"
                                    className={errors.birthday ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.birthday && <small className="p-error">{errors.birthday.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="gender">Gender</label>
                        <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="gender"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={genderOptions}
                                    placeholder="Select Gender"
                                    className={errors.gender ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.gender && <small className="p-error">{errors.gender.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bloodgroup">Blood Group</label>
                        <Controller
                            name="bloodgroup"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="bloodgroup"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={bloodgroupOptions}
                                    placeholder="Select Blood Group"
                                    className={errors.bloodgroup ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.bloodgroup && <small className="p-error">{errors.bloodgroup.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="email">Email</label>
                        <InputText
                            id="email"
                            type="email"
                            {...register("email")}
                            className={errors.email ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.email && <small className="p-error">{errors.email.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="phone">Phone</label>
                        <InputText
                            id="phone"
                            {...register("phone")}
                            className={errors.phone ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="occupation">Occupation</label>
                        <Controller
                            name="occupation"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="occupation"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={occupationOptions}
                                    placeholder="Select Occupation"
                                    className={errors.occupation ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.occupation && <small className="p-error">{errors.occupation.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="religion">Religion</label>
                        <Controller
                            name="religion"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="religion"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={religionOptions}
                                    placeholder="Select Religion"
                                    className={errors.religion ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.religion && <small className="p-error">{errors.religion.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="state">State</label>
                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="state"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={states}
                                    placeholder="Select State"
                                    className={errors.state ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.state && <small className="p-error">{errors.state.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="lga">LGA</label>
                        <Controller
                            name="lga"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="lga"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(e.value)}
                                    options={lgas}
                                    placeholder={selectedState ? "Select LGA" : "Select a state first"}
                                    className={errors.lga ? "p-invalid w-full" : "w-full"}
                                    disabled={!selectedState}
                                />
                            )}
                        />
                        {errors.lga && <small className="p-error">{errors.lga.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="address">Address</label>
                        <InputTextarea
                            rows={3}
                            id="address"
                            {...register("address")}
                            className={errors.address ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.address && <small className="p-error">{errors.address.message}</small>}
                    </div>
                </div>

                <div className="p-field">
                    <label htmlFor="students">Children</label>
                    <Controller
                        name="students"
                        control={control}
                        defaultValue={[]}
                        render={({ field }) => (
                            <MultiSelect
                                id="students"
                                {...field}
                                value={field.value || []}
                                onChange={(e) => field.onChange(e.value)}
                                options={students}
                                placeholder="Select Students"
                                className={errors.students ? "p-invalid w-full" : "w-full"}
                                display="chip"
                            />
                        )}
                    />
                    {errors.students && <small className="p-error">{errors.students.message}</small>}
                </div>

                <div className="flex justify-end gap-2 mt-3">
                    <Button label="Cancel" type="button" outlined onClick={close} />
                    <Button label="Save" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                </div>
            </form>
        </Dialog>
    );
}