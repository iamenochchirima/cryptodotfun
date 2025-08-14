import { ApiInitAuthResponse } from '@/types/auth'
import ApiService from './ApiService'
import endpointConfig from './endpoint.config'

export async function apiInitAuth() {
    return ApiService.fetchDataWithAxios<ApiInitAuthResponse>({
        url: endpointConfig.initAuth,
        method: 'post',
        data: {
            expiration_minutes: 5
        }
    })
}

export async function apiVerifyIdentity(sessionId: string) {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.verifyIdentity,
        method: 'get',
        params: {
            sessionId,
        }
    })
}

export async function apiLogout() {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.logout,
        method: 'post',
    })
}

export async function apiMe () {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.me,
        method: 'get',
    })
}
