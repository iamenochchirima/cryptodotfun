import { SessionData } from "@/providers/useSessionData"
import { Actor, ActorSubclass } from "@dfinity/agent"
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { WalletType } from "@/providers/types"

interface CompleteRegistrationParams {
  sessionData: SessionData | null
  backendActor: ActorSubclass<BACKEND_SERVICE> | null;
  email: string | null;
  username: string;
  referralSource: string;
  referralCode: string;
  interests: string[];
  agreedToTerms: boolean;
}
import { _SERVICE as BACKEND_SERVICE } from "@/idls/users/users.did"

export interface RegistrationState {
  currentStep: number
  email: string | null
  username: string
  referralSource: string
  referralCode: string
  interests: string[]
  agreedToTerms: boolean
  loading: boolean
  error: string | null
  usernameAvailable: boolean | null
  emailAvailable: boolean | null
  isCompleted: boolean
}

const initialState: RegistrationState = {
  currentStep: 0,
  email: null,
  username: "",
  referralSource: "",
  referralCode: "",
  interests: [],
  agreedToTerms: false,
  loading: false,
  error: null,
  usernameAvailable: null,
  emailAvailable: null,
  isCompleted: false,
}



export const checkUsernameAvailability = createAsyncThunk(
  "registration/checkUsername", 
  async ({ username, backendActor }: { username: string; backendActor: any }) => {
    
    if (!backendActor) {
      console.error("Backend actor not available")
      return false
    }

    try {
      const available = await backendActor.is_username_available(username)
      return available
    } catch (error) {
      console.error("Error checking username availability:", error)
      throw error
    }
  }
)

export const checkEmailAvailability = createAsyncThunk(
  "registration/checkEmail", 
  async ({ email, backendActor }: { email: string; backendActor: any }) => {
    
    if (!backendActor) {
      console.error("Backend actor not available")
      return false
    }

    try {
      const inUse = await backendActor.is_email_in_use(email)
      return !inUse // Return true if email is available (not in use)
    } catch (error) {
      console.error("Error checking email availability:", error)
      throw error
    }
  }
)

// Async thunk to complete registration using backend actor
export const completeRegistration = createAsyncThunk(
  "registration/complete",
  async (params: CompleteRegistrationParams) => {
    console.log("Completing registration with params:", params)
    
    if (!params.backendActor) {
      throw new Error("Backend actor not available")
    }

    if (!params.sessionData) {
      throw new Error("Session data not available")
    }

    try {
      // Determine chain and wallet based on session data
      let chain;
      let walletName;
      
      switch (params.sessionData?.connectedWalletType) {
        case WalletType.InternetIdentity:
          chain = { ICP: null };
          walletName = "Internet Identity";
          break;
        case WalletType.SIWB:
          chain = { Bitcoin: null };
          walletName = "Bitcoin Wallet";
          break;
        case WalletType.SIWS:
          chain = { Solana: null };
          walletName = "Solana Wallet";
          break;
        case WalletType.SIWE:
          chain = { Ethereum: null };
          walletName = "Ethereum Wallet";
          break;
        case WalletType.NFID:
          chain = { ICP: null };
          walletName = "NFID";
          break;
        default:
          chain = { ICP: null };
          walletName = "Unknown Wallet";
      }

      // Call the backend canister to add the user
      const userResult = await params.backendActor.add_user({
        username: params.username,
        email: params.email ? [params.email] : [],
        referral_source: params.referralSource ? [params.referralSource] : [], 
        referral_code: params.referralCode ? [params.referralCode] : [],
        interests: params.interests,
        chain_data: {
          chain,
          wallet_address: params.sessionData?.chainAddress || "",
          wallet: walletName,
        },
        image_url: [], 
      })

      console.log("User creation result:", userResult)
      return { success: true, userData: params, userResult }
    } catch (error) {
      console.error("Error completing registration:", error)
      throw error
    }
  },
)

export const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    nextStep: (state) => {
      state.currentStep += 1
    },
    prevStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1
      }
    },
    setEmail: (state, action: PayloadAction<string | null>) => {
      state.email = action.payload
      // Reset availability when email changes
      if (state.email !== action.payload) {
        state.emailAvailable = null
      }
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
      .addCase(checkEmailAvailability.pending, (state) => {
        console.log("Email check pending")
        state.loading = true
        state.emailAvailable = null
      })
      .addCase(checkEmailAvailability.fulfilled, (state, action) => {
        console.log("Email check fulfilled:", action.payload)
        state.loading = false
        state.emailAvailable = action.payload
      })
      .addCase(checkEmailAvailability.rejected, (state) => {
        console.log("Email check rejected")
        state.loading = false
        state.error = "Failed to check email availability"
        state.emailAvailable = null
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
  setEmail,
  setUsername,
  setReferralSource,
  setReferralCode,
  setInterests,
  setAgreedToTerms,
  resetRegistration,
} = registrationSlice.actions

export default registrationSlice.reducer
