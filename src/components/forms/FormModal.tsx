"use client";

import { useRef, Dispatch, SetStateAction, useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";

import { Toast } from "primereact/toast";

import {
    deleteClass,
    deleteTest,
    deleteStudent,
    deleteSubject,
    deleteTeacher,
} from "@/lib/actions";
import type { FormContainerProps } from "./FormContainer";

// map of delete actions
const deleteActionMap = {
    subject: deleteSubject,
    class: deleteClass,
    teacher: deleteTeacher,
    student: deleteStudent,
    test: deleteTest,
    // TODO: OTHER DELETE ACTIONS
    parent: deleteSubject,
    lesson: deleteSubject,
    assignment: deleteSubject,
    result: deleteSubject,
    attendance: deleteSubject,
    event: deleteSubject,
    announcement: deleteSubject,
};

// dynamically‑imported form components
const TeacherForm = dynamic(() => import("./TeacherForm"), {
    loading: () => <h1>Loading...</h1>,
});
const StudentForm = dynamic(() => import("./StudentForm"), {
    loading: () => <h1>Loading...</h1>,
});
/* const SubjectForm = dynamic(() => import("./forms/SubjectForm"), {
    loading: () => <h1>Loading...</h1>,
});
const ClassForm = dynamic(() => import("./forms/ClassForm"), {
    loading: () => <h1>Loading...</h1>,
});
const ExamForm = dynamic(() => import("./forms/ExamForm"), {
    loading: () => <h1>Loading...</h1>,
}); */

// helper to pick the right form
const forms: Record<
    string,
    (
        setOpen: Dispatch<SetStateAction<boolean>>,
        type: "create" | "update",
        data?: any,
        relatedData?: any
    ) => React.JSX.Element
> = {
    /*  subject: (setOpen, type, data, relatedData) => (
         <SubjectForm
             type={type}
             data={data}
             setOpen={setOpen}
             relatedData={relatedData}
         />
     ), */
    /*  class: (setOpen, type, data, relatedData) => (
         <ClassForm
             type={type}
             data={data}
             setOpen={setOpen}
             relatedData={relatedData}
         />
     ), */
    teacher: (setOpen, type, data, relatedData) => (
        <TeacherForm
            type={type}
            data={data}
            setOpen={setOpen}
            relatedData={relatedData}
        />
    ),
    student: (setOpen, type, data, relatedData) => (
        <StudentForm
            type={type}
            data={data}
            setOpen={setOpen}
            relatedData={relatedData}
        />
    ),
    /*  exam: (setOpen, type, data, relatedData) => (
         <ExamForm
             type={type}
             data={data}
             setOpen={setOpen}
             relatedData={relatedData}
         />
     ), */
};

const FormModal = ({
    table,
    type,
    data,
    id,
    relatedData,
}: FormContainerProps & { relatedData?: any }) => {
    // sizing & color for the open‐button
    const size = type === "create" ? "w-8 h-8" : "w-7 h-7";
    const bgColor =
        type === "create"
            ? "bg-lamaYellow"
            : type === "update"
                ? "bg-lamaSky"
                : "bg-lamaPurple";

    const [open, setOpen] = useState(false);

    // ref for PrimeReact Toast
    const toast = useRef<Toast>(null);

    // The inner form/render logic
    const Form = () => {
        const [state, formAction] = useFormState(deleteActionMap[table], {
            success: false,
            error: false,
        });

        const router = useRouter();

        // on successful delete, show toast and close
        useEffect(() => {
            if (state.success) {
                toast.current?.show({
                    severity: "success",
                    summary: `${table.charAt(0).toUpperCase() + table.slice(1)} Deleted`,
                    detail: `The ${table} has been deleted successfully.`,
                    life: 3000,
                });
                setOpen(false);
                router.refresh();
            }
            if (state.error) {
                toast.current?.show({
                    severity: "error",
                    summary: "Delete Failed",
                    detail: `Unable to delete the ${table}.`,
                    life: 3000,
                });
            }
        }, [state, router, table]);

        if (type === "delete" && id) {
            return (
                <form action={formAction} className="p-4 flex flex-col gap-4">
                    <input name="id" value={id} type="hidden" />
                    <span className="text-center font-medium">
                        All data will be lost. Are you sure you want to delete this {table}?
                    </span>
                    <button className="bg-red-700 text-white py-2 px-4 rounded-md border-none w-max self-center">
                        Delete
                    </button>
                </form>
            );
        }

        if (type === "create" || type === "update") {
            return forms[table](setOpen, type, data, relatedData);
        }

        return <div>Form not found!</div>;
    };

    return (
        <>
            {/* Toast must be included once in the tree */}
            <Toast ref={toast} />

            {/* Button to open modal */}
            <button
                className={`${size} flex items-center justify-center rounded-full ${bgColor}`}
                onClick={() => setOpen(true)}
            >
                <Image src={`/${type}.png`} alt="" width={16} height={16} />
            </button>

            {/* Modal overlay */}
            {open && (
                <div className="w-screen h-screen absolute left-0 top-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-md relative w-[90%] md:w-[70%] lg:w-[60%] xl:w-[50%] 2xl:w-[40%]">
                        <Form />
                        <div
                            className="absolute top-4 right-4 cursor-pointer"
                            onClick={() => setOpen(false)}
                        >
                            <Image src="/close.png" alt="Close" width={14} height={14} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FormModal;
