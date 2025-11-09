import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSchools, fetchSchoolById, createSchool, updateSchool, deleteSchools } from "@/lib/api/schools";
import { School } from "@/generated/prisma";

/**
 * Fetch all schools records
 */
export const useSchools = () => {
    return useQuery({
        queryKey: ['schools'],
        queryFn: () => fetchSchools()
    });
};

/** 
* Fetch single school record
*/
export const useSchoolById = (id: string) => {
    return useQuery({
        queryKey: ['schools', id],
        queryFn: () => fetchSchoolById(id),
        enabled: !!id,
    });
};

/** 
* Create a new school record
*/
export const useCreateSchool = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: School) => createSchool(data),
        onSuccess: (newSchool) => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
            queryClient.setQueryData(['schools', newSchool?.id], newSchool)
        }
    });
};

/** 
* Update school records
*/
export const useUpdateSchool = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<School> }) => updateSchool(id, data),
        onSuccess: (updatedSchool) => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
            queryClient.setQueryData(['schools', updatedSchool.id], updatedSchool);
        }
    });
};

/** 
* Delete School(s) records
*/
export const useDeleteSchools = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (ids: string[]) => deleteSchools(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
        }
    });
};
