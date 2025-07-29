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
import moment from "moment";
import Spinner from "@/components/Spinner/Spinner";
import NewAdmin from "./NewAdmin";
import { User, Shield, Briefcase, Trash2 } from "lucide-react";

const Admins: React.FC = () => {
    const { data: session } = useSession();
    const [admins, setAdmins] = useState<any[]>([]);
    const [selected, setSelected] = useState<any[]>([]);
    const [current, setCurrent] = useState<any | null>(null);
    const [create, setCreate] = useState(false);
    const [deletingIds, setDeletingIds] = useState<string[]>([]);
    const [updatingIds, setUpdatingIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const toast = useRef<Toast>(null);
    const panel = useRef<OverlayPanel>(null);

    const [filters, setFilters] = useState<DataTableFilterMeta>({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS } as DataTableFilterMetaData,
    });

    const role = session?.user?.role || 'Guest';
    const currentUserId = session?.user?.id;

    useEffect(() => {
        fetchData();
    }, []);

    const show = useCallback((
        type: "success" | "error" | "info" | "warn" | "secondary" | "contrast" | undefined,
        title: string,
        message: string
    ) => {
        toast.current?.show({ severity: type, summary: title, detail: message, life: 3000 });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admins");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            let filteredData = role.toLowerCase() === 'super'
                ? data?.data
                : data?.data.filter((admin: any) => ['admin', 'management'].includes(admin.role.toLowerCase()));
            // Exclude the current user from the displayed data
            if (currentUserId) {
                filteredData = filteredData.filter((admin: any) => admin.id !== currentUserId);
            }
            setAdmins(filteredData);
        } catch (err) {
            show("error", "Fetch Error", "Failed to fetch admins record, please try again.");
        } finally {
            setLoading(false);
        }
    };

    const deleteApi = async (ids: string[]) => {
        const query = ids.map(id => `ids=${encodeURIComponent(id)}`).join("&");
        const res = await fetch(`/api/admins?${query}`, { method: "DELETE" });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res;
    };

    const updateRoleApi = async (admin: any, newRole: string) => {
        const updatedAdminData = { ...admin, role: newRole };
        const res = await fetch(`/api/admins/${admin.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedAdminData),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Status ${res.status}`);
        }
        return res.json();
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
                                ? "Admin deleted successfully."
                                : `${ids.length} admins deleted successfully.`
                        );
                        setAdmins(prev => prev.filter(s => !ids.includes(s.id)));
                        setSelected(prev => prev.filter(s => !ids.includes(s.id)));
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

    const updateRole = useCallback(
        (admin: any, newRole: string) => {
            setUpdatingIds([admin.id]);
            updateRoleApi(admin, newRole)
                .then((updatedAdmin) => {
                    setAdmins(prev =>
                        prev.map(a =>
                            a.id === admin.id ? { ...a, role: newRole } : a
                        )
                    );
                    show("success", "Role Updated", `Admin role changed to ${newRole} successfully.`);
                })
                .catch((err) => {
                    show("error", "Update Error", err.message || "Failed to update admin role.");
                })
                .finally(() => {
                    setUpdatingIds([]);
                    panel.current?.hide();
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

    const handleNewAdmin = useCallback(
        (newAdmin: any) => {
            if (newAdmin.id !== currentUserId) {
                setAdmins(prev => [...prev, newAdmin]);
            }
            setCreate(false);
        },
        [show, currentUserId]
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
                disabled={updatingIds.includes(row.id)}
            />
        ),
        [updatingIds]
    );

    const getOverlayActions = useCallback((currentAdmin: any) => {
        const allActions = [
            {
                label: "Admin",
                icon: <User className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && updateRole(currentAdmin, "Admin")
            },
            {
                label: "Super",
                icon: <Shield className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && updateRole(currentAdmin, "Super")
            },
            {
                label: "Management",
                icon: <Briefcase className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && updateRole(currentAdmin, "Management")
            },
            {
                label: "Delete",
                icon: <Trash2 className="w-4 h-4 mr-2" />,
                action: () => currentAdmin && deleteOne(currentAdmin.id)
            },
        ];

        // Filter out the current admin's role from the actions
        const filteredActions = allActions.filter(action =>
            action.label.toLowerCase() !== currentAdmin?.role.toLowerCase()
        );

        // For non-Super users, also filter out the Super option
        return role.toLowerCase() === 'super'
            ? filteredActions
            : filteredActions.filter(action => action.label.toLowerCase() !== 'super');
    }, [role, updateRole, deleteOne]);

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
            {(deletingIds.length > 0 || updatingIds.length > 0) && (
                <Spinner visible onHide={() => { setDeletingIds([]); setUpdatingIds([]); }} />
            )}
            {create && <NewAdmin close={() => setCreate(false)} onCreated={handleNewAdmin} />}

            <div className="bg-white rounded-md shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-200 px-3 py-2">
                    <h1 className="text-2xl font-bold text-gray-700">All Admins</h1>
                    <Button label="Add New" icon="pi pi-plus" onClick={handleNew} className="p-button-sm" />
                </div>

                <div className="px-2">
                    <span className="p-input-icon-left block">
                        <i className="pi pi-search ml-2" />
                        <InputText
                            placeholder="Search admins..."
                            onInput={e =>
                                setFilters({ global: { value: e.currentTarget.value, matchMode: FilterMatchMode.CONTAINS } })
                            }
                            className="w-full rounded focus:ring-1 focus:ring-cyan-500 focus:outline-none focus:outline-0 px-8 py-2 transition-all duration-300"
                        />
                    </span>
                </div>

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
                    onSelectionChange={e => setSelected(e.value)}
                    loading={loading}
                    emptyMessage="No admins found."
                    selectionMode="multiple"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
                    <Column field='email' header='Email' sortable />
                    <Column field='username' header='Username' body={(rowData) => rowData.username || '–'} />
                    <Column
                        field="role"
                        header="Role"
                        body={(rowData) => rowData.role.charAt(0).toUpperCase() + rowData.role.slice(1)}
                        sortable
                        style={{ width: "10rem" }}
                    />
                    {role.toLowerCase() === 'super' && (
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
                        field="createdAt"
                        header="Created On"
                        body={(rowData) => moment(rowData.createdAt).format("MMM D, YYYY")}
                        sortable
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
                        disabled={deletingIds.length > 0 || updatingIds.length > 0}
                    />
                </div>
            )}

            <OverlayPanel ref={panel} className="shadow-lg rounded-md">
                <div className="flex flex-col w-48 bg-white rounded-md">
                    {current && getOverlayActions(current).map(({ label, icon, action }) => (
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