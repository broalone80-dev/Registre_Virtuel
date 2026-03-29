import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'

let socket = null

export const useSocket = () => {
    const { user, token } = useAuthStore()
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        if (!user || !token) {
            if (socket) {
                socket.disconnect()
                socket = null
            }
            return
        }

        if (!socket) {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
            socket = io(API_URL, {
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
        }

        return () => {
            // Pas de nettoyage systématique pour garder le même socket entre les rendus
        }
    }, [user, token])

    return socket
}
