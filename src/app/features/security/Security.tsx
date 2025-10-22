"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Dialog } from "primereact/dialog";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { FaLock } from "react-icons/fa";

type FormValues = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
};

const PasswordStrengthBar: React.FC<{ score: number }> = ({ score }) => {
    const width = `${(Math.max(0, Math.min(4, score)) / 4) * 100}%`;

    return (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
            <div className="h-2 rounded-full transition-all" style={{ width, background: "linear-gradient(90deg, rgba(99,102,241,1), rgba(16,185,129,1))" }} />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span className="capitalize">{score <= 1 ? "very weak" : score === 2 ? "weak" : score === 3 ? "good" : "strong"}</span>
                <span>{Math.round((parseFloat(width) || 0))}%</span>
            </div>
        </div>
    );
};

const SecurityOnlyChangePassword: React.FC = () => {
    const { data: session } = useSession();
    const toast = useRef<Toast | null>(null);

    const [visible, setVisible] = useState(false);
    const [saving, setSaving] = useState(false);
    const timerRef = useRef<number | null>(null);

    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        mode: "onBlur",
        defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" },
    });

    const newPassword = watch("newPassword");
    // Password strength scoring (simple heuristics)
    const strengthScore = useMemo(() => {
        const pass = newPassword || "";
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
        if (/\d/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;
        return score; // 0..4
    }, [newPassword]);

    useEffect(() => {
        // cleanup timer on unmount
        return () => {
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    const mapResponseToToast = (opts?: { code?: string; status?: number; message?: string }) => {
        const { code, status, message } = opts ?? {};
        if (message) {
            return { severity: "error" as const, summary: "Error", detail: message, life: 5000, icon: "pi pi-exclamation-triangle" };
        }
        if (code === "invalid_old_password" || status === 401) {
            return { severity: "error" as const, summary: "Invalid Password", detail: "Old password is incorrect.", life: 5000, icon: "pi pi-times" };
        }
        if (code === "weak_password" || status === 422) {
            return { severity: "warn" as const, summary: "Weak Password", detail: "New password does not meet strength requirements.", life: 6000, icon: "pi pi-lock" };
        }
        if (status && status >= 500) {
            return { severity: "error" as const, summary: "Server Error", detail: "Server error, please try again.", life: 6000, icon: "pi pi-exclamation-triangle" };
        }
        return { severity: "error" as const, summary: "Error", detail: "Failed to change password. Please try again.", life: 5000, icon: "pi pi-exclamation-triangle" };
    };

    const onSubmit = async (vals: FormValues) => {
        if (!session?.user?.id || !session?.user?.role) {
            toast.current?.show({ severity: "error", summary: "Not signed in", detail: "You must be signed in to change your password.", life: 5000, icon: "pi pi-exclamation-triangle" });
            return;
        }

        if (strengthScore < 2) {
            toast.current?.show({ severity: "warn", summary: "Weak Password", detail: "Please choose a stronger password.", life: 4000, icon: "pi pi-lock" });
            return;
        }

        setSaving(true);

        try {
            const payload = {
                userId: session.user.id,
                role: session.user.role,
                oldPassword: vals.oldPassword,
                newPassword: vals.newPassword,
            };

            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            let json: any = null;
            try {
                json = await res.json();
            } catch (e) {
                // ignore non-json
            }

            if (!res.ok) {
                const code = json?.code ?? json?.error;
                const message = json?.message ?? undefined;
                toast.current?.show(mapResponseToToast({ code, status: res.status, message }));
                return;
            }

            // SUCCESS: show success toast then close dialog after a short delay
            toast.current?.show({ severity: "success", summary: "Success", detail: "Password changed successfully.", life: 1800, icon: "pi pi-check" });

            // clear any previous timer
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
                timerRef.current = null;
            }

            // close after a short delay so user can see the toast
            timerRef.current = window.setTimeout(() => {
                reset();
                setVisible(false);
                timerRef.current = null;
            }, 900);
        } catch (err: any) {
            console.error("change password error", err);
            toast.current?.show(mapResponseToToast({ status: 500, message: err?.message }));
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        // clear pending close timer if user cancels
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setVisible(false);
        reset();
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-800 p-6">
            <Toast ref={toast} />
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-full bg-white/10 border border-white/8">
                            <FaLock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-white text-2xl font-semibold">Account Security</h1>
                            <p className="text-white/80 text-sm">Change your account password securely.</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <p className="text-sm text-white/80 mb-4">To update your account password, click the button below. You will be asked to supply your current password and pick a new one.</p>

                        <div className="flex justify-center">
                            <Button
                                label="Change password"
                                icon="pi pi-key"
                                className="p-button-rounded p-button-lg p-button-secondary bg-gradient-to-r from-indigo-500 to-cyan-500 border-0 shadow-md"
                                onClick={() => setVisible(true)}
                            />
                        </div>

                        <div className="mt-6 text-xs text-white/50 text-center">
                            <span>Signed in as </span>
                            <span className="font-medium">{session?.user?.email ?? session?.user?.name ?? "—"}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Dialog / Modal */}
            <Dialog
                header={
                    <div className="flex items-center gap-3">
                        <FaLock className="text-indigo-600" />
                        <div>
                            <div className="text-lg font-semibold">Change password</div>
                            <div className="text-sm text-gray-500">Enter your current password and choose a new one</div>
                        </div>
                    </div>
                }
                visible={visible}
                style={{ width: "30vw", borderRadius: 12 }}
                onHide={handleClose}
                modal
                breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
                className="rounded-xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
                        <Controller
                            control={control}
                            name="oldPassword"
                            rules={{ required: "Current password is required" }}
                            render={({ field }) => (
                                <Password
                                    {...field}
                                    toggleMask
                                    feedback={false}
                                    className={`w-full block ${errors.oldPassword ? "p-invalid" : ""}`}
                                    inputClassName="w-full p-3 border-2 rounded-lg transition-all duration-300"
                                />
                            )}
                        />
                        {errors.oldPassword && <small className="text-red-600">{errors.oldPassword.message}</small>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New password</label>
                        <Controller
                            control={control}
                            name="newPassword"
                            rules={{
                                required: "New password is required",
                                minLength: { value: 8, message: "At least 8 characters required" },
                                validate: (v) => (v !== watch("oldPassword") ? true : "New password must differ from current password"),
                            }}
                            render={({ field }) => (
                                <Password
                                    {...field}
                                    toggleMask
                                    feedback={false}
                                    className={`w-full block ${errors.newPassword ? "p-invalid" : ""}`}
                                    inputClassName="w-full p-3 border-2 rounded-lg transition-all duration-300"
                                />
                            )}
                        />
                        {errors.newPassword ? <small className="text-red-600">{errors.newPassword.message}</small> : <PasswordStrengthBar score={strengthScore} />}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm new password</label>
                        <Controller
                            control={control}
                            name="confirmPassword"
                            rules={{
                                required: "Confirm password is required",
                                validate: (v) => v === watch("newPassword") || "Passwords do not match",
                            }}
                            render={({ field }) => (
                                <Password
                                    {...field}
                                    toggleMask
                                    feedback={false}
                                    className={`w-full block ${errors.confirmPassword ? "p-invalid" : ""}`}
                                    inputClassName="w-full p-3 border-2 rounded-lg transition-all duration-300"
                                />
                            )}
                        />
                        {errors.confirmPassword && <small className="text-red-600">{errors.confirmPassword.message}</small>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" label="Cancel" className="p-button-text" onClick={handleClose} disabled={saving} />
                        <Button type="submit" label={saving ? "Saving..." : "Save"} icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"} className="p-button-primary" loading={saving} />
                    </div>
                </form>
            </Dialog>
        </main>
    );
};

export default SecurityOnlyChangePassword;
