import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'

export const useSocket = () => {
    const token = useAuthStore((s) => s.token)
    const user = useAuthStore((s) => s.user)
    const [isConnected, setIsConnected] = useState(false)
    const socketRef = useRef(null)

    useEffect(() => {
        if (!user || !token) {
            if (socketRef.current) {
                socketRef.current.disconnect()
                socketRef.current = null
                setIsConnected(false)
            }
            return
        }

        // Reconnect si le token change (refresh)
        if (socketRef.current) {
            socketRef.current.disconnect()
            socketRef.current = null
        }

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
        const socket = io(API_URL, {
            auth: { token },
            query: { userId: user.id }
        })

        socket.on('connect', () => {
            setIsConnected(true)
            console.log('Connected to socket')
        })

        socket.on('disconnect', () => {
            setIsConnected(false)
            console.log('Disconnected from socket')
        })

        socketRef.current = socket

        return () => {
            socket.off('connect')
            socket.off('disconnect')
            socket.disconnect()
            socketRef.current = null
            setIsConnected(false)
        }
    }, [user?.id, token])

    return socketRef.current
}
