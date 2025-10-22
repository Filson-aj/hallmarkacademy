"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";
import profilePic from "@/assets/profile1.png";
import { motion } from "framer-motion";

type Role =
    | "super"
    | "management"
    | "admin"
    | "teacher"
    | "student"
    | "parent"
    | string;

const titleOptions = [
    { label: "Mr.", value: "Mr." },
    { label: "Mrs.", value: "Mrs." },
    { label: "Miss", value: "Miss" },
    { label: "Dr.", value: "Dr." },
    { label: "Prof.", value: "Prof." },
    { label: "Engr.", value: "Engr." },
];

const genderOptions = [
    { label: "Male", value: "MALE" },
    { label: "Female", value: "FEMALE" },
];

const qualificationOptions = [
    { label: "NCE", value: "NCE" },
    { label: "OND/ND", value: "OND/ND" },
    { label: "HND", value: "HND" },
    { label: "BSc", value: "Bsc." },
    { label: "BEd", value: "Bed." },
    { label: "B.Tech", value: "B Tech." },
    { label: "MSc", value: "Msc." },
    { label: "PhD", value: "PhD." },
];

const bloodgroupOptions = [
    { label: "A+", value: "A+" },
    { label: "A-", value: "A-" },
    { label: "B+", value: "B+" },
    { label: "B-", value: "B-" },
    { label: "AB+", value: "AB+" },
    { label: "AB-", value: "AB-" },
    { label: "O+", value: "O+" },
    { label: "O-", value: "O-" },
];

export default function Profile() {
    const toast = useRef<Toast | null>(null);
    const { data: session, status } = useSession();
    const isSessionLoading = status === "loading";

    const userId = session?.user?.id as string | undefined;
    const role = (session?.user?.role as Role) ?? "guest";

    const [profile, setProfile] = useState<any>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    const profileEndpoint = useMemo(() => {
        if (!userId) return null;
        const r = String(role).toLowerCase();
        if (r === "super" || r === "admin" || r === "management") return `/api/admins/${userId}`;
        if (r === "teacher") return `/api/teachers/${userId}`;
        if (r === "student") return `/api/students/${userId}`;
        if (r === "parent") return `/api/parents/${userId}`;
        return `/api/students/${userId}`;
    }, [role, userId]);

    const getAvatarUrl = (avatar: any) => {
        if (!avatar) return undefined;
        // If server returns a string -> use it
        if (typeof avatar === "string") return avatar;
        // If it's Next.js StaticImageData, use .src
        if (typeof avatar === "object" && typeof (avatar as any).src === "string") return (avatar as any).src;
        // Try common uploader fields
        if (typeof avatar === "object") {
            const candidates = [(avatar as any).url, (avatar as any).path, (avatar as any).src];
            for (const c of candidates) {
                if (typeof c === "string" && c.length) return c;
            }
        }
        return undefined;
    };

    // If imported profilePic is StaticImageData, prefer .src
    const staticProfilePicUrl = (profilePic as any)?.src ?? profilePic;

    const shapeToDefaults = (p: any, r?: Role) => {
        const base: any = {
            title: p?.title ?? "",
            username: p?.username ?? "",
            firstname: p?.firstname ?? "",
            othername: p?.othername ?? "",
            surname: p?.surname ?? "",
            birthday: p?.birthday ? new Date(p.birthday) : null,
            gender: p?.gender ?? null,
            bloodgroup: p?.bloodgroup ?? "",
            email: p?.email ?? "",
            phone: p?.phone ?? "",
            address: p?.address ?? "",
            state: p?.state ?? "",
            lga: p?.lga ?? "",
            avatar: p?.avatar ?? "",
        };

        if (String(r).toLowerCase() === "teacher") {
            base.qualification = p?.qualification ?? "";
        }

        return base;
    };

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        mode: "onBlur",
        defaultValues: shapeToDefaults({}, role),
    });

    const getError = (key: string) => (errors as any)[key];

    const fetchProfile = useCallback(async () => {
        if (!profileEndpoint) return;
        setLoadingProfile(true);
        try {
            const res = await fetch(profileEndpoint);
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `Failed to load profile (${res.status})`);
            }
            const data = await res.json();
            const payload = data?.data ?? data ?? {};
            setProfile(payload);
            reset(shapeToDefaults(payload, role));
        } catch (err: any) {
            console.error("fetchProfile error", err);
            toast.current?.show({ severity: "error", summary: "Profile", detail: err?.message || "Failed to load profile" });
        } finally {
            setLoadingProfile(false);
        }
    }, [profileEndpoint, reset, role]);

    useEffect(() => {
        if (!isSessionLoading && profileEndpoint) fetchProfile();
    }, [isSessionLoading, profileEndpoint, fetchProfile]);

    const saveProfile = useCallback(
        async (patch: Record<string, any>) => {
            if (!profileEndpoint) throw new Error("No profile endpoint");
            setSaving(true);
            try {
                const res = await fetch(profileEndpoint, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(patch),
                });
                let json: any = {};
                try {
                    json = await res.json();
                } catch { }
                if (!res.ok) {
                    const msg = json?.error || `Failed to save (status ${res.status})`;
                    throw new Error(msg);
                }
                const updated = json?.data ?? json ?? {};
                const newProfile = Object.keys(updated).length ? updated : { ...(profile ?? {}), ...patch };
                setProfile(newProfile);
                reset(shapeToDefaults(newProfile, role));
                toast.current?.show({ severity: "success", summary: "Saved", detail: "Profile updated." });
                return newProfile;
            } catch (err: any) {
                console.error("saveProfile error", err);
                toast.current?.show({ severity: "error", summary: "Save failed", detail: err?.message || String(err) });
                throw err;
            } finally {
                setSaving(false);
            }
        },
        [profileEndpoint, profile, reset, role]
    );

    const handleAvatarChange = useCallback(
        async (meta: UploadResult) => {
            // Normalize uploader result into a string before saving.
            const avatarUrl = typeof meta === "string" ? meta : (meta.path ?? meta.url ?? undefined);
            return saveProfile({ avatar: avatarUrl });
        },
        [saveProfile]
    );

    const onSubmit = async (vals: any) => {
        const patch: Record<string, any> = {};
        if (vals.title !== undefined) patch.title = vals.title;
        if (vals.qualification !== undefined && role === "teacher") patch.qualification = vals.qualification;
        if (vals.username !== undefined) patch.username = vals.username;
        if (vals.firstname !== undefined) patch.firstname = vals.firstname;
        if (vals.othername !== undefined) patch.othername = vals.othername;
        if (vals.surname !== undefined) patch.surname = vals.surname;
        if (vals.birthday) patch.birthday = new Date(vals.birthday).toISOString();
        if (vals.gender !== undefined) patch.gender = vals.gender;
        if (vals.bloodgroup !== undefined) patch.bloodgroup = vals.bloodgroup;
        // IMPORTANT: email is non-editable in the UI — do NOT send it in patch even if present.
        if (vals.phone !== undefined) patch.phone = vals.phone;
        if (vals.address !== undefined) patch.address = vals.address;
        if (vals.state !== undefined) patch.state = vals.state;
        if (vals.lga !== undefined) patch.lga = vals.lga;

        try {
            await saveProfile(patch);
            setEditMode(false);
        } catch {
            // toast shown in saveProfile
        }
    };

    const handleStartEdit = () => setEditMode(true);
    const handleCancel = () => {
        setEditMode(false);
        reset(shapeToDefaults(profile ?? {}, role));
    };

    const fieldsByRole = (r: Role) => {
        const common = [
            { key: "title", label: "Title", type: "select" },
            { key: "firstname", label: "First name", type: "text", required: true },
            { key: "othername", label: "Other name", type: "text" },
            { key: "surname", label: "Surname", type: "text", required: true },
            { key: "birthday", label: "Birthday", type: "date" },
            { key: "gender", label: "Gender", type: "select" },
            { key: "bloodgroup", label: "Blood group", type: "select" },
            { key: "email", label: "Email", type: "email", required: true },
            { key: "phone", label: "Phone", type: "text" },
            { key: "address", label: "Address", type: "textarea" },
            { key: "state", label: "State", type: "text" },
            { key: "lga", label: "LGA", type: "text" },
        ];

        switch (String(r).toLowerCase()) {
            case "teacher":
                return [...common, { key: "qualification", label: "Qualification", type: "select", required: true }];
            case "student":
                return common;
            case "parent":
                return common;
            case "super":
            case "admin":
            case "management":
                return [
                    { key: "email", label: "Email", type: "email", required: true },
                    { key: "username", label: "Username", type: "text" },
                ];
            default:
                return common;
        }
    };

    // derive final avatar URL strings used by UI
    const resolvedAvatarUrl = useMemo(() => getAvatarUrl(profile?.avatar), [profile?.avatar]);
    const avatarPath = resolvedAvatarUrl && resolvedAvatarUrl.startsWith("/") ? resolvedAvatarUrl : undefined;
    const avatarPlaceholder = resolvedAvatarUrl && /^https?:\/\//i.test(resolvedAvatarUrl) ? resolvedAvatarUrl : staticProfilePicUrl;

    if (isSessionLoading || loadingProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-800">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-white/30 mx-auto mb-4" />
                </div>
            </div>
        );
    }

    if (!userId) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center">
                        <h2 className="text-lg sm:text-xl font-semibold">Not signed in</h2>
                        <p className="text-sm sm:text-base text-gray-500 mt-2">Please sign in to view your profile.</p>
                    </div>
                </div>
            </main>
        );
    }

    const displayName =
        profile?.firstname || profile?.surname
            ? `${profile.firstname ?? ""} ${profile.othername ? profile.othername + " " : ""}${profile.surname ?? ""}`.trim()
            : profile?.username ?? profile?.email ?? "Profile";

    const roleFields = fieldsByRole(role);

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-800 p-4 sm:p-6">
            <Toast ref={toast} />
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-4xl">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl">
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                        {/* Left: avatar + basic info */}
                        <div className="w-full lg:w-1/3 flex flex-col items-center">
                            <div className="relative">
                                <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 rounded-full overflow-hidden shadow-md border border-white/8">
                                    <ImageView
                                        path={avatarPath}
                                        onChange={handleAvatarChange}
                                        placeholder={avatarPlaceholder}
                                        className="rounded-full object-cover w-full h-full"
                                        width={160}
                                        height={160}
                                        alt={displayName}
                                        editable={true}
                                    />
                                </div>
                                <div className="absolute -bottom-2 right-0">
                                    <div className="text-xs sm:text-sm text-white/90 bg-black/30 px-2 sm:px-3 py-1 rounded-full">Role: {String(role)}</div>
                                </div>
                            </div>

                            <div className="mt-3 text-center">
                                <h1 className="text-lg sm:text-2xl font-semibold text-white">{displayName}</h1>
                                <p className="text-sm sm:text-base text-white/80 mt-1">{profile?.email ?? "—"}</p>
                                <p className="text-xs sm:text-sm text-white/70 mt-1">Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</p>
                            </div>

                            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                {!editMode ? (
                                    <Button
                                        label="Edit Profile"
                                        icon="pi pi-pencil"
                                        onClick={handleStartEdit}
                                        className="p-button-rounded p-button-lg w-full sm:w-auto py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-indigo-500 to-cyan-500 border-0 text-white shadow-md"
                                    />
                                ) : (
                                    <>
                                        <Button
                                            label="Save"
                                            icon="pi pi-save"
                                            onClick={handleSubmit(onSubmit)}
                                            loading={saving}
                                            className="p-button-rounded p-button-lg w-full sm:w-auto py-2 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white shadow-md"
                                        />
                                        <Button
                                            label="Cancel"
                                            icon="pi pi-times"
                                            onClick={handleCancel}
                                            className="p-button-rounded p-button-lg w-full sm:w-auto py-2 sm:py-3 text-sm sm:text-base p-button-text text-white/90"
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Right: details */}
                        <div className="w-full lg:w-2/3">
                            <div className="bg-white/6 rounded-xl border border-white/8 p-3 sm:p-6">
                                <form className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    {roleFields.map((f) => {
                                        if (!editMode) {
                                            return (
                                                <div key={f.key} className="py-2">
                                                    <div className="text-xs sm:text-sm text-white/70 font-medium">{f.label}</div>
                                                    <div className="text-sm sm:text-base text-white mt-1">
                                                        {f.type === "date" ? (profile?.[f.key] ? new Date(profile[f.key]).toLocaleDateString() : "—") : profile?.[f.key] ?? "—"}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const fieldError = getError(f.key);

                                        // identify email field for read-only enforcement
                                        const isEmailField = f.key === "email";

                                        return (
                                            <div key={f.key} className="py-2">
                                                <div className="text-xs sm:text-sm text-white/70 font-medium mb-1">
                                                    {f.label}
                                                    {f.required ? " *" : ""}
                                                </div>

                                                {f.type === "select" && f.key === "title" && (
                                                    <Controller
                                                        control={control}
                                                        name="title"
                                                        rules={{ required: f.required ? "Title is required" : false }}
                                                        render={({ field }) => (
                                                            <Dropdown
                                                                value={field.value}
                                                                options={titleOptions}
                                                                onChange={(e) => field.onChange(e.value)}
                                                                placeholder="Select title"
                                                                className={fieldError ? "p-invalid w-full" : "w-full"}
                                                                inputId={`title-${f.key}`}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {f.type === "select" && f.key === "qualification" && (
                                                    <Controller
                                                        control={control}
                                                        name="qualification"
                                                        rules={{ required: f.required ? "Qualification is required" : false }}
                                                        render={({ field }) => (
                                                            <Dropdown
                                                                value={field.value}
                                                                options={qualificationOptions}
                                                                onChange={(e) => field.onChange(e.value)}
                                                                placeholder="Select qualification"
                                                                className={fieldError ? "p-invalid w-full" : "w-full"}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {f.type === "select" && f.key === "gender" && (
                                                    <Controller
                                                        control={control}
                                                        name="gender"
                                                        rules={{ required: f.required ? "Gender is required" : false }}
                                                        render={({ field }) => (
                                                            <Dropdown
                                                                value={field.value}
                                                                options={genderOptions}
                                                                onChange={(e) => field.onChange(e.value)}
                                                                placeholder="Select gender"
                                                                className={fieldError ? "p-invalid w-full" : "w-full"}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {f.type === "select" && f.key === "bloodgroup" && (
                                                    <Controller
                                                        control={control}
                                                        name="bloodgroup"
                                                        render={({ field }) => (
                                                            <Dropdown
                                                                value={field.value}
                                                                options={bloodgroupOptions}
                                                                onChange={(e) => field.onChange(e.value)}
                                                                placeholder="Select blood group"
                                                                className={fieldError ? "p-invalid w-full" : "w-full"}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {f.type === "date" && (
                                                    <Controller
                                                        control={control}
                                                        name="birthday"
                                                        render={({ field }) => (
                                                            <Calendar
                                                                value={field.value ?? null}
                                                                onChange={(e) => field.onChange(e.value)}
                                                                dateFormat="dd/mm/yy"
                                                                placeholder="Select Date"
                                                                className={fieldError ? "p-invalid w-full" : "w-full"}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {f.type === "textarea" && (
                                                    <Controller
                                                        control={control}
                                                        name={f.key as any}
                                                        render={({ field }) => (
                                                            <InputTextarea
                                                                rows={3}
                                                                value={field.value ?? ""}
                                                                onChange={(e) => field.onChange((e.target as HTMLTextAreaElement).value)}
                                                                className={fieldError ? "p-invalid w-full" : "w-full"}
                                                                style={{ padding: 12 }}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {(f.type === "text" || f.type === "email") && (
                                                    <Controller
                                                        control={control}
                                                        name={f.key as any}
                                                        rules={{
                                                            required: f.required ? `${f.label} is required` : false,
                                                            ...(f.type === "email"
                                                                ? {
                                                                    pattern: {
                                                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/i,
                                                                        message: "Invalid email address",
                                                                    },
                                                                }
                                                                : {}),
                                                            ...(f.key === "phone"
                                                                ? {
                                                                    minLength: { value: 7, message: "Phone is too short" },
                                                                    maxLength: { value: 20, message: "Phone is too long" },
                                                                }
                                                                : {}),
                                                        }}
                                                        render={({ field }) => (
                                                            <InputText
                                                                value={field.value ?? ""}
                                                                onChange={(e) => {
                                                                    if (isEmailField && editMode) return;
                                                                    field.onChange((e.target as HTMLInputElement).value);
                                                                }}
                                                                readOnly={isEmailField && editMode}
                                                                aria-readonly={isEmailField && editMode}
                                                                className={
                                                                    (fieldError ? "p-invalid " : "") +
                                                                    "w-full " +
                                                                    (isEmailField && editMode ? "bg-white/5 text-white/80 cursor-not-allowed" : "")
                                                                }
                                                                style={{ padding: 12 }}
                                                                type={f.type === "email" ? "email" : "text"}
                                                            />
                                                        )}
                                                    />
                                                )}

                                                {fieldError && <small className="p-error">{(fieldError as any)?.message}</small>}
                                            </div>
                                        );
                                    })}
                                </form>
                            </div>

                            <div className="mt-4 bg-white/6 rounded-xl border border-white/8 p-4 sm:p-4">
                                {String(role).toLowerCase() === "student" && (
                                    <>
                                        <div className="text-sm sm:text-base text-white/70">Admission date</div>
                                        <div className="text-sm sm:text-base text-white mb-3">{profile?.admissionDate ? new Date(profile.admissionDate).toLocaleDateString() : "—"}</div>
                                        <div className="text-sm sm:text-base text-white/70">Class</div>
                                        <div className="text-sm sm:text-base text-white">{profile?.class?.name ?? profile?.classId ?? "—"}</div>
                                    </>
                                )}

                                {String(role).toLowerCase() === "teacher" && (
                                    <>
                                        <div className="text-sm sm:text-base text-white/70">Subjects</div>
                                        <div className="text-sm sm:text-base text-white">{Array.isArray(profile?.subjects) ? profile.subjects.map((s: any) => s.name).join(", ") : "—"}</div>
                                    </>
                                )}

                                {String(role).toLowerCase() === "parent" && (
                                    <>
                                        <div className="text-sm sm:text-base text-white/70">Children</div>
                                        <div className="text-sm sm:text-base text-white">{Array.isArray(profile?.students) ? profile.students.map((s: any) => `${s.firstname} ${s.surname}`).join(", ") : "—"}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
