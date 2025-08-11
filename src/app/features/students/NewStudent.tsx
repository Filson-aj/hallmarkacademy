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

import { studentSchema, StudentSchema } from "@/lib/schemas";

interface NewStudentProps {
    close: () => void;
    onCreated: (created: any) => void;
}

interface Option {
    label: string;
    value: string;
}

interface Admin {
    id: string;
    schoolId?: string;
}

interface Teacher {
    id: string;
    schoolid?: string;
    classes: { id: string; name: string; schoolid: string; formmasterid?: string }[];
}

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

const studentTypeOptions: Option[] = [
    { label: "Day", value: "DAY" },
    { label: "Boarding", value: "BOARDING" },
];

const houseOptions: Option[] = [
    { label: 'Glory', value: 'Glory' },
    { label: 'Grace', value: 'Grace' },
    { label: 'Honour', value: 'Honour' },
];

const religionOptions: Option[] = [
    { label: "Christianity", value: "CHRISTIANITY" },
    { label: "Islam", value: "ISLAM" },
    { label: "Other", value: "OTHER" },
];

export default function NewStudent({ close, onCreated }: NewStudentProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<Option[]>([]);
    const [parents, setParents] = useState<Option[]>([]);
    const [classes, setClasses] = useState<Option[]>([]);
    const [schoolId, setSchoolId] = useState<string | null>(null);
    const [classId, setClassId] = useState<string | null>(null);
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
    } = useForm<StudentSchema>({
        resolver: zodResolver(studentSchema),
        mode: "onBlur",
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

        const fetchParents = () => {
            return fetch("/api/parents")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch parents");
                    return res.json();
                })
                .then(({ data }) => {
                    const opts: Option[] = data.map((p: any) => ({ label: `${p.firstname} ${p.surname}`, value: p.id }));
                    return opts;
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load parents.", life: 3000 });
                    return [];
                });
        };

        const fetchClasses = () => {
            return fetch("/api/classes")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch classes");
                    return res.json();
                })
                .then(({ data }) => {
                    return data; // Return raw data for filtering
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load classes.", life: 3000 });
                    return [];
                });
        };

        const fetchAdmins = () => {
            return fetch("/api/admins")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch admins");
                    return res.json();
                })
                .then(({ data }) => data)
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load admins.", life: 3000 });
                    return [];
                });
        };

        const fetchTeachers = () => {
            return fetch("/api/teachers")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch teachers");
                    return res.json();
                })
                .then(({ data }) => data)
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load teachers.", life: 3000 });
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

        const initializeData = async () => {
            try {
                if (role === "super") {
                    const schoolOptions = await fetchSchools();
                    setSchools(schoolOptions);
                    const parentOptions = await fetchParents();
                    setParents(parentOptions);
                    const classData = await fetchClasses();
                    const classOptions: Option[] = classData.map((c: any) => ({ label: c.name, value: c.id }));
                    setClasses(classOptions);
                } else if (role === "admin" || role === "management") {
                    const admins = await fetchAdmins();
                    const userAdmin = admins.find((admin: Admin) => admin.id === session?.user.id);
                    const selectedSchoolId = userAdmin?.schoolId || null;
                    setSchoolId(selectedSchoolId);
                    if (selectedSchoolId) {
                        setValue("schoolid", selectedSchoolId);
                        const parentOptions = await fetchParents();
                        setParents(parentOptions);
                        const classData = await fetchClasses();
                        const classOptions: Option[] = classData
                            .filter((c: any) => c.schoolid === selectedSchoolId)
                            .map((c: any) => ({ label: c.name, value: c.id }));
                        setClasses(classOptions);
                    }
                } else if (role === "teacher") {
                    const teachers = await fetchTeachers();
                    const userTeacher = teachers.find((teacher: Teacher) => teacher.id === session?.user.id);
                    const selectedSchoolId = userTeacher?.schoolid || null;
                    const formMasterClass = userTeacher?.classes.find((cls: any) => cls.formmasterid === userTeacher.id);
                    setSchoolId(selectedSchoolId);
                    setClassId(formMasterClass?.id || null);
                    if (selectedSchoolId) {
                        setValue("schoolid", selectedSchoolId);
                        const parentOptions = await fetchParents();
                        setParents(parentOptions);
                    }
                    if (formMasterClass) {
                        setClasses([{ label: formMasterClass.name, value: formMasterClass.id }]);
                        setValue("classid", formMasterClass.id);
                    } else {
                        setClasses([]);
                        toast.current?.show({ severity: "error", summary: "Error", detail: "No form master class assigned.", life: 3000 });
                    }
                }
                await fetchStates();
            } catch (err) {
                console.error("Error fetching data:", err);
            }
        };

        initializeData();
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

    const onSubmit = async (data: StudentSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                password: "password",
                admissiondate: new Date().toISOString(),
            };
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok) {
                show("success", "Student Created", "New student has been created successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated(result);
                }, 1500);
            } else {
                show("error", "Creation Error", result.error || result.message || "Failed to create student.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create student.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New Student"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />
            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
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
                        <label htmlFor="surname">Surname</label>
                        <InputText
                            id="surname"
                            {...register("surname")}
                            className={errors.surname ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.surname && <small className="p-error">{errors.surname.message}</small>}
                    </div>
                </div>

                <div className="p-field">
                    <label htmlFor="othername">Other Name</label>
                    <InputText
                        id="othername"
                        {...register("othername")}
                        className={errors.othername ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.othername && <small className="p-error">{errors.othername.message}</small>}
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="birthday">Birthday</label>
                        <Controller
                            name="birthday"
                            control={control}
                            defaultValue={undefined}
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
                            defaultValue={undefined}
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
                        <label htmlFor="religion">Religion</label>
                        <Controller
                            name="religion"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="religion"
                                    {...field}
                                    options={religionOptions}
                                    placeholder="Select Religion"
                                    className={errors.religion ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.religion && <small className="p-error">{errors.religion.message}</small>}
                    </div>
                    <div>
                        <label htmlFor="studenttype">Student Type</label>
                        <Controller
                            name="studenttype"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="studenttype"
                                    {...field}
                                    options={studentTypeOptions}
                                    placeholder="Select Student Type"
                                    className={errors.studenttype ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.studenttype && <small className="p-error">{errors.studenttype.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="bloodgroup">Blood Group</label>
                        <Controller
                            name="bloodgroup"
                            control={control}
                            defaultValue=""
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
                        <label htmlFor="house">House</label>
                        <Controller
                            name="house"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="house"
                                    {...field}
                                    options={houseOptions}
                                    placeholder="Select House"
                                    className={errors.house ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.house && <small className="p-error">{errors.house.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
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
                    <div>
                        <label htmlFor="phone">Phone</label>
                        <InputText
                            id="phone"
                            {...register("phone")}
                            className={errors.phone ? "p-invalid w-full" : "w-full"}
                        />
                        {errors.phone && <small className="p-error">{errors.phone.message}</small>}
                    </div>
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="state">State</label>
                        <Controller
                            name="state"
                            control={control}
                            defaultValue=""
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
                    <div>
                        <label htmlFor="lga">LGA</label>
                        <Controller
                            name="lga"
                            control={control}
                            defaultValue=""
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
                </div>

                <div className="p-field">
                    <label htmlFor="address">Address</label>
                    <InputTextarea
                        rows={3}
                        id="address"
                        {...register("address")}
                        className={errors.address ? "p-invalid w-full" : "w-full"}
                    />
                    {errors.address && <small className="p-error">{errors.address.message}</small>}
                </div>

                <div className="p-field grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="parentid">Parent</label>
                        <Controller
                            name="parentid"
                            control={control}
                            defaultValue=""
                            render={({ field }) => (
                                <Dropdown
                                    id="parentid"
                                    {...field}
                                    options={parents}
                                    placeholder="Select Parent"
                                    className={errors.parentid ? "p-invalid w-full" : "w-full"}
                                />
                            )}
                        />
                        {errors.parentid && <small className="p-error">{errors.parentid.message}</small>}
                    </div>
                    {role !== "teacher" && (
                        <div>
                            <label htmlFor="classid">Class</label>
                            <Controller
                                name="classid"
                                control={control}
                                defaultValue=""
                                render={({ field }) => (
                                    <Dropdown
                                        id="classid"
                                        {...field}
                                        options={classes}
                                        placeholder="Select Class"
                                        className={errors.classid ? "p-invalid w-full" : "w-full"}
                                    />
                                )}
                            />
                            {errors.classid && <small className="p-error">{errors.classid.message}</small>}
                        </div>
                    )}
                    {role === "teacher" && <input type="hidden" {...register("classid")} value={classId || ""} />}
                </div>

                {role === "super" && (
                    <div className="p-field">
                        <label htmlFor="schoolid">School</label>
                        <Controller
                            name="schoolid"
                            control={control}
                            defaultValue=""
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
                )}
                {(role === "admin" || role === "management" || role === "teacher") && (
                    <input type="hidden" {...register("schoolid")} value={schoolId || ""} />
                )}

                <div className="flex justify-end gap-2 mt-3">
                    <Button label="Cancel" type="button" outlined onClick={close} />
                    <Button label="Save" type="submit" className="p-button-primary" loading={loading} disabled={loading} />
                </div>
            </form>
        </Dialog>
    );
}