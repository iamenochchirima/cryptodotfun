import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

// Define a type for the slice state
interface AuthState {
  isAuthenticated: boolean
  user: {
    address: string
    username: string
    avatar: string
  } | null
  loading: boolean
  error: string | null
}

// Define the initial state using that type
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
}

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Start login process
    loginStart: (state) => {
      state.loading = true
      state.error = null
    },
    // Login success
    loginSuccess: (state, action: PayloadAction<{ address: string; username: string; avatar: string }>) => {
      state.isAuthenticated = true
      state.user = action.payload
      state.loading = false
      state.error = null
    },
    // Login failure
    loginFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    // Logout
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
    },
    // Update user profile
    updateProfile: (state, action: PayloadAction<Partial<AuthState["user"]>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
  },
})

export const { loginStart, loginSuccess, loginFailure, logout, updateProfile } = authSlice.actions

export default authSlice.reducer
