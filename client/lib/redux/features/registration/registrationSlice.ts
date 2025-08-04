import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"

export interface RegistrationState {
  currentStep: number
  walletConnected: boolean
  walletAddress: string
  email: string
  username: string
  referralSource: string
  referralCode: string
  interests: string[]
  agreedToTerms: boolean
  loading: boolean
  error: string | null
  usernameAvailable: boolean | null
  isCompleted: boolean
}

const initialState: RegistrationState = {
  currentStep: 0,
  walletConnected: false,
  walletAddress: "",
  email: "",
  username: "",
  referralSource: "",
  referralCode: "",
  interests: [],
  agreedToTerms: false,
  loading: false,
  error: null,
  usernameAvailable: null,
  isCompleted: false,
}

// Mock async thunk to check username availability
export const checkUsernameAvailability = createAsyncThunk("registration/checkUsername", async (username: string) => {
  console.log("Checking username availability for:", username)
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Mock check - usernames containing "taken" are considered unavailable
  const isAvailable = !username.toLowerCase().includes("taken")
  console.log("Username availability result:", isAvailable)
  return isAvailable
})

// Mock async thunk to complete registration
export const completeRegistration = createAsyncThunk(
  "registration/complete",
  async (
    userData: Omit<RegistrationState, "currentStep" | "loading" | "error" | "usernameAvailable" | "isCompleted">,
  ) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock successful registration
    return { success: true, userData }
  },
)

export const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    nextStep: (state) => {
      console.log("Moving to next step from:", state.currentStep)
      state.currentStep += 1
    },
    prevStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1
      }
    },
    setWalletInfo: (state, action: PayloadAction<{ connected: boolean; address: string }>) => {
      state.walletConnected = action.payload.connected
      state.walletAddress = action.payload.address
    },
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
      // Reset availability when username changes
      if (state.username !== action.payload) {
        state.usernameAvailable = null
      }
    },
    setReferralSource: (state, action: PayloadAction<string>) => {
      state.referralSource = action.payload
    },
    setReferralCode: (state, action: PayloadAction<string>) => {
      state.referralCode = action.payload
    },
    setInterests: (state, action: PayloadAction<string[]>) => {
      state.interests = action.payload
    },
    setAgreedToTerms: (state, action: PayloadAction<boolean>) => {
      state.agreedToTerms = action.payload
    },
    resetRegistration: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkUsernameAvailability.pending, (state) => {
        console.log("Username check pending")
        state.loading = true
        state.usernameAvailable = null
      })
      .addCase(checkUsernameAvailability.fulfilled, (state, action) => {
        console.log("Username check fulfilled:", action.payload)
        state.loading = false
        state.usernameAvailable = action.payload
      })
      .addCase(checkUsernameAvailability.rejected, (state) => {
        console.log("Username check rejected")
        state.loading = false
        state.error = "Failed to check username availability"
        state.usernameAvailable = null
      })
      .addCase(completeRegistration.pending, (state) => {
        state.loading = true
      })
      .addCase(completeRegistration.fulfilled, (state) => {
        state.loading = false
        state.isCompleted = true
      })
      .addCase(completeRegistration.rejected, (state) => {
        state.loading = false
        state.error = "Registration failed. Please try again."
      })
  },
})

export const {
  nextStep,
  prevStep,
  setWalletInfo,
  setEmail,
  setUsername,
  setReferralSource,
  setReferralCode,
  setInterests,
  setAgreedToTerms,
  resetRegistration,
} = registrationSlice.actions

export default registrationSlice.reducer
