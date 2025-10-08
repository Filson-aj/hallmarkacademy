"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { Tag } from "primereact/tag";
import Spinner from "@/components/Spinner/Spinner";
import NewGrading from "./NewGrading";

const Gradings: React.FC = () => {
    const { data: session } = useSession();
    const router = useRouter();
    const [grades, setGrades] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [create, setCreate] = useState(false);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = (session?.user?.role || "Guest").toLowerCase();

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
            const res = await fetch("/api/gradings");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setGrades(data?.data ?? []);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch grades record, please try again.");
        } finally {
            setLoading(false);
        }
    };

    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/gradings?${query}`, { method: "DELETE" });
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
                                ? "Grade deleted successfully."
                                : `${ids.length} grades deleted successfully.`
                        );
                        setGrades(prev => prev.filter(s => !ids.includes(s.id)));
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err.message || "Failed to delete grade record, please try again.");
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

    // Navigate to gradings/[id]
    const handleView = useCallback((id?: string) => {
        if (!id) return;
        panel.current?.hide();
        router.push(`/dashboard/${role}/gradings/${encodeURIComponent(id)}`);
    }, [router]);

    const handleNewGrade = useCallback(
        (newGrade: any) => {
            setGrades(prev => [...prev, newGrade]);
            setCreate(false);
        },
        []
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

    // Update published flag via API (PUT /api/gradings/:id)
    // Now sends the full required payload (title, session, term, schoolid, published, updateAt)
    const updatePublished = useCallback(async (id: string, publish: boolean) => {
        setUpdating(true);
        try {
            // find existing grade in state
            const existing = grades.find(g => g.id === id);
            if (!existing) {
                throw new Error("Grade not found in local state");
            }

            // Resolve schoolid: prefer explicit field, then nested school.id
            const schoolid = existing.schoolid ?? existing.school?.id;
            if (!schoolid) {
                throw new Error("Missing schoolid on grade; cannot update without it");
            }

            // Build full payload expected by the server
            const payload: any = {
                title: existing.title ?? "",
                session: existing.session ?? "",
                term: existing.term ?? "",
                schoolid,
                published: publish,
                updateAt: new Date().toISOString(),
            };

            // If there are other fields your server expects, include them similarly from `existing`.

            const res = await fetch(`/api/gradings/${encodeURIComponent(id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || err.error || `Status ${res.status}`);
            }

            const updated = await res.json();
            // update local state
            setGrades(prev => prev.map(g => (g.id === updated.id ? updated : g)));
            show("success", publish ? "Published" : "Unpublished", `Grade ${publish ? "published" : "unpublished"} successfully.`);
        } catch (err: any) {
            console.error("Publish toggle error:", err);
            show("error", "Update Error", err.message || "Failed to update grade, please try again.");
        } finally {
            setUpdating(false);
            panel.current?.hide();
        }
    }, [grades, show]);

    // Called from context menu to toggle publish
    const togglePublish = useCallback((row: any) => {
        if (!row) return;
        const publish = !row.published;
        confirmDialog({
            message: publish ? "Do you really want to publish this record?" : "Do you really want to unpublish this record?",
            header: publish ? "Confirm Publish" : "Confirm Unpublish",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: publish ? "p-button-success" : "p-button-warning",
            rejectClassName: "p-button-text",
            accept: async () => {
                await updatePublished(row.id, publish);
            },
        });
    }, [updatePublished]);

    // Build context menu actions depending on role and current row state
    const renderOverlayActions = () => {
        if (!current) return null;

        // Teacher sees only Edit (navigates to the grade page)
        if (role === "teacher") {
            return [
                <Button
                    key="edit"
                    label="Edit"
                    icon="pi pi-pencil"
                    className="p-button-text text-gray-900 hover:text-blue-600"
                    onClick={() => handleView(current.id)}
                />
            ];
        }

        const publishLabel = current.published ? "Unpublish" : "Publish";
        const publishIcon = current.published ? "pi pi-eye-slash" : "pi pi-eye";

        return [
            <Button key="view" label="View" icon="pi pi-eye" className="p-button-text text-gray-900 hover:text-blue-600" onClick={() => handleView(current.id)} />,
            <Button key="publish" label={publishLabel} icon={publishIcon} className="p-button-text" onClick={() => togglePublish(current)} />,
            <Button key="delete" label="Delete" icon="pi pi-trash" className="p-button-text text-red-700" onClick={() => deleteOne(current.id)} />
        ];
    };

    const statusBodyTemplate = (rowData: any) => {
        let severity: "success" | "error" | "info" | "warning" | "secondary" | "contrast" | undefined = 'warning'
        if (rowData.published) severity = 'success'
        const status = rowData.published ? 'Published' : 'Unpublished'
        return (
            <Tag value={status} severity={severity} className='capitalize w-full py-1.5' />
        )
    }

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
            {/* show spinner when deleting or updating publish state */}
            {(deletingIds.length > 0 || updating) && <Spinner visible onHide={() => { setDeletingIds([]); setUpdating(false); }} />}
            {create && <NewGrading close={() => setCreate(false)} onCreated={handleNewGrade} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Grades</h1>
                    <Button label="Add New" icon="pi pi-plus" onClick={handleNew} className="p-button-sm" />
                </div>

                <div className="px-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search grades..."
                            onInput={e =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                <DataTable
                    value={grades}
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
                    emptyMessage="No grades found."
                    selectionMode="multiple"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                    <Column field='title' header='Title' />
                    <Column field='session' header='Session' sortable />
                    <Column field='term' header='Term' sortable />
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
                    <Column field='status' header='Status' body={statusBodyTemplate} sortable />
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
                <div className="flex flex-col space-y-1">
                    {renderOverlayActions()}
                </div>
            </OverlayPanel>
        </section>
    );
};

export default Gradings;
