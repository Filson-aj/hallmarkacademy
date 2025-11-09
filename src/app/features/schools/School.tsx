"use client";

import React, { useRef, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import { Button } from "primereact/button";
import { TabView, TabPanel } from "primereact/tabview";
import ImageView, { UploadResult } from "@/components/ImageView/ImageView";
import { useSchoolById, useUpdateSchool } from "@/hooks/useSchools";

const School: React.FC = () => {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const toast = useRef<Toast>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const { data: school, isLoading, error } = useSchoolById(id);
    const updateMutation = useUpdateSchool();

    // Handle logo update
    const handleLogoChange = useCallback(
        async (meta: UploadResult) => {
            if (!id) return;
            try {
                await updateMutation.mutateAsync({
                    id,
                    data: { logo: meta.path },
                });

                toast.current?.show({
                    severity: "success",
                    summary: "Logo Updated",
                    detail: "School logo has been updated successfully.",
                });
            } catch (err: any) {
                toast.current?.show({
                    severity: "error",
                    summary: "Update Failed",
                    detail: err?.message || "Could not update logo.",
                });
            }
        },
        [id, updateMutation]
    );

    const handleBack = () => {
        router.back();
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !school) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-red-600">Failed to load school details.</p>
                    <Button label="Back" icon="pi pi-arrow-left" onClick={handleBack} className="mt-4" />
                </div>
            </main>
        );
    }

    const imageDropboxPath = school.logo?.startsWith("/") ? school.logo : null;
    const fallbackImageSrc = school.logo && !imageDropboxPath ? school.logo : "/assets/profile.png";

    return (
        <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-12">
            <div className="max-w-7xl mx-auto">
                <Toast ref={toast} />

                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex items-center gap-4">
                        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-indigo-50 shadow-sm overflow-visible">
                            {imageDropboxPath ? (
                                <ImageView
                                    path={imageDropboxPath}
                                    onChange={handleLogoChange}
                                    placeholder={fallbackImageSrc}
                                    className="w-24 h-24 rounded-full"
                                    width={96}
                                    height={96}
                                    alt={`${school.name} logo`}
                                    editable={true}
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-gray-300">
                                    <img
                                        src={fallbackImageSrc}
                                        alt={`${school.name} logo`}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.currentTarget.src = "/assets/profile.png";
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                {school.name}
                            </h1>
                            {school.subtitle && (
                                <p className="text-sm text-gray-500">{school.subtitle}</p>
                            )}
                        </div>
                    </div>

                    <Button
                        icon="pi pi-arrow-left"
                        label="Back"
                        onClick={handleBack}
                        className="bg-red-500 border border-red-200 rounded-xl shadow-sm text-sm font-medium hover:shadow-md hover:bg-red-600 transition-all duration-300"
                    />
                </header>

                {/* Quick Jump */}
                <div className="flex gap-2 justify-end mb-4">
                    <Button
                        onClick={() => setActiveIndex(0)}
                        className="px-3 py-1 rounded-full text-xs sm:text-sm"
                        outlined={activeIndex !== 0}
                        label="Overview"
                    />
                    <Button
                        onClick={() => setActiveIndex(1)}
                        className="px-3 py-1 rounded-full text-xs sm:text-sm"
                        outlined={activeIndex !== 1}
                        label="Contact"
                    />
                    <Button
                        onClick={() => setActiveIndex(2)}
                        className="px-3 py-1 rounded-full text-xs sm:text-sm"
                        outlined={activeIndex !== 2}
                        label="Registration"
                    />
                    <Button
                        onClick={() => setActiveIndex(3)}
                        className="px-3 py-1 rounded-full text-xs sm:text-sm"
                        outlined={activeIndex !== 3}
                        label="Social"
                    />
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                        {/* Overview */}
                        <TabPanel header="Overview">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <dl className="text-sm text-gray-600 space-y-4">
                                        <div>
                                            <dt className="font-semibold">School Type</dt>
                                            <dd>{school.schooltype || "–"}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold">Email</dt>
                                            <dd>{school.email || "–"}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold">Phone</dt>
                                            <dd>{school.phone || "–"}</dd>
                                        </div>
                                        <div>
                                            <dt className="font-semibold">Address</dt>
                                            <dd>{school.address || "–"}</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div>
                                    <dl className="text-sm text-gray-600 space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <dt className="font-semibold">Students</dt>
                                                <dd>
                                                    <Badge value={school._count?.students ?? 0} severity="info" />
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold">Teachers</dt>
                                                <dd>
                                                    <Badge value={school._count?.teachers ?? 0} severity="info" />
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="font-semibold">Subjects</dt>
                                                <dd>
                                                    <Badge value={school._count?.subjects ?? 0} severity="info" />
                                                </dd>
                                            </div>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </TabPanel>

                        {/* Contact Person */}
                        <TabPanel header="Contact Person">
                            {school.contactperson ? (
                                <dl className="text-sm text-gray-600 space-y-4">
                                    <div>
                                        <dt className="font-semibold">Name</dt>
                                        <dd>{school.contactperson}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold">Phone</dt>
                                        <dd>{school.contactpersonphone || "–"}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold">Email</dt>
                                        <dd>{school.contactpersonemail || "–"}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-sm text-gray-500">No contact person assigned.</p>
                            )}
                        </TabPanel>

                        {/* Registration Settings */}
                        <TabPanel header="Registration">
                            <dl className="text-sm text-gray-600 space-y-4">
                                <div>
                                    <dt className="font-semibold">Start Count</dt>
                                    <dd>{school.regnumbercount}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold">Prefix</dt>
                                    <dd>{school.regnumberprepend || "–"}</dd>
                                </div>
                                <div>
                                    <dt className="font-semibold">Suffix</dt>
                                    <dd>{school.regnumberappend || "–"}</dd>
                                </div>
                            </dl>
                        </TabPanel>

                        {/* Social Media */}
                        <TabPanel header="Social Media">
                            <dl className="text-sm text-gray-600 space-y-4">
                                {school.facebook && (
                                    <div>
                                        <dt className="font-semibold">Facebook</dt>
                                        <dd>
                                            <a
                                                href={school.facebook}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                {school.facebook}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                                {school.youtube && (
                                    <div>
                                        <dt className="font-semibold">YouTube</dt>
                                        <dd>
                                            <a
                                                href={school.youtube}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-red-600 hover:underline"
                                            >
                                                {school.youtube}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                                {!school.facebook && !school.youtube && (
                                    <p className="text-sm text-gray-500">No social media links added.</p>
                                )}
                            </dl>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </main>
    );
};

export default School;