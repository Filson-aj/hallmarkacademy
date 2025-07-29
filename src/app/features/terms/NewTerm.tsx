// components/NewTerm.tsx
"use client";

import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { termSchema, TermSchema } from "@/lib/schemas";

interface NewTermProps {
    close: () => void;
    onCreated: () => void;
}

const termOptions = [
    { label: 'First', value: 'First' },
    { label: 'Second', value: 'Second' },
    { label: 'Third', value: 'Third' }
];

export default function NewTerm({ close, onCreated }: NewTermProps) {
    const toast = useRef<Toast>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TermSchema>({
        resolver: zodResolver(termSchema),
        mode: "onBlur",
    });

    const show = (
        severity: "success" | "error",
        summary: string,
        detail: string
    ) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    };

    interface ApiResponse {
        ok: boolean;
        message: string;
        data?: unknown;
    }

    const onSubmit = async (data: TermSchema) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
            };

            const response = await fetch("/api/terms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result: ApiResponse = await response.json();
            if (response.ok) {
                show("success", "Term Created", "The term has been created successfully.");
                setTimeout(() => {
                    reset();
                    close();
                    onCreated();
                }, 3000);
            } else {
                show("error", "Creation Error", result.message || "Failed to create term record, please try again.");
            }
        } catch (err: any) {
            show("error", "Creation Error", err.message || "Could not create term record.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            header="Add New Term"
            visible
            onHide={close}
            style={{ width: "50vw" }}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <Toast ref={toast} />

            <form onSubmit={handleSubmit(onSubmit)} className="p-fluid space-y-4">
                {/* Session */}
                <div className="p-field">
                    <label htmlFor="name">Name</label>
                    <InputText
                        id="session"
                        placeholder="Enter session"
                        {...register("session")}
                        className={errors.session ? "p-invalid" : ""}
                    />
                    {errors.session && <small className="p-error">{errors.session.message}</small>}
                </div>

                {/* Term */}
                <div className="p-field">
                    <label>Term</label>
                    <Controller
                        name="term"
                        control={control}
                        render={({ field }) => (
                            <Dropdown
                                id="term"
                                {...field}
                                options={termOptions}
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Select a term"
                                className={errors.term ? "p-invalid" : ""}
                            />
                        )}
                    />
                    {errors.term && (
                        <small className="p-error">{errors.term.message}</small>
                    )}
                </div>

                {/* Start */}
                <div className='flex flex-col mb-1'>
                    <label htmlFor='start' className='block text-gray-400 font-medium mb-2'>
                        Start
                    </label>
                    <Controller
                        name='start'
                        control={control}
                        render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat='dd/mm/yy'
                                showIcon
                                placeholder='Term start date'
                            />
                        )}
                    />
                    {errors.start && (
                        <p className='text-red-500 text-sm'>{errors.start.message}</p>
                    )}
                </div>

                {/* End */}
                <div className='flex flex-col mb-1'>
                    <label htmlFor='end' className='block text-gray-400 font-medium mb-2'>
                        End
                    </label>
                    <Controller
                        name='end'
                        control={control}
                        render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat='dd/mm/yy'
                                showIcon
                                placeholder='Term end date'
                            />
                        )}
                    />
                    {errors.end && (
                        <p className='text-red-500 text-sm'>{errors.end.message}</p>
                    )}
                </div>

                {/* Beginning of next term */}
                <div className='flex flex-col mb-1'>
                    <label htmlFor='nextterm' className='block text-gray-400 font-medium mb-2'>
                        Next Term Begins
                    </label>
                    <Controller
                        name='nextterm'
                        control={control}
                        render={({ field }) => (
                            <Calendar
                                value={field.value}
                                onChange={(e) => field.onChange(e.value)}
                                dateFormat='dd/mm/yy'
                                showIcon
                                placeholder='Next term date'
                            />
                        )}
                    />
                    {errors.nextterm && (
                        <p className='text-red-500 text-sm'>{errors.nextterm.message}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-end gap-2 mt-3">
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
