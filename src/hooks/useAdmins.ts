import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdmins, fetchAdminById, fetchAdminsBySchoolId, createAdmin, updateAdmin, deleteAdmins } from "@/lib/api/admins";
import { Administration } from "@/generated/prisma";

/**
 * Fetch all administration records (optionally filtered by query params)
 */
export const useGetAdmins = (opts?: { search?: string; schoolId?: string; role?: string }) => {
    return useQuery({
        queryKey: ["admins", opts ?? {}],
        queryFn: () => fetchAdmins(opts),
    });
};

/**
 * Fetch single administration by id
 */
export const useGetAdminById = (id?: string) => {
    return useQuery({
        queryKey: ["admins", id],
        queryFn: () => fetchAdminById(id as string),
        enabled: !!id,
    });
};

/**
 * Fetch admins by school id (explicit helper)
 */
export const useGetAdminsBySchoolId = (schoolId?: string) => {
    return useQuery({
        queryKey: ["admins", "bySchool", schoolId],
        queryFn: () => fetchAdminsBySchoolId(schoolId as string),
        enabled: !!schoolId,
    });
};

/**
 * Create a new administration record
 */
export const useCreateAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Administration>) => createAdmin(data),
        onSuccess: (newAdmin) => {
            // invalidate list and seed single admin cache
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            if (newAdmin?.id) queryClient.setQueryData(["admins", newAdmin.id], newAdmin);
        },
    });
};

/**
 * Update administration record
 */
export const useUpdateAdmin = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Administration> }) => updateAdmin(id, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            if (updated?.id) queryClient.setQueryData(["admins", updated.id], updated);
        },
    });
};

/**
 * Delete administration record(s)
 */
export const useDeleteAdmins = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { ids: string[]; schoolId?: string }) =>
            deleteAdmins(payload.ids, payload.schoolId),
        onMutate: async (payload) => {
            const { ids, schoolId } = payload;

            // cancel running queries that might overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ["admins"] });
            await queryClient.cancelQueries({ queryKey: ["admins", "bySchool", schoolId ?? ""] });

            // Snapshot existing data
            const previousAdmins = queryClient.getQueryData<Administration[]>(["admins"]) ?? [];
            const previousBySchool = queryClient.getQueryData<Administration[]>(["admins", "bySchool", schoolId ?? ""]) ?? null;

            // Snapshot individual admin items (for precise rollback)
            const previousById: Record<string, Administration | undefined> = {};
            ids.forEach((id) => {
                previousById[id] = queryClient.getQueryData<Administration>(["admins", id]);
            });

            // Optimistically update the general admins list
            const nextAdmins = previousAdmins.filter((a) => !ids.includes(a.id));
            queryClient.setQueryData(["admins"], nextAdmins);

            // Optimistically update the bySchool list if present
            if (previousBySchool) {
                queryClient.setQueryData(
                    ["admins", "bySchool", schoolId ?? ""],
                    previousBySchool.filter((a) => !ids.includes(a.id))
                );
            }

            // Remove per-id cache entries optimistically
            ids.forEach((id) => {
                queryClient.setQueryData(["admins", id], undefined);
            });

            // Return a context object for potential rollback
            return { previousAdmins, previousBySchool, previousById, ids, schoolId };
        },

        /**
         * If mutation errors, rollback to snapshot
         */
        onError: (err, payload, context: any) => {
            if (!context) return;
            const { previousAdmins, previousBySchool, previousById, ids, schoolId } = context;

            if (previousAdmins) {
                queryClient.setQueryData(["admins"], previousAdmins);
            }
            if (previousBySchool) {
                queryClient.setQueryData(["admins", "bySchool", schoolId ?? ""], previousBySchool);
            }

            if (previousById) {
                Object.entries(previousById).forEach(([id, item]) => {
                    queryClient.setQueryData(["admins", id], item);
                });
            }
        },

        /**
         * After either success or error, refetch / invalidate so cache is fully in sync with server.
         */
        onSettled: (data, error, variables) => {
            // Invalidate the admins list and bySchool to refetch authoritative state
            queryClient.invalidateQueries({ queryKey: ["admins"] });
            if (variables?.schoolId) {
                queryClient.invalidateQueries({ queryKey: ["admins", "bySchool", variables.schoolId] });
            }
        },
    });
};
