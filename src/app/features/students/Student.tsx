import React from "react";
import { Dialog } from "primereact/dialog";
import { Badge } from "primereact/badge";
import type { Student } from "@/generated/prisma";

interface StudentProps {
    student: Student & {
        school: { id: string; name: string };
        parent: { id: string; firstname: string; surname: string; othername: string };
        class: { id: string; name: string };
        grades?: { id: string }[];
        attendances?: { id: string }[];
        submissions?: { id: string }[];
    };
    visible: boolean;
    onClose: () => void;
}

export default function Student({ student, visible, onClose }: StudentProps) {
    const labelClass = "font-semibold text-xs sm:text-sm text-gray-700";
    const valueClass = "text-sm sm:text-base text-gray-500";

    return (
        <Dialog
            header="Student Details"
            visible={visible}
            onHide={onClose}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-lg">
                {/* Name */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow p-4">
                    <h2 className="mt-2 text-lg sm:text-2xl font-bold text-gray-800 text-center">
                        {student.firstname} {student.surname}
                        {student.othername && ` ${student.othername}`}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 text-center">
                        {student.email || student.username}
                    </p>
                </div>

                {/* Details */}
                <div className="flex-1 bg-white rounded-lg shadow p-4 space-y-3">
                    {[
                        ["School", student.school?.name || "—"],
                        ["Admission Number", student.admissionNumber || "—"],
                        ["Username", student.username || "—"],
                        ["Gender", student.gender],
                        ["Birthday", new Date(student.birthday || '').toLocaleDateString()],
                        ["Phone", student.phone || "—"],
                        ["Address", student.address || "—"],
                        ["State", student.state || "—"],
                        ["LGA", student.lga || "—"],
                        ["Blood Group", student.bloodgroup || "—"],
                        ["Student Type", student.studenttype || "—"],
                        ["House", student.house || "—"],
                        ["Religion", student.religion || "—"],
                        ["Parent", `${student.parent.firstname} ${student.parent.surname} ${student.parent.othername || ""}`.trim()],
                        ["Class", student.class?.name || "—"],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <span className={`${valueClass} sm:w-2/3`}>{val}</span>
                        </div>
                    ))}

                    <h3 className="mt-4 text-sm sm:text-base font-bold border-t border-gray-300 pt-2">
                        Academic Information
                    </h3>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Grades:</span>
                        <Badge
                            value={student.grades?.length ?? 0}
                            severity="info"
                            className="sm:ml-2 inline-block"
                        />
                    </div>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Attendances:</span>
                        <Badge
                            value={student.attendances?.length ?? 0}
                            severity="info"
                            className="sm:ml-2 inline-block"
                        />
                    </div>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Submissions:</span>
                        <Badge
                            value={student.submissions?.length ?? 0}
                            severity="info"
                            className="sm:ml-2 inline-block"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
}