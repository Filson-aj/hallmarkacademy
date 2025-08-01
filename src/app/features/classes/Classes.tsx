"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DataTable } from "primereact/datatable";
import type { DataTableFilterMeta, DataTableFilterMetaData } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { OverlayPanel } from "primereact/overlaypanel";
import { confirmDialog } from "primereact/confirmdialog";
import { FilterMatchMode } from "primereact/api";
import { Toast } from "primereact/toast";
import Spinner from "@/components/Spinner/Spinner";
import NewClass from "./NewClass";
import EditClass from "./EditClass";

const Classes: React.FC = () => {
    const { data: session } = useSession();
    const [classes, setClasses] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [create, setCreate] = useState(false);
    const [edit, setEdit] = useState(false);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || 'Guest';

    useEffect(() => {
        fetchData();
    }, []);

    const show = useCallback((
        type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
        title: string,
        message: string
    ) => {
        toast.current?.show({ severity: type, summary: title, detail: message });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/classes");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setClasses(data?.data);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch classes record, please try again.");
        } finally {
            setLoading(false);
        }
    };

    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/classes?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1
                        ? "Do you really want to delete this record?"
                        : `Do you really want to delete these ${ids.length} records?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        await deleteApi(ids);
                        show(
                            "success",
                            "Deleted",
                            ids.length === 1
                                ? "Class deleted successfully."
                                : `${ids.length} classes deleted successfully.`
                        );
                        setClasses(prev => prev.filter(s => !ids.includes(s.id)));
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err.message || "Failed to delete class record, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [show]
    );

    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );

    const handleNew = useCallback(() => setCreate(true), []);

    const handleEdit = useCallback(() => {
        setEdit(true);
        panel.current?.hide();
    }, []);

    const handleUpdate = useCallback(
        (updated: any) => {
            setClasses(prev => prev.map(s => (s.id === updated.id ? updated : s)));
            setEdit(false);
        },
        [show]
    );

    const handleNewClass = useCallback(
        (newClass: any) => {
            setClasses(prev => [...prev, newClass]);
            setCreate(false);
        },
        [show]
    );

    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={e => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
            />
        ),
        []
    );

    const overlayActions = [
        { label: "Edit", icon: "pi pi-pencil", action: handleEdit },
        { label: "Delete", icon: "pi pi-trash", action: () => current && deleteOne(current.id) },
    ];

    /* Loading effect */
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {deletingIds.length > 0 && <Spinner visible onHide={() => setDeletingIds([])} />}
            {create && <NewClass close={() => setCreate(false)} onCreated={handleNewClass} />}
            {edit && current && (
                <EditClass
                    classData={current}
                    close={() => setEdit(false)}
                    onUpdated={handleUpdate}
                />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Classes</h1>
                    <Button label="Add New" icon="pi pi-plus" onClick={handleNew} className="p-button-sm" />
                </div>

                <div className="px-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search classes..."
                            onInput={e =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                <DataTable
                    value={classes}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    stripedRows
                    filters={filters}
                    filterDisplay="menu"
                    scrollable
                    scrollHeight="400px"
                    dataKey="id"
                    selection={selected}
                    onSelectionChange={e => setSelected(e.value)}
                    loading={loading}
                    emptyMessage="No classes found."
                    selectionMode="multiple"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                    <Column field='name' header='Name' sortable />
                    <Column field='capacity' header='Capacity' />
                    <Column
                        header="Form Master"
                        body={(rowData) =>
                            rowData.formmaster
                                ? `${rowData.formmaster.title || ""} ${rowData.formmaster.firstname} ${rowData.formmaster.othername} ${rowData.formmaster.surname}`.trim()
                                : '–'
                        }
                    />
                    {role.toLocaleLowerCase() === 'super' && (
                        <Column
                            header="School"
                            body={(rowData) =>
                                rowData.school
                                    ? `${rowData.school.name || ""}`.trim()
                                    : '–'
                            }
                        />
                    )}
                    <Column
                        header="Students"
                        body={(rowData) => rowData._count?.students ?? 0}
                    />
                    <Column body={actionBody} header="Actions" style={{ textAlign: 'center', width: '4rem' }} />
                </DataTable>
            </div>

            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} record(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0}
                    />
                </div>
            )}

            <OverlayPanel ref={panel}>
                <div className="flex flex-col">
                    {overlayActions.map(({ label, icon, action }) => (
                        <Button
                            key={label}
                            label={label}
                            icon={icon}
                            className="p-button-text text-gray-900 hover:text-blue-600"
                            onClick={action}
                        />
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Classes;
