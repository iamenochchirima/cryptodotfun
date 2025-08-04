import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./features/auth/authSlice"
import notificationsReducer from "./features/notifications/notificationsSlice"
import themeReducer from "./features/theme/themeSlice"
import registrationReducer from "./features/registration/registrationSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
    theme: themeReducer,
    registration: registrationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
