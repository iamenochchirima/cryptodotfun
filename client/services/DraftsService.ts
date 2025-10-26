import ApiService from './ApiService'
import endpointConfig from './endpoint.config'
import { CollectionDraft, CreateDraftRequest, UpdateDraftRequest } from '@/types/drafts'

export async function apiCreateDraft(data: CreateDraftRequest) {
    return ApiService.fetchDataWithAxios<CollectionDraft, CreateDraftRequest>({
        url: endpointConfig.drafts,
        method: 'post',
        data,
    })
}

export async function apiGetUserDrafts(userId: string) {
    return ApiService.fetchDataWithAxios<CollectionDraft[]>({
        url: endpointConfig.userDrafts(userId),
        method: 'get',
    })
}

export async function apiGetDraft(draftId: string) {
    return ApiService.fetchDataWithAxios<CollectionDraft>({
        url: endpointConfig.draft(draftId),
        method: 'get',
    })
}

export async function apiUpdateDraft(draftId: string, data: UpdateDraftRequest) {
    return ApiService.fetchDataWithAxios<CollectionDraft, UpdateDraftRequest>({
        url: endpointConfig.draft(draftId),
        method: 'put',
        data,
    })
}

export async function apiDeleteDraft(draftId: string) {
    return ApiService.fetchDataWithAxios<{ message: string }>({
        url: endpointConfig.draft(draftId),
        method: 'delete',
    })
}

export async function apiUploadDraftImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    return ApiService.fetchDataWithAxios<{ url: string; filename: string }>({
        url: endpointConfig.uploadDraftImage,
        method: 'post',
        data: formData as any,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

export async function apiBatchUploadNftAssets(files: FileList | File[]) {
    const formData = new FormData()

    Array.from(files).forEach((file) => {
        formData.append('files', file)
    })

    return ApiService.fetchDataWithAxios<{
        uploaded: Array<{ filename: string; url: string }>;
        failed: Array<{ filename: string; error: string }>;
        total_uploaded: number;
        total_failed: number;
    }>({
        url: endpointConfig.batchUploadNftAssets,
        method: 'post',
        data: formData as any,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
