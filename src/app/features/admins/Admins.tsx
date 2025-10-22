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
import moment from "moment";
import Spinner from "@/components/Spinner/Spinner";
import { User, Shield, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const Admins: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [admins, setAdmins] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = (session?.user?.role as string) || "Guest";
    const viewerRole = role.toLowerCase();
    const currentUserId = session?.user?.id;

    const permited = ["super", "management", "admin"].includes(viewerRole);

    // Fetch list on mount
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Toast helper
    const show = useCallback(
        (type: "success" | "error" | "info" | "warn", title: string, message: string) => {
            toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
        },
        []
    );

    // Fetch admins from API and apply viewer filtering rules (super/management/admin)
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admins");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const raw = data?.data ?? [];

            // Apply viewer-specific visibility rules:
            let filteredData =
                viewerRole === "super"
                    ? raw
                    : viewerRole === "management"
                        ? raw.filter((a: any) => ["admin", "management"].includes((a.role || "").toLowerCase()))
                        : viewerRole === "admin"
                            ? raw.filter((a: any) => (a.role || "").toLowerCase() === "admin")
                            : [];

            // Exclude current user
            if (currentUserId) {
                filteredData = filteredData.filter((a: any) => a.id !== currentUserId);
            }

            setAdmins(filteredData);
        } catch (err) {
            console.error("Failed to fetch admins:", err);
            show("error", "Fetch Error", "Failed to fetch admins. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Delete API (bulk)
    const deleteApi = async (ids: string[]) => {
        const query = ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/admins?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    // Update role API
    const updateRoleApi = async (admin: any, newRole: string) => {
        const updatedAdminData = { ...admin, role: newRole };
        const res = await fetch(`/api/admins/${admin.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedAdminData),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res.json();
    };

    // Update status API (active)
    const updateStatusApi = async (admin: any, newStatus: boolean) => {
        const payload = { ...admin, active: newStatus };
        const res = await fetch(`/api/admins/${admin.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res.json();
    };

    // Confirm and delete
    const confirmDelete = useCallback(
        (ids: string[]) => {
            confirmDialog({
                message:
                    ids.length === 1 ? "Do you really want to delete this record?" : `Do you really want to delete these ${ids.length} records?`,
                header: "Confirm Deletion",
                icon: "pi pi-exclamation-triangle",
                acceptClassName: "p-button-danger",
                rejectClassName: "p-button-text",
                accept: async () => {
                    setDeletingIds(ids);
                    try {
                        await deleteApi(ids);
                        show("success", "Deleted", ids.length === 1 ? "Admin deleted successfully." : `${ids.length} admins deleted successfully.`);
                        setAdmins((prev) => prev.filter((s) => !ids.includes(s.id)));
                        setSelected((prev) => prev.filter((s) => !ids.includes(s.id)));
                    } catch (err: any) {
                        show("error", "Deletion Error", err.message || "Failed to delete admin record, please try again.");
                    } finally {
                        setDeletingIds([]);
                    }
                },
            });
        },
        [show]
    );

    // Update role (UI + API)
    const updateRole = useCallback(
        (admin: any, newRole: string) => {
            setUpdatingIds([admin.id]);
            updateRoleApi(admin, newRole)
                .then(() => {
                    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, role: newRole } : a)));
                    show("success", "Role Updated", `Make ${newRole} successful.`);
                })
                .catch((err: any) => {
                    show("error", "Update Error", err.message || "Failed to update admin role.");
                })
                .finally(() => {
                    setUpdatingIds([]);
                    panel.current?.hide();
                });
        },
        [show]
    );

    // Update active status (UI + API)
    const updateStatus = useCallback(
        (admin: any, newStatus: boolean) => {
            setUpdatingIds([admin.id]);
            updateStatusApi(admin, newStatus)
                .then(() => {
                    setAdmins((prev) => prev.map((a) => (a.id === admin.id ? { ...a, active: newStatus } : a)));
                    show("success", "Status Updated", `Admin has been ${newStatus ? "enabled" : "disabled"} successfully.`);
                })
                .catch((err: any) => {
                    show("error", "Update Error", err.message || "Failed to update admin status.");
                })
                .finally(() => {
                    setUpdatingIds([]);
                    panel.current?.hide();
                });
        },
        [show]
    );

    // Delete single record via confirm
    const deleteOne = useCallback(
        (id: string) => {
            confirmDelete([id]);
            panel.current?.hide();
        },
        [confirmDelete]
    );
    const handleNew = useCallback(() => {
        // route to /dashboard/<role>/admins/new (same as guide)
        router.push(`/dashboard/${viewerRole}/admins/new`);
    }, [router, viewerRole]);

    const handleNewAdmin = useCallback(
        (newAdmin: any) => {
            if (newAdmin && newAdmin.id && newAdmin.id !== currentUserId) {
                setAdmins((prev) => [newAdmin, ...prev]);
            }
        },
        [currentUserId]
    );

    // Action button for rows
    const actionBody = useCallback(
        (row: any) => (
            <Button
                icon="pi pi-ellipsis-v"
                className="p-button-text hover:bg-transparent hover:border-none hover:shadow-none"
                onClick={(e) => {
                    setCurrent(row);
                    panel.current?.toggle(e);
                }}
                disabled={updatingIds.includes(row.id)}
            />
        ),
        [updatingIds]
    );

    const getOverlayActions = useCallback(
        (currentAdmin: any) => {
            const viewerAllowedActions =
                viewerRole === "super" ? ["Super", "Admin", "Management"] : viewerRole === "management" ? ["Admin", "Management"] : viewerRole === "admin" ? ["Admin"] : [];

            const roleChangeActions = viewerAllowedActions.map((label) => {
                const lower = label.toLowerCase();
                const displayLabel = `Make ${label}`;
                const icon =
                    lower === "super" ? <Shield className="w-4 h-4 mr-2" /> : lower === "admin" ? <User className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />;

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

            // Add delete action
            const deleteAction = {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && deleteOne(currentAdmin.id),
            };

            const filteredRoleChangeActions = roleChangeActions.filter((a: any) => {
                return (currentAdmin?.role || "").toLowerCase() !== (a.roleLabel || "").toLowerCase();
            });

            return [...filteredRoleChangeActions, toggleAction, deleteAction];
        },
        [viewerRole, updateRole, updateStatus, deleteOne]
    );

    // A helper function to display status
    const statusBodyTemplate = useCallback((row: any) => (
        <span className="flex items-center justify-center">
            <Tag value={row.active ? 'Active' : 'Disabled'} severity={row.active ? 'success' : 'danger'} className="capitalize w-full py-1.5" />
        </span>
    ), []);

    // Loading state UI
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
            {(deletingIds.length > 0 || updatingIds.length > 0) && <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />}

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
                        {permited && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}
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
                        loading={deletingIds.length > 0}
                        disabled={deletingIds.length > 0 || updatingIds.length > 0}
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
                                disabled={current && updatingIds.includes(current.id)}
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
