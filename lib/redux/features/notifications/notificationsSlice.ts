import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  timestamp: number
  link?: string
  icon?: string
}

interface NotificationsState {
  items: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,
}

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    // Fetch notifications start
    fetchNotificationsStart: (state) => {
      state.loading = true
      state.error = null
    },
    // Fetch notifications success
    fetchNotificationsSuccess: (state, action: PayloadAction<Notification[]>) => {
      state.items = action.payload
      state.unreadCount = action.payload.filter((notification) => !notification.read).length
      state.loading = false
    },
    // Fetch notifications failure
    fetchNotificationsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false
      state.error = action.payload
    },
    // Add a new notification
    addNotification: (state, action: PayloadAction<Omit<Notification, "id" | "timestamp" | "read">>) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        read: false,
        ...action.payload,
      }
      state.items.unshift(newNotification)
      state.unreadCount += 1
    },
    // Mark notification as read
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((item) => item.id === action.payload)
      if (notification && !notification.read) {
        notification.read = true
        state.unreadCount -= 1
      }
    },
    // Mark all notifications as read
    markAllAsRead: (state) => {
      state.items.forEach((notification) => {
        notification.read = true
      })
      state.unreadCount = 0
    },
    // Remove a notification
    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.items.findIndex((item) => item.id === action.payload)
      if (index !== -1) {
        const wasUnread = !state.items[index].read
        state.items.splice(index, 1)
        if (wasUnread) {
          state.unreadCount -= 1
        }
      }
    },
    // Clear all notifications
    clearNotifications: (state) => {
      state.items = []
      state.unreadCount = 0
    },
  },
})

export const {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  fetchNotificationsFailure,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
} = notificationsSlice.actions

export default notificationsSlice.reducer
