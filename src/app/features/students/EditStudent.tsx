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

interface EditStudentProps {
    close: () => void;
    onUpdated: (updated: any) => void;
    student: StudentSchema;
}

interface Option {
    label: string;
    value: string;
}

interface Admin {
    id: string;
    schoolId?: string;
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
    { label: "Glory", value: "Glory" },
    { label: "Grace", value: "Grace" },
    { label: "Honour", value: "Honour" },
];

const religionOptions: Option[] = [
    { label: "Christianity", value: "CHRISTIANITY" },
    { label: "Islam", value: "ISLAM" },
    { label: "Other", value: "OTHER" },
];

export default function EditStudent({ close, onUpdated, student }: EditStudentProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);
    const [schools, setSchools] = useState<Option[]>([]);
    const [parents, setParents] = useState<Option[]>([]);
    const [classes, setClasses] = useState<Option[]>([]);
    const [schoolId, setSchoolId] = useState<string | null>(null);
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
        defaultValues: {
            id: student.id || "",
            firstname: student.firstname || "",
            surname: student.surname || "",
            othername: student.othername || "",
            birthday: student.birthday ? new Date(student.birthday) : undefined,
            gender: student.gender || undefined,
            religion: student.religion || undefined,
            studenttype: student.studenttype || undefined,
            house: student.house || "",
            bloodgroup: student.bloodgroup || "",
            email: student.email || "",
            phone: student.phone || "",
            address: student.address || "",
            state: student.state || "",
            lga: student.lga || "",
            parentid: student.parentid || "",
            classid: student.classid || "",
            schoolid: student.schoolid || "",
        },
    });

    const selectedState = watch("state");
    const selectedClassId = watch("classid");

    useEffect(() => {
        console.log("Student prop:", student);
        console.log("Form errors:", errors);
        console.log("Current form data:", watch());
    }, [student, errors, watch]);

    useEffect(() => {
        // Fetch schools, parents, and classes
        const fetchSchools = () => {
            return fetch("/api/schools")
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch schools");
                    return res.json();
                })
                .then(({ data }) => {
                    const opts: Option[] = data.map((s: any) => ({ label: s.name, value: s.id }));
                    console.log("Fetched schools:", opts);
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
                    console.log("Fetched parents:", opts);
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
                    const opts: Option[] = data.map((c: any) => ({ label: c.name, value: c.id }));
                    console.log("Fetched classes:", opts);
                    return opts;
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
                .then(({ data }) => {
                    console.log("Fetched admins:", data);
                    return data;
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load admins.", life: 3000 });
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
                    console.log("Fetched states:", opts);
                    setStates(opts);
                })
                .catch((err) => {
                    console.error(err);
                    toast.current?.show({ severity: "error", summary: "Error", detail: "Could not load Nigerian states.", life: 3000 });
                });
        };

        Promise.all([fetchSchools(), fetchParents(), fetchClasses(), fetchAdmins()])
            .then(([schoolOptions, parentOptions, classOptions, adminData]) => {
                if (role === "super") {
                    setSchools(schoolOptions);
                } else {
                    const userAdmin = adminData.find((admin: Admin) => admin.id === session?.user.id);
                    let selectedSchoolId: string | null = null;

                    if (userAdmin && userAdmin.schoolid) {
                        selectedSchoolId = userAdmin.schoolid;
                    } else {
                        selectedSchoolId = student.schoolid;
                    }

                    setSchoolId(selectedSchoolId);
                    setSchools(selectedSchoolId ? schoolOptions.filter((o) => o.value === selectedSchoolId) : []);
                    if (selectedSchoolId) {
                        setValue("schoolid", selectedSchoolId);
                    }
                }
                setParents(parentOptions);
                setClasses(classOptions);
            })
            .catch((err) => {
                console.error("Error fetching data:", err);
            });

        fetchStates();
    }, [role, session?.user?.id, setValue, student.schoolid]);

    useEffect(() => {
        console.log("Selected state:", selectedState);
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
                console.log("Fetched LGAs:", opts);
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
        console.log("Form submitted with data:", data);
        setLoading(true);
        try {
            // Check class capacity if classid has changed
            if (data.classid && data.classid !== student.classid) {
                const classResponse = await fetch(`/api/classes/${data.classid}`);
                if (!classResponse.ok) {
                    throw new Error("Failed to fetch class details");
                }
                const classData = await classResponse.json();
                const classInfo = classData.data;

                const studentCountResponse = await fetch(`/api/students?classid=${data.classid}`);
                if (!studentCountResponse.ok) {
                    throw new Error("Failed to fetch student count");
                }
                const studentCountData = await studentCountResponse.json();
                const studentCount = studentCountData.total;

                if (classInfo.capacity !== null && studentCount >= classInfo.capacity) {
                    show("error", "Update Error", "Class capacity reached. Cannot assign student to this class.");
                    setLoading(false);
                    return;
                }
            }

            const payload = {
                ...data,
                updateAt: new Date().toISOString(),
            };
            const res = await fetch(`/api/students/${student.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            console.log("API response:", result, "Status:", res.status);
            if (res.ok) {
                show("success", "Student Updated", "Student has been updated successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onUpdated(result);
                }, 1500);
            } else {
                show("error", "Update Error", result.message || "Failed to update student.");
            }
        } catch (err: any) {
            console.error("Submission error:", err);
            show("error", "Update Error", err.message || "Could not update student.");
        } finally {
            setLoading(false);
            console.log("Loading state reset:", loading);
        }
    };

    return (
        <Dialog
            header="Edit Student"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />
            <form
                onSubmit={(e) => {
                    console.log("Form submit event triggered");
                    handleSubmit(onSubmit)(e);
                }}
                className="p-fluid space-y-4"
            >
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
                            render={({ field }) => (
                                <Calendar
                                    id="birthday"
                                    {...field}
                                    value={field.value}
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
                    <div>
                        <label htmlFor="classid">Class</label>
                        <Controller
                            name="classid"
                            control={control}
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