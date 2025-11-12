"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ClipboardList, Trash2, Edit, ToggleLeft, ToggleRight, } from "lucide-react";
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

import { useQueryClient } from "@tanstack/react-query";

import Spinner from "@/components/Spinner/Spinner";
import type { Term } from "@/generated/prisma";
import { useGetTerms, useDeleteTerms, useUpdateTerm } from "@/hooks/useTerms";

const Terms: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const toast = useRef<Toast | null>(null);
    const panel = useRef<OverlayPanel | null>(null);

    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = (session?.user?.role as string | undefined)?.toLowerCase() ?? "guest";
    const permit = ["super", "admin", "management"].includes(role);
    const sessionSchoolId = (session?.user as any)?.schoolId as string | undefined;

    const queryClient = useQueryClient();

    const { data: rawTerms = [], isLoading: termsLoading, error: termsError, refetch } = useGetTerms(
        role === "super" ? undefined : { schoolId: sessionSchoolId }
    );
    const deleteMutation = useDeleteTerms();
    const updateMutation = useUpdateTerm();

    // Enrich terms for table 
    const terms = React.useMemo(() => {
        return (rawTerms ?? []).map((t: any) => ({
            ...t,
            sessionDisplay: t.session ?? "–",
            termDisplay: t.term ?? "–",
            startDisplay: t.start ? moment(t.start).format("DD MMM YYYY") : "–",
            endDisplay: t.end ? moment(t.end).format("DD MMM YYYY") : "–",
            nextTermDisplay: (t.nextTerm ?? t.nextterm) ? moment(t.nextTerm ?? t.nextterm).format("DD MMM YYYY") : "–",
            daysOpenDisplay: t.daysOpen ?? t.daysopen ?? 0,
            statusDisplay: t.status ?? "Inactive",
        }));
    }, [rawTerms]);

    // Toast helper
    const show = useCallback((type: "success" | "error" | "info" | "warn", title: string, message: string) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    // Handle errors from fetching
    useEffect(() => {
        if (termsError) {
            show("error", "Load Failed", "Could not load terms. Please refresh.");
        }
    }, [termsError, show]);

    // DELETE confirm
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message: ids.length === 1 ? "Delete this term?" : `Delete ${ids.length} term(s)?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        // call deletion mutation
                        await deleteMutation.mutateAsync({ ids, schoolId: role === "super" ? undefined : sessionSchoolId });
                        show("success", "Deleted", `${ids.length} term(s) deleted.`);
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
                        await refetch();
                    } catch (err: any) {
                        show("error", "Error", err?.message || "Failed to delete term(s).");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [deleteMutation, role, sessionSchoolId, show, refetch]
    );

    const deleteOne = useCallback((id: string) => {
        confirmDelete([id]);
        panel.current?.hide?.();
    }, [confirmDelete]);

    // Optimistic update: Toggle status (Enable / Disable)
    const updateStatus = useCallback(
        async (term: any, newStatus: string) => {
            const termId = term.id;
            setUpdatingIds([termId]);

            // Snapshot previous cache values
            const prevTerms = queryClient.getQueryData<Term[]>(["terms"]) ?? [];
            const prevBySchool = queryClient.getQueryData<Term[]>(["terms", "bySchool", sessionSchoolId ?? ""]);
            const prevById = queryClient.getQueryData<Term>(["terms", termId]);

            // Produce optimistic versions
            const optimisticTerms = prevTerms.map(t => (t.id === termId ? { ...t, status: newStatus, statusDisplay: newStatus } : t));
            queryClient.setQueryData(["terms"], optimisticTerms);

            if (prevBySchool) {
                const optimisticBySchool = prevBySchool.map(t => (t.id === termId ? { ...t, status: newStatus, statusDisplay: newStatus } : t));
                queryClient.setQueryData(["terms", "bySchool", sessionSchoolId ?? ""], optimisticBySchool);
            }

            queryClient.setQueryData(["terms", termId], { ...(prevById ?? {}), status: newStatus, statusDisplay: newStatus });

            try {
                // Send mutation to server
                await updateMutation.mutateAsync({ id: termId, data: { ...term, status: newStatus } });
                show("success", "Status Updated", `Term has been ${newStatus === "Active" ? "enabled" : "disabled"} successfully.`);
            } catch (err: any) {
                // Rollback on error
                if (prevTerms) queryClient.setQueryData(["terms"], prevTerms);
                if (prevBySchool) queryClient.setQueryData(["terms", "bySchool", sessionSchoolId ?? ""], prevBySchool);
                if (prevById !== undefined) queryClient.setQueryData(["terms", termId], prevById);
                show("error", "Update Error", err?.message || "Failed to update status. Reverted.");
            } finally {
                // Ensure we revalidate / refetch to get the true source of truth
                await queryClient.invalidateQueries({ queryKey: ["terms"] });
                if (sessionSchoolId) await queryClient.invalidateQueries({ queryKey: ["terms", "bySchool", sessionSchoolId] });
                setUpdatingIds([]);
                panel.current?.hide?.();
            }
        },
        [queryClient, updateMutation, sessionSchoolId, show]
    );

    // Actions
    const handleNew = useCallback(() => {
        router.push(`/dashboard/${role}/terms/new`);
    }, [role, router]);

    const handleView = useCallback((t: any) => {
        router.push(`/dashboard/terms/${t.id}/view`);
    }, [router]);

    const handleEdit = useCallback((t: any) => {
        router.push(`/dashboard/${role}/terms/${t.id}/edit`);
    }, [router, role]);

    // Row action button — show inline loading spinner for the row being updated
    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent"
                onClick={e => {
                    setCurrent(row);
                    panel.current?.toggle?.(e);
                }}
                disabled={updatingIds.includes(row.id)}
                loading={updatingIds.includes(row.id) || updateMutation.isPending}
            />
        ),
        [updatingIds, updateMutation.isPending]
    );

    // Context menu
    const getOverlayActions = useCallback(
        (t: any) => [
            {
                label: "Edit",
                icon: <Edit className="w-4 h-4 mr-2" />,
                action: () => handleEdit(t),
            },
            {
                label: (t?.status ?? t?.statusDisplay) === "Active" ? "Disable" : "Enable",
                icon: (t?.status ?? t?.statusDisplay) === "Active" ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />,
                action: () => updateStatus(t, (t?.status ?? t?.statusDisplay) === "Active" ? "Inactive" : "Active"),
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => deleteOne(t.id),
            },
        ],
        [handleView, handleEdit, updateStatus, deleteOne]
    );

    // status badge renderer
    const statusBody = useCallback(
        (row: Term) => (
            <div className="flex items-center justify-center">
                <Badge value={(row as any).status ?? "Inactive"} severity={(row as any).status === "Active" ? "success" : "danger"} />
            </div>
        ),
        []
    );

    if (termsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {/* Show spinner when deleting or updating */}
            {(deletingIds.length > 0 || deleteMutation.isPending || updatingIds.length > 0 || updateMutation.isPending) && (
                <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />
            )}

            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">All Terms</h1>
                            <p className="text-sm text-gray-500">Academic term records.</p>
                        </div>
                    </div>

                    {permit && (
                        <Button
                            label="Add Term"
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
                            placeholder="Search by session, term..."
                            onInput={e => setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })}
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 px-8 py-2 transition-all"
                        />
                    </span>
                </div>

                {/* Table */}
                <div>
                    <DataTable
                        value={terms}
                        paginator
                        rows={5}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        stripedRows
                        filters={filters}
                        filterDisplay="menu"
                        globalFilterFields={["sessionDisplay", "termDisplay"]}
                        scrollable
                        scrollHeight="400px"
                        dataKey="id"
                        selection={selected}
                        onSelectionChange={e => setSelected(e.value)}
                        emptyMessage="No terms found."
                        selectionMode="multiple"
                    >
                        {permit && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}

                        <Column field="sessionDisplay" header="Session" sortable />
                        <Column field="termDisplay" header="Term" sortable />
                        <Column field="startDisplay" header="Start" body={(row: any) => row.startDisplay} />
                        <Column field="endDisplay" header="End" body={(row: any) => row.endDisplay} />
                        <Column header="Days Opened" body={(row: any) => row.daysOpenDisplay} style={{ width: "8rem", textAlign: "center" }} />
                        <Column field="nextTermDisplay" header="Next Term Begins" body={(row: any) => row.nextTermDisplay} />
                        <Column header="Status" body={statusBody} style={{ width: "8rem", textAlign: "center" }} />
                        <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                    </DataTable>
                </div>
            </div>

            {/* Bulk Delete */}
            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} term(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map(s => s.id))}
                        loading={deleteMutation.isPending}
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                    />
                </div>
            )}

            {/* Context / Overlay */}
            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current && getOverlayActions(current).map(({ label, icon, action }) => (
                        <Button
                            key={label}
                            className="p-button-text text-gray-900 hover:bg-gray-100 w-full text-left px-4 py-2 rounded-none flex items-center"
                            onClick={action}
                            disabled={current && (updatingIds.includes(current.id) || updateMutation.isPending)}
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

export default Terms;
