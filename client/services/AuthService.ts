import ApiService from './ApiService'

import { InitAuthResponse } from '@/types/auth'
import endpointConfig from './endpoint.config'

export async function apiInitAuth() {
    return ApiService.fetchDataWithAxios<InitAuthResponse>({
        url: endpointConfig.initAuth,
        method: 'post',

    })
}

export async function apiVerifyIdentity(sessionId: string, principal : string) {
    return ApiService.fetchDataWithAxios({
        url: endpointConfig.verifyIdentity,
        method: 'post',
        data: {
            sessionId,
            principal
        }
    })
}
