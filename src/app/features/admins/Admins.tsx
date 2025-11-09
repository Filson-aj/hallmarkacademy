"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
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
import type { Roles } from "@/generated/prisma";
import Spinner from "@/components/Spinner/Spinner";
import { User, Shield, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import {
    useGetAdmins,
    useDeleteAdmins,
    useUpdateAdmin,
} from "@/hooks/useAdmins";

const Admins: React.FC = () => {
    const router = useRouter();
    const toast = useRef<Toast | null>(null);
    const panel = useRef<any>(null);

    const { data: session } = useSession();
    const role = (session?.user?.role as string) || "Guest";
    const viewerRole = role.toLowerCase();
    const currentUserId = session?.user?.id;
    const currentUserSchoolId = (session?.user as any)?.schoolId as string | undefined;

    // Use server-aware hook: pass schoolId for non-super viewers so server scopes results
    const queryOpts = useMemo(() => {
        if (viewerRole === "super") return undefined;
        // pass schoolId if present so server returns scoped admins
        return { schoolId: currentUserSchoolId };
    }, [viewerRole, currentUserSchoolId]);

    const {
        data: adminsData,
        isLoading: isFetching,
        error: fetchError,
    } = useGetAdmins(queryOpts);

    const deleteMutation = useDeleteAdmins();
    const updateMutation = useUpdateAdmin();

    // UI state
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [processingIds, setProcessingIds] = useState<string[]>([]);
    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    // derived
    const admins = adminsData ?? [];

    const show = useCallback((type: "success" | "error" | "info" | "warn", title: string, message: string) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    const handleNew = useCallback(() => {
        router.push(`/dashboard/${viewerRole}/admins/new`);
    }, [router, viewerRole]);

    // Confirm and delete (uses optimistic delete mutation)
    const confirmDelete = useCallback((ids: string[]) => {
        confirmDialog({
            message: ids.length === 1 ? "Do you really want to delete this record?" : `Do you really want to delete these ${ids.length} records?`,
            header: "Confirm Deletion",
            icon: "pi pi-exclamation-triangle",
            acceptClassName: "p-button-danger",
            rejectClassName: "p-button-text",
            accept: async () => {
                setProcessingIds(ids);
                try {
                    await deleteMutation.mutateAsync({ ids, schoolId: queryOpts?.schoolId });
                    show("success", "Deleted", ids.length === 1 ? "Admin deleted successfully." : `${ids.length} admins deleted successfully.`);
                    setSelected((prev) => prev.filter((s) => !ids.includes(s.id)));
                } catch (err: any) {
                    show("error", "Deletion Error", err?.message || "Failed to delete admin record, please try again.");
                } finally {
                    setProcessingIds([]);
                }
            },
        });
    }, [deleteMutation, show, queryOpts]);

    // Update role
    const updateRole = useCallback(async (admin: any, newRole: string) => {
        setProcessingIds([admin.id]);
        try {
            const roleEnum = newRole as unknown as Roles;

            await updateMutation.mutateAsync({ id: admin.id, data: { role: roleEnum } });
            show("success", "Role Updated", `Role changed to ${newRole} successfully.`);
            panel.current?.hide();
        } catch (err: any) {
            show("error", "Update Error", err?.message || "Failed to update admin role.");
        } finally {
            setProcessingIds([]);
        }
    }, [updateMutation, show]);


    // Update active status
    const updateStatus = useCallback(async (admin: any, newStatus: boolean) => {
        setProcessingIds([admin.id]);
        try {
            await updateMutation.mutateAsync({ id: admin.id, data: { active: newStatus } });
            show("success", "Status Updated", `Admin has been ${newStatus ? "enabled" : "disabled"} successfully.`);
            panel.current?.hide();
        } catch (err: any) {
            show("error", "Update Error", err?.message || "Failed to update admin status.");
        } finally {
            setProcessingIds([]);
        }
    }, [updateMutation, show]);

    // Delete single
    const deleteOne = useCallback((id: string) => {
        confirmDelete([id]);
        panel.current?.hide();
    }, [confirmDelete]);

    // Action button for rows
    const actionBody = useCallback((row: any) => (
        <Button
            icon="pi pi-ellipsis-v"
            className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
            onClick={(e) => {
                setCurrent(row);
                panel.current?.toggle(e);
            }}
            disabled={processingIds.includes(row.id)}
        />
    ), [processingIds]);

    const getOverlayActions = useCallback((currentAdmin: any) => {
        const viewerAllowedActions =
            viewerRole === "super" ? ["Super", "Admin", "Management"] :
                viewerRole === "management" ? ["Admin", "Management"] :
                    viewerRole === "admin" ? ["Admin"] : [];

        const roleChangeActions = viewerAllowedActions.map((label) => {
            const lower = label.toLowerCase();
            const displayLabel = `Make ${label}`;
            const icon = lower === "super" ? <Shield className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />;
            return {
                label: displayLabel,
                roleLabel: label,
                icon,
                action: () => currentAdmin && updateRole(currentAdmin, label),
            };
        });

        const toggleAction = {
            label: currentAdmin?.active ? "Disable" : "Enable",
            icon: currentAdmin?.active ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />,
            action: () => currentAdmin && updateStatus(currentAdmin, !currentAdmin.active),
        };

        const deleteAction = {
            label: "Delete",
            icon: <Trash2 className="w-4 h-4 mr-2" />,
            action: () => currentAdmin && deleteOne(currentAdmin.id),
        };

        const filteredRoleChangeActions = roleChangeActions.filter((a: any) => {
            return (currentAdmin?.role || "").toLowerCase() !== (a.roleLabel || "").toLowerCase();
        });

        return [...filteredRoleChangeActions, toggleAction, deleteAction];
    }, [viewerRole, updateRole, updateStatus, deleteOne]);

    const statusBodyTemplate = useCallback((row: any) => (
        <span className="flex items-center justify-center">
            <Tag value={row.active ? 'Active' : 'Disabled'} severity={row.active ? 'success' : 'danger'} className="capitalize w-full py-1.5" />
        </span>
    ), []);

    // Loading state UI
    const loading = isFetching || deleteMutation.isPending || updateMutation.isPending;

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                </div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <section className="w-[90%] bg-white mx-auto my-4 rounded-md shadow-md p-6 text-center">
                <p className="text-gray-600">Failed to load administrators.</p>
                <Button label="Retry" onClick={() => window.location.reload()} className="mt-4" />
            </section>
        );
    }

    return (
        <section className="flex flex-col w-full py-3 px-4">
            <Toast ref={toast} />
            {(processingIds.length > 0) && <Spinner visible onHide={() => setProcessingIds([])} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 p-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 shadow-sm text-indigo-600">
                            <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">All Admins</h1>
                            <p className="text-sm text-gray-500">System administrator records</p>
                        </div>
                    </div>

                    {viewerRole === "super" && (
                        <div className="flex gap-3">
                            <Button
                                label="Create"
                                icon="pi pi-plus"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-2xl shadow-sm text-sm font-medium hover:shadow-md transition"
                                onClick={handleNew}
                            />
                        </div>
                    )}
                </header>

                {/* Search */}
                <div className="px-2 border-t border-gray-200 py-3">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search admins..."
                            onInput={(e) => setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })}
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

                {/* Table */}
                <div>
                    <DataTable
                        value={admins}
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
                        onSelectionChange={(e) => setSelected(e.value)}
                        loading={loading}
                        emptyMessage="No admins found."
                        selectionMode="multiple"
                    >
                        {["super", "management", "admin"].includes(viewerRole) && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}
                        <Column field="email" header="Email" sortable />
                        <Column field="username" header="Username" body={(rowData) => rowData.username || "–"} />
                        <Column
                            field="role"
                            header="Role"
                            body={(rowData) => (rowData.role ? rowData.role.charAt(0).toUpperCase() + rowData.role.slice(1) : "–")}
                            sortable
                            style={{ width: "10rem" }}
                        />
                        {viewerRole === "super" && <Column header="School" body={(rowData) => (rowData.school ? `${rowData.school.name || ""}`.trim() : "–")} />}
                        <Column header="Status" body={statusBodyTemplate} />
                        <Column body={actionBody} header="Actions" style={{ textAlign: "center", width: "4rem" }} />
                    </DataTable>
                </div>
            </div>

            {/* Bulk delete */}
            {selected.length > 0 && (
                <div className="mt-4">
                    <Button
                        label={`Delete ${selected.length} record(s)`}
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => confirmDelete(selected.map((s) => s.id))}
                        loading={deleteMutation.isPending}
                        disabled={deleteMutation.isPending || updateMutation.isPending}
                    />
                </div>
            )}

            {/* Actions overlay */}
            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current &&
                        getOverlayActions(current).map(({ label, icon, action }) => (
                            <Button
                                key={label}
                                className="p-button-text text-gray-900 hover:bg-gray-100 w-full text-left px-4 py-2 rounded-none flex items-center"
                                onClick={action}
                                disabled={current && processingIds.includes(current.id)}
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

export default Admins;
