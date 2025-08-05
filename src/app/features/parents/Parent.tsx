import React from "react";
import { Dialog } from "primereact/dialog";
import { Badge } from "primereact/badge";
import type { Parent } from "@/generated/prisma";

interface ParentProps {
    parent: Parent & {
        students: { id: string; firstname: string; othername?: string; surname: string }[];
    };
    visible: boolean;
    onClose: () => void;
}

export default function Parent({ parent, visible, onClose }: ParentProps) {
    const labelClass = "font-semibold text-xs sm:text-sm text-gray-700";
    const valueClass = "text-sm sm:text-base text-gray-500";

    return (
        <Dialog
            header="Parent Details"
            visible={visible}
            onHide={onClose}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <div className="flex flex-col gap-4 bg-gray-100 p-4 rounded-lg">
                {/* Name & Email */}
                <div className="flex flex-col items-center bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 text-center">
                        {parent.title} {parent.firstname} {parent.surname}
                        {parent.othername && ` ${parent.othername}`}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 text-center">
                        {parent.email}
                    </p>
                </div>

                {/* Details */}
                <div className="bg-white rounded-lg shadow p-4 space-y-3">
                    {[
                        ["Username", parent.username || "—"],
                        ["Gender", parent.gender],
                        ["Birthday", parent.birthday ? new Date(parent.birthday).toLocaleDateString() : "—"],
                        ["Phone", parent.phone || "—"],
                        ["Address", parent.address || "—"],
                        ["State", parent.state || "—"],
                        ["LGA", parent.lga || "—"],
                        ["Blood Group", parent.bloodgroup || "—"],
                        ["Occupation", parent.occupation || "—"],
                        ["Religion", parent.religion || "—"],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <span className={`${valueClass} sm:w-2/3`}>{val}</span>
                        </div>
                    ))}

                    <h3 className="mt-4 text-sm sm:text-base font-bold border-t border-gray-300 pt-2">
                        Family Information
                    </h3>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Children:</span>
                        <div className="sm:w-2/3">
                            {parent.students?.length > 0 ? (
                                parent.students.map((student) => (
                                    <Badge
                                        key={student.id}
                                        value={`${student.firstname} ${student.othername || ''} ${student.surname}`.trim()}
                                        severity="info"
                                        className="mr-2 mb-2 inline-block"
                                    />
                                ))
                            ) : (
                                <span className={valueClass}>—</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}