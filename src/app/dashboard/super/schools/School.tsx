import React, { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import Link from "next/link";
import { Badge } from "primereact/badge";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropbox } from "dropbox";
import type { School } from "@/generated/prisma";

interface SchoolProps {
    school: School & {
        students?: { id: string }[];
        teachers?: { id: string }[];
        subjects?: { id: string }[];
    };
    visible: boolean;
    onClose: () => void;
}

export default function SchoolDialog({ school, visible, onClose }: SchoolProps) {
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
            if (!school.logo) {
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
                const response = await dbx.filesGetTemporaryLink({ path: school.logo });
                setImgUrl(response.result.link);
            } catch (err) {
                console.error("Error fetching Dropbox link:", err);
                setImgUrl("/assets/profile.png");
            } finally {
                setImgLoading(false);
            }
        };

        fetchLink();
    }, [school.logo]);

    const labelClass = "font-semibold text-xs sm:text-sm text-gray-700";
    const valueClass = "text-sm sm:text-base text-gray-500";

    return (
        <Dialog
            header="School Details"
            visible={visible}
            onHide={onClose}
            breakpoints={{ "1024px": "70vw", "640px": "90vw" }}
            style={{ width: "90vw", maxWidth: "70vw", borderRadius: "1rem" }}
        >
            <div className="flex flex-col md:flex-row gap-4 bg-gray-100 p-4">
                {/* Logo & Name */}
                <div className="flex flex-col items-center md:items-start md:w-2/5 bg-white rounded-lg shadow p-4">
                    <div className="relative flex items-center w-full h-32 sm:w-40 sm:h-40 mb-2">
                        {imgLoading ? (
                            <div className="flex items-center justify-center w-full h-full">
                                <ProgressSpinner strokeWidth="4" />
                            </div>
                        ) : (
                            <div className="w-32 h-32 sm:w-40 sm:h-40 overflow-hidden rounded-full">
                                <img
                                    src={imgUrl}
                                    alt="Logo"
                                    className="w-full h-full object-contain rounded-lg"
                                    onError={(e) => {
                                        e.currentTarget.src = "/assets/profile.png";
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    <h2 className="mt-2 text-lg sm:text-2xl font-bold text-gray-800 text-center md:text-left">
                        {school.name}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 text-center md:text-left">
                        {school.subtitle}
                    </p>
                </div>

                {/* Details */}
                <div className="flex-1 bg-white rounded-lg shadow p-4 space-y-3">
                    {[
                        ["School Type", school.schooltype],
                        ["Phone", school.phone],
                        ["Email", school.email],
                        ["Address", school.address],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <span className={`${valueClass} sm:w-2/3`}>{val}</span>
                        </div>
                    ))}

                    <h3 className="mt-4 text-sm sm:text-base font-bold border-t pt-2">
                        Contact Person
                    </h3>
                    {[
                        ["Name", school.contactperson],
                        ["Phone", school.contactpersonphone],
                        ["Email", school.contactpersonemail],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <span className={`${valueClass} sm:w-2/3`}>{val}</span>
                        </div>
                    ))}

                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Students:</span>
                        <Badge value={school.students?.length ?? 0} severity="info" className="sm:ml-2 inline-block" />
                    </div>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Teachers:</span>
                        <Badge value={school.teachers?.length ?? 0} severity="info" className="sm:ml-2 inline-block" />
                    </div>
                    <div className="flex flex-col items-start sm:flex-row sm:items-center">
                        <span className={`${labelClass} sm:w-1/3`}>Subjects:</span>
                        <Badge value={school.subjects?.length ?? 0} severity="info" className="sm:ml-2 inline-block" />
                    </div>

                    <h3 className="mt-4 text-sm sm:text-base font-bold border-t pt-2">
                        Registration Number
                    </h3>
                    {[
                        ["Count", school.regnumbercount],
                        ["Prefix", school.regnumberprepend],
                        ["Suffix", school.regnumberappend],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <span className={`${valueClass} sm:w-2/3`}>{val}</span>
                        </div>
                    ))}

                    <h3 className="mt-4 text-sm sm:text-base font-bold border-t pt-2">
                        Social Media
                    </h3>
                    {[
                        ["Facebook", school.facebook],
                        ["YouTube", school.youtube],
                    ].map(([label, val]) => (
                        <div key={label} className="flex flex-col items-start sm:flex-row sm:items-center">
                            <span className={`${labelClass} sm:w-1/3`}>{label}:</span>
                            <Link
                                href={val || "#"}
                                target="_blank"
                                className={`${valueClass} hover:underline sm:w-2/3`}
                            >
                                {val || "—"}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </Dialog>
    );
}
