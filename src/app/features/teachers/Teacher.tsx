import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { Badge } from "primereact/badge";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropbox } from "dropbox";
import type { Teacher } from "@/generated/prisma";

interface TeacherProps {
    teacher: Teacher & {
        school: { id: string; name: string };
        subjects: { id: string; name: string }[];
        lessons?: { id: string }[];
        classes?: { id: string }[];
    };
    visible: boolean;
    onClose: () => void;
}

export default function Teacher({ teacher, visible, onClose }: TeacherProps) {
    const [imgUrl, setImgUrl] = useState<string>("/assets/profile.png");
    const [imgLoading, setImgLoading] = useState<boolean>(false);

    async function getAccessToken(): Promise<string> {
        const res = await fetch("/api/dropbox/token");
        if (!res.ok) throw new Error("Could not refresh Dropbox token");
        const json = await res.json();
        if ("error" in json) throw new Error(json.error);
        return json.access_token;
    }

    useEffect(() => {
        const fetchLink = async () => {
            if (!teacher.avarta) {
                setImgUrl("/assets/profile.png");
                return;
            }
            setImgLoading(true);
            try {
                const accessToken = await getAccessToken();
                const dbx = new Dropbox({
                    accessToken,
                    fetch: window.fetch.bind(window),
                });
                const response = await dbx.filesGetTemporaryLink({ path: teacher.avarta });
                setImgUrl(response.result.link);
            } catch (err) {
                setImgUrl("/assets/profile.png");
            } finally {
                setImgLoading(false);
            }
        };

        fetchLink();
    }, [teacher.avarta]);

    const labelClass = "font-semibold text-xs sm:text-sm text-gray-700";
    const valueClass = "text-sm sm:text-base text-gray-500";

    return (
        <Dialog
            header="Teacher Details"
            visible={visible}
            onHide={onClose}
            breakpoints={{ "1024px": "70vw", "640px": "94vw" }}
        >
            <div className="flex flex-col md:flex-row gap-4 bg-gray-100 p-4 rounded-lg">
                {/* Avatar & Name */}
                <div className="flex flex-col items-center md:items-start md:w-2/5 bg-white rounded-lg shadow p-4">
                    <div className="relative flex items-center w-full h-32 sm:w-40 sm:h-40 mb-2">
                        {imgLoading ? (
                            <div className="flex items-center justify-center w-full h-full">
                                <ProgressSpinner strokeWidth="4" />
                            </div>
                        ) : (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center overflow-hidden rounded-full">
                                <img
                                    src={imgUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                        e.currentTarget.src = "/assets/profile.png";
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <h2 className="mt-2 text-lg sm:text-2xl font-bold text-gray-800 text-center">
                        {teacher.title} {teacher.firstname} {teacher.surname}
                        {teacher.othername && ` ${teacher.othername}`}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 text-center">
                        {teacher.email}
                    </p>
                </div>

                {/* Details */}
                <div className="flex-1 bg-white rounded-lg shadow p-4 space-y-3">
                    {[
                        ["School", teacher.school?.name || "—"],
                        ["Gender", teacher.gender],
                        ["Birthday", new Date(teacher.birthday || '').toLocaleDateString()],
                        ["Phone", teacher.phone || "—"],
                        ["Address", teacher.address],
                        ["State", teacher.state],
                        ["LGA", teacher.lga],
                        ["Blood Group", teacher.bloodgroup || "—"],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <span className={`${valueClass} sm:w-2/3`}>{val}</span>
                        </div>
                    ))}

                    <h3 className="mt-4 text-sm sm:text-base font-bold border-t pt-2">
                        Academic Information
                    </h3>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Subjects:</span>
                        <div className="sm:w-2/3">
                            {teacher.subjects?.length > 0 ? (
                                teacher.subjects.map((subject) => (
                                    <Badge
                                        key={subject.id}
                                        value={subject.name}
                                        severity="info"
                                        className="mr-2 mb-2 inline-block"
                                    />
                                ))
                            ) : (
                                <span className={valueClass}>—</span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Lessons:</span>
                        <Badge
                            value={teacher.lessons?.length ?? 0}
                            severity="info"
                            className="sm:ml-2 inline-block"
                        />
                    </div>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Classes (Form Master):</span>
                        <Badge
                            value={teacher.classes?.length ?? 0}
                            severity="info"
                            className="sm:ml-2 inline-block"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
}