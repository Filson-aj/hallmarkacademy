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
import Student from "./Student";
import NewStudent from "./NewStudent";
import EditStudent from "./EditStudent";

const Students: React.FC = () => {
    const { data: session } = useSession();
    const [students, setStudents] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [view, setView] = useState(false);
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
            const res = await fetch("/api/students");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { data } = await res.json();
            setStudents(data);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch students, please try again.");
        } finally {
            setLoading(false);
        }
    };

    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/students?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || `Status ${res.status}`);
        }
        return res;
    };

    const confirmDelete = useCallback((ids: string[]) => {
        confirmDialog({
            message: ids.length === 1
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
                    show("success", "Deleted", ids.length === 1 ? "Student deleted successfully." : `${ids.length} students deleted successfully.`);
                    setStudents(prev => prev.filter(s => !ids.includes(s.id)));
                    setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                } catch (err: any) {
                    show("error", "Deletion Error", err.message || "Failed to delete student(s).");
                } finally {
                    setDeletingIds([]);
                }
            }
        });
    }, [show]);

    const deleteOne = useCallback((id: string) => {
        confirmDelete([id]);
        panel.current?.hide();
    }, [confirmDelete]);

    const handleNew = useCallback(() => setCreate(true), []);
    const handleEdit = useCallback(() => {
        setEdit(true);
        panel.current?.hide();
    }, []);

    const handleView = useCallback(() => {
        setView(true);
        panel.current?.hide();
    }, []);

    const handleUpdate = useCallback((updated: any) => {
        setStudents(prev => prev.map(s => s.id === updated.id ? updated : s));
        setEdit(false);
    }, []);

    const handleNewStudent = useCallback((newStudent: any) => {
        setStudents(prev => [...prev, newStudent]);
        setCreate(false);
    }, []);

    const actionBody = useCallback((row: any) => (
        <Button icon="pi pi-ellipsis-v"
            className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
            onClick={e => { setCurrent(row); panel.current?.toggle(e); }} />
    ), []);

    const overlayActions = [
        { label: "View", icon: "pi pi-eye", action: handleView },
        { label: "Edit", icon: "pi pi-pencil", action: handleEdit },
        { label: "Delete", icon: "pi pi-trash", action: () => current && deleteOne(current.id) },
    ];

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
            {view && <Student student={current} visible={view} onClose={() => setView(false)} />}
            {create && <NewStudent close={() => setCreate(false)} onCreated={handleNewStudent} />}
            {edit && current && (
                <EditStudent student={current} close={() => setEdit(false)} onUpdated={handleUpdate} />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Students</h1>
                    <Button label="Add New" icon="pi pi-plus" onClick={handleNew} className="p-button-sm" />
                </div>
                <div className="p-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search Students..."
                            onInput={e =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>
                <DataTable
                    value={students}
                    paginator
                    rows={5}
                    rowsPerPageOptions={[5, 10, 25]}
                    stripedRows
                    filters={filters}
                    filterDisplay="menu"
                    scrollable
                    scrollHeight="400px"
                    dataKey="id"
                    selection={selected}
                    onSelectionChange={e => setSelected(e.value)}
                    loading={loading}
                    emptyMessage="No students found."
                    selectionMode="multiple"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                    <Column
                        header="Name"
                        body={(rowData) =>
                            rowData
                                ? `${rowData.firstname} ${rowData.othername || ""} ${rowData.surname}`.trim()
                                : '–'
                        }
                        sortable
                    />
                    <Column field="admissionnumber" header="Admission Number" />
                    <Column field="phone" header="Phone" />
                    <Column
                        header="School"
                        body={row => row.school?.name || '–'}
                        hidden={role.toLowerCase() !== 'super'}
                    />
                    <Column
                        header="Class"
                        body={row => row.class?.name || '–'}
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
                    {overlayActions.map(a => (
                        <Button key={a.label} label={a.label} icon={a.icon} className="p-button-text text-gray-900 hover:text-blue-600" onClick={a.action} />
                    ))}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Students;