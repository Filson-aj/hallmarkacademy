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

import { teacherSchema, TeacherSchema } from "@/lib/schemas";

interface NewTeacherProps {
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

export default function NewTeacher({ close, onCreated }: NewTeacherProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<Option[]>([]);
    const [states, setStates] = useState<Option[]>([]);
    const [lgas, setLgas] = useState<Option[]>([]);
    const { data: session } = useSession();

    const role = session?.user?.role?.toLowerCase() || "guest";

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
        setValue,
    } = useForm<TeacherSchema>({
        resolver: zodResolver(teacherSchema),
        mode: "onBlur",
        defaultValues: {
            title: "",
            firstname: "",
            surname: "",
            othername: "",
            birthday: undefined,
            gender: undefined,
            bloodgroup: "",
            email: "",
            phone: "",
            state: "",
            lga: "",
            address: "",
            ...(role === "super" ? { schoolid: "" } : {}),
        },
    });

    const selectedState = watch("state");

    useEffect(() => {
        const fetchSchools = () => {
            return fetch("/api/schools")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch schools");
                    return res.json();
                })
                .then(({ data }) => {
                    const opts: Option[] = data.map((s: any) => ({ label: s.name, value: s.id }));
                    return opts;
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load schools.", life: 3000 });
                    return [];
                });
        };

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

        if (role === "super") {
            fetchSchools().then((schoolOptions) => {
                setSchools(schoolOptions);
            });
        }

        fetchStates();
    }, [role, session?.user?.id, setValue]);

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

    const onSubmit = async (data: TeacherSchema) => {
        setLoading(true);
        try {
            const payload: Partial<TeacherSchema> = {
                title: data.title,
                firstname: data.firstname,
                surname: data.surname,
                othername: data.othername,
                birthday: data.birthday,
                gender: data.gender,
                bloodgroup: data.bloodgroup,
                email: data.email,
                phone: data.phone,
                state: data.state,
                lga: data.lga,
                address: data.address,
                schoolid: data?.schoolid,
            };

            const res = await fetch("/api/teachers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Teacher Created", "New teacher has been created successfully.");
                setTimeout(() => {
                    reset({
                        title: "",
                        firstname: "",
                        surname: "",
                        othername: "",
                        birthday: undefined,
                        gender: undefined,
                        bloodgroup: "",
                        email: "",
                        phone: "",
                        state: "",
                        lga: "",
                        address: "",
                        ...(role === "super" ? { schoolid: "" } : {}),
                    });
                    close();
                    onCreated(result);
                }, 1500);
            } else {
                show("error", "Creation Error", result.error || "Failed to create teacher.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create teacher.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New Teacher"
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
                        <label htmlFor="state">State</label>
                        <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                                <Dropdown
                                    id="state"
                                    {...field}
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

                {role === "super" ? (
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
                                />
                            )}
                        />
                        {errors.schoolid && <small className="p-error">{errors.schoolid.message}</small>}
                    </div>
                ) : (
                    <input type="hidden" {...register("schoolid")} value={"id123"} />
                )}

                <div className="flex justify-end gap-2 mt-3">
                    <Button label="Cancel" type="button" outlined onClick={close} />
                    <Button label="Save" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                </div>
            </form>
        </Dialog>
    );
}