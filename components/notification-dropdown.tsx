"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import {
  fetchNotificationsStart,
  fetchNotificationsSuccess,
  markAsRead,
  markAllAsRead,
} from "@/lib/redux/features/notifications/notificationsSlice"
import type { Notification } from "@/lib/redux/features/notifications/notificationsSlice"

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Course Available",
    message: "Introduction to DeFi is now available. Start learning today!",
    type: "info",
    read: false,
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    link: "/learn",
    icon: "📚",
  },
  {
    id: "2",
    title: "Tournament Starting Soon",
    message: "The Crypto Masters Tournament starts in 1 hour. Don't miss it!",
    type: "warning",
    read: false,
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
    link: "/play/tournaments",
    icon: "🏆",
  },
  {
    id: "3",
    title: "Wallet Connected",
    message: "Your wallet has been successfully connected to the platform.",
    type: "success",
    read: true,
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    icon: "🔗",
  },
]

export function NotificationDropdown() {
  const dispatch = useAppDispatch()
  const { items: notifications, unreadCount, loading } = useAppSelector((state) => state.notifications)
  const [mounted, setMounted] = useState(false)

  // Fetch notifications on mount
  useEffect(() => {
    setMounted(true)

    // Simulate API call to fetch notifications
    dispatch(fetchNotificationsStart())
    setTimeout(() => {
      dispatch(fetchNotificationsSuccess(mockNotifications))
    }, 500)
  }, [dispatch])

  const handleNotificationClick = (id: string) => {
    dispatch(markAsRead(id))
  }

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead())
  }

  // Format timestamp to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes} min${minutes !== 1 ? "s" : ""} ago`
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`
    } else {
      return `${days} day${days !== 1 ? "s" : ""} ago`
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-7">
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <div className="py-4 text-center text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="py-4 text-left px-2 text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-3 cursor-pointer w-full text-left ${
                !notification.read ? "bg-accent/50" : ""
              }`}
              onClick={() => handleNotificationClick(notification.id)}
              asChild
            >
              <Link href={notification.link || "#"}>
                <div className="flex items-start gap-2 w-full">
                  {notification.icon && <div className="text-lg mt-0.5">{notification.icon}</div>}
                  <div className="flex-1">
                    <div className="font-medium">{notification.title}</div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.timestamp)}
                    </div>
                  </div>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="w-full text-left">
          <Link href="/notifications" className="w-full text-left">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
