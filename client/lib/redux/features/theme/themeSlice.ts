import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ThemeMode = "light" | "dark" | "system"

interface ThemeState {
  mode: ThemeMode
}

// Try to get the initial theme from localStorage if available
const getInitialTheme = (): ThemeMode => {
  if (typeof window !== "undefined") {
    const savedTheme = localStorage.getItem("theme") as ThemeMode
    if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
      return savedTheme
    }
  }
  return "dark" // Default theme
}

const initialState: ThemeState = {
  mode: "dark", // This will be overridden in the component with the actual value
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.mode = action.payload
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", action.payload)
      }
    },
  },
})

export const { setTheme } = themeSlice.actions

export default themeSlice.reducer
