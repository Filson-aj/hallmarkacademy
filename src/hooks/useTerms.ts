import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchTerms, fetchTermById, fetchTermsBySchoolId, createTerm, updateTerm, deleteTerms } from "@/lib/api/terms";
import { Term } from "@/generated/prisma";

/**
 * Fetch all terms (optionally filtered by query params)
 */
export const useGetTerms = (opts?: { status?: string; session?: string; schoolId?: string }) => {
    return useQuery({
        queryKey: ["terms", opts ?? {}],
        queryFn: () => fetchTerms(opts),
    });
};

/**
 * Fetch single term by id
 */
export const useGetTermById = (id?: string) => {
    return useQuery({
        queryKey: ["terms", id],
        queryFn: () => fetchTermById(id as string),
        enabled: !!id,
    });
};

/**
 * Fetch terms by school id (explicit helper)
 */
export const useGetTermsBySchoolId = (schoolId?: string) => {
    return useQuery({
        queryKey: ["terms", "bySchool", schoolId],
        queryFn: () => fetchTermsBySchoolId(schoolId as string),
        enabled: !!schoolId,
    });
};

/**
 * Create a new term
 */
export const useCreateTerm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<Term>) => createTerm(data),
        onSuccess: (newTerm) => {
            queryClient.invalidateQueries({ queryKey: ["terms"] });
            if (newTerm?.id) queryClient.setQueryData(["terms", newTerm.id], newTerm);
        },
    });
};

/**
 * Update term record
 */
export const useUpdateTerm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Term> }) => updateTerm(id, data),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ["terms"] });
            if (updated?.id) queryClient.setQueryData(["terms", updated.id], updated);
        },
    });
};

/**
 * Delete term(s) with optimistic update
 */
export const useDeleteTerms = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: { ids: string[]; schoolId?: string }) => deleteTerms(payload.ids, payload.schoolId),

        onMutate: async (payload) => {
            const { ids, schoolId } = payload;

            await queryClient.cancelQueries({ queryKey: ["terms"] });
            await queryClient.cancelQueries({ queryKey: ["terms", "bySchool", schoolId ?? ""] });

            const previousTerms = queryClient.getQueryData<Term[]>(["terms"]) ?? [];
            const previousBySchool = queryClient.getQueryData<Term[]>(["terms", "bySchool", schoolId ?? ""]) ?? null;

            const previousById: Record<string, Term | undefined> = {};
            ids.forEach((id) => {
                previousById[id] = queryClient.getQueryData<Term>(["terms", id]);
            });

            const nextTerms = previousTerms.filter((t) => !ids.includes(t.id));
            queryClient.setQueryData(["terms"], nextTerms);

            if (previousBySchool) {
                queryClient.setQueryData(["terms", "bySchool", schoolId ?? ""], previousBySchool.filter((t) => !ids.includes(t.id)));
            }

            ids.forEach((id) => {
                queryClient.setQueryData(["terms", id], undefined);
            });

            return { previousTerms, previousBySchool, previousById, ids, schoolId };
        },

        onError: (err, payload, context: any) => {
            if (!context) return;
            const { previousTerms, previousBySchool, previousById, ids, schoolId } = context;
            if (previousTerms) queryClient.setQueryData(["terms"], previousTerms);
            if (previousBySchool) queryClient.setQueryData(["terms", "bySchool", schoolId ?? ""], previousBySchool);
            if (previousById) {
                Object.entries(previousById).forEach(([id, item]) => {
                    queryClient.setQueryData(["terms", id], item);
                });
            }
        },

        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: ["terms"] });
            if (variables?.schoolId) queryClient.invalidateQueries({ queryKey: ["terms", "bySchool", variables.schoolId] });
        },
    });
};
