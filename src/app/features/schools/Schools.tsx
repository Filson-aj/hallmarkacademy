"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Building2, Trash2, Edit, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta, DataTableFilterMetaData } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import { Badge } from "primereact/badge";
import moment from "moment";

import Spinner from "@/components/Spinner/Spinner";
import { useSchools, useDeleteSchools } from "@/hooks/useSchools";

const Schools: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);
    const [loading, setLoading] = useState(false);

    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role?.toLowerCase() || "guest";
    const permit = ["super", "admin"].includes(role);

    // TanStack Query
    const { data: rawSchools = [], isLoading, error } = useSchools();
    const deleteMutation = useDeleteSchools();

    // Enrich data for search
    const schools = React.useMemo(() => {
        return rawSchools.map((s: any) => ({
            ...s,
            displayName: s.name || "–",
            typeDisplay: s.schooltype || "–",
            phoneDisplay: s.phone || "–",
            dateDisplay: s.createdAt ? moment(s.createdAt).format("DD MMM YYYY") : "–",
            studentCount: s._count?.students ?? 0,
            teacherCount: s._count?.teachers ?? 0,
        }));
    }, [rawSchools]);

    // Toast
    const show = useCallback(
        (type: "success" | "error" | "info" | "warn", title: string, message: string) => {
            toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
        },
        []
    );

    // Confirm delete
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message: ids.length === 1
                    ? "Delete this school?"
                    : `Delete ${ids.length} school(s)?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        await deleteMutation.mutateAsync(ids);
                        show("success", "Deleted", `${ids.length} school(s) deleted.`);
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Error", err.message || "Failed to delete.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [deleteMutation, show]
    );

    // Single delete
    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );

    // Navigation
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${role}/schools/new`);
    }, [role, router]);

    const handleView = useCallback((school: any) => {
        router.push(`/dashboard/${role}/schools/${school.id}/view`);
    }, [role, router]);

    const handleEdit = useCallback((school: any) => {
        router.push(`/dashboard/${role}/schools/${school.id}/edit`);
    }, [role, router]);

    // Action column
    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent"
                onClick={e => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
            />
        ),
        []
    );

    // Overlay actions
    const getOverlayActions = useCallback((school: any) => [
        { label: "View", icon: <Eye className="w-4 h-4 mr-2" />, action: () => handleView(school) },
        { label: "Edit", icon: <Edit className="w-4 h-4 mr-2" />, action: () => handleEdit(school) },
        { label: "Delete", icon: <Trash2 className="w-4 h-4 mr-2" />, action: () => deleteOne(school.id) },
    ], [handleView, handleEdit, deleteOne]);

    // Error handling
    useEffect(() => {
        if (error) {
            show("error", "Load Failed", "Could not load schools. Please refresh.");
        }
    }, [error, show]);

    // Loading
    if (isLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(deletingIds.length > 0 || deleteMutation.isPending) && <Spinner visible onHide={() => setLoading(false)} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">All Schools</h1>
                            <p className="text-sm text-gray-500">Manage registered educational institutions.</p>
                        </div>
                    </div>

                    {permit && (
                        <Button
                            label="Add School"
                            icon="pi pi-plus"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                            onClick={handleNew}
                        />
                    )}
                </header>

                {/* Search */}
                <div className="px-2 border-t border-gray-200 py-4">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search by name, type, phone..."
                            onInput={e => setFilters({
                                global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS }
                            })}
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 px-8 py-2 transition-all"
                        />
                    </span>
                </div>

                {/* Table */}
                <div>
                    <DataTable
                        value={schools}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        globalFilterFields={["displayName", "typeDisplay", "phoneDisplay",]}
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        selection={selected}
                        onSelectionChange={e => setSelected(e.value)}
                        emptyMessage="No schools found."
                        selectionMode="multiple"
                    >
                        {permit && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}

                        <Column
                            field="displayName"
                            header="Name"
                            body={row => row.displayName}
                            sortable
                        />

                        <Column
                            field="typeDisplay"
                            header="Type"
                            body={row => row.typeDisplay}
                            sortable
                        />

                        <Column field="phoneDisplay" header="Phone" />

                        <Column
                            header="No. Students"
                            body={row => <Badge value={row.studentCount} severity="info" />}
                            style={{ width: "8rem", textAlign: "center" }}
                        />

                        <Column
                            header="No. Teachers"
                            body={row => <Badge value={row.teacherCount} severity="info" />}
                            style={{ width: "8rem", textAlign: "center" }}
                        />

                        <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                    </DataTable>
                </div>
            </div>

            {/* Bulk Delete */}
            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} school(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
                        loading={deleteMutation.isPending}
                        disabled={deleteMutation.isPending}
                    />
                </div>
            )}

            {/* Context Menu */}
            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current && getOverlayActions(current).map(({ label, icon, action }) => (
                        <Button
                            key={label}
                            className="p-button-text text-gray-900 hover:bg-gray-100 w-full text-left px-4 py-2 rounded-none flex items-center"
                            onClick={action}
                        >
                            {icon}
                            <span className="ml-2">{label}</span>
                        </Button>
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Schools;