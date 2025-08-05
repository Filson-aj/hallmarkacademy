"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "./InputField";
import Image from "next/image";
import {
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
    useRef,
} from "react";
import { teacherSchema, TeacherSchema } from "@/lib/schemas";
import { useFormState } from "react-dom";
import { createTeacher, updateTeacher } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { CldUploadWidget } from "next-cloudinary";

const TeacherForm = ({
    type,
    data,
    setOpen,
    relatedData,
}: {
    type: "create" | "update";
    data?: any;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: any;
}) => {
    const toast = useRef<Toast>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<TeacherSchema>({
        resolver: zodResolver(teacherSchema),
    });

    const [img, setImg] = useState<any>();

    const [state, formAction] = useFormState(
        type === "create" ? createTeacher : updateTeacher,
        {
            success: false,
            error: false,
        }
    );

    const router = useRouter();

    const onSubmit = handleSubmit((formData) => {
        formAction({ ...formData, avarta: img?.secure_url });
    });

    // show Toast on success / error
    useEffect(() => {
        if (state.success) {
            toast.current?.show({
                severity: "success",
                summary:
                    type === "create"
                        ? "Teacher Created"
                        : "Teacher Updated",
                detail: `The teacher has been ${type === "create" ? "created" : "updated"
                    } successfully.`,
                life: 3000,
            });
            setOpen(false);
            router.refresh();
        }
        if (state.error) {
            toast.current?.show({
                severity: "error",
                summary: "Operation Failed",
                detail: `Could not ${type} the teacher.`,
                life: 3000,
            });
        }
    }, [state, type, setOpen, router]);

    const { subjects } = relatedData || { subjects: [] };

    return (
        <>
            <Toast ref={toast} />

            <form className="flex flex-col gap-8" onSubmit={onSubmit}>
                <h1 className="text-xl font-semibold">
                    {type === "create"
                        ? "Create a new teacher"
                        : "Update the teacher"}
                </h1>

                <span className="text-xs text-gray-400 font-medium">
                    Authentication Information
                </span>
                <div className="flex justify-between flex-wrap gap-4">
                    <InputField
                        label="Email"
                        name="email"
                        defaultValue={data?.email}
                        register={register}
                        error={errors.email}
                    />
                    <InputField
                        label="Password"
                        name="password"
                        type="password"
                        defaultValue={data?.password}
                        register={register}
                        error={errors.password}
                    />
                </div>

                <span className="text-xs text-gray-400 font-medium">
                    Personal Information
                </span>
                <div className="flex justify-between flex-wrap gap-4">
                    <InputField
                        label="First Name"
                        name="firstname"
                        defaultValue={data?.firstname}
                        register={register}
                        error={errors.firstname}
                    />
                    <InputField
                        label="Last Name"
                        name="surname"
                        defaultValue={data?.surname}
                        register={register}
                        error={errors.surname}
                    />
                    <InputField
                        label="Phone"
                        name="phone"
                        defaultValue={data?.phone}
                        register={register}
                        error={errors.phone}
                    />
                    <InputField
                        label="Address"
                        name="address"
                        defaultValue={data?.address}
                        register={register}
                        error={errors.address}
                    />
                    <InputField
                        label="Blood Type"
                        name="bloodgroup"
                        defaultValue={data?.bloodgroup}
                        register={register}
                        error={errors.bloodgroup}
                    />
                    <InputField
                        label="Birthday"
                        name="birthday"
                        type="date"
                        defaultValue={
                            data?.birthday
                                ? data.birthday.toISOString().split("T")[0]
                                : undefined
                        }
                        register={register}
                        error={errors.birthday}
                    />

                    {/* Hidden ID on update */}
                    {type === "update" && data?.id && (
                        <InputField
                            label="Id"
                            name="id"
                            defaultValue={data.id}
                            register={register}
                            error={errors.id}
                            hidden
                        />
                    )}

                    {/* Gender select */}
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-xs text-gray-500">Gender</label>
                        <select
                            {...register("gender")}
                            defaultValue={data?.gender}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                        {errors.gender && (
                            <p className="text-xs text-red-400">
                                {errors.gender.message}
                            </p>
                        )}
                    </div>

                    {/* Subjects multi‑select */}
                    <div className="flex flex-col gap-2 w-full md:w-1/4">
                        <label className="text-xs text-gray-500">Subjects</label>
                        <select
                            multiple
                            {...register("subjects")}
                            defaultValue={data?.subjects}
                            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        >
                            {subjects.map((sub: { id: string; name: string }) => (
                                <option value={sub.id} key={sub.id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                        {errors.subjects && (
                            <p className="text-xs text-red-400">
                                {errors.subjects.message as string}
                            </p>
                        )}
                    </div>

                    {/* Cloudinary Upload */}
                    <CldUploadWidget
                        uploadPreset="school"
                        onSuccess={(result, { widget }) => {
                            setImg(result.info);
                            widget.close();
                        }}
                    >
                        {({ open }) => (
                            <div
                                onClick={() => open()}
                                className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer"
                            >
                                <Image
                                    src="/upload.png"
                                    alt="Upload"
                                    width={28}
                                    height={28}
                                />
                                <span>Upload a photo</span>
                            </div>
                        )}
                    </CldUploadWidget>
                </div>

                <button className="bg-blue-400 text-white p-2 rounded-md">
                    {type === "create" ? "Create" : "Update"}
                </button>
            </form>
        </>
    );
};

export default TeacherForm;
