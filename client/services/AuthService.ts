import ApiService from './ApiService'

import { InitAuthResponse } from '@/types/auth'
import endpointConfig from './endpoint.config'

export async function apiInitAuth() {
    return ApiService.fetchDataWithAxios<InitAuthResponse>({
        url: endpointConfig.initAuth,
        method: 'post',

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
