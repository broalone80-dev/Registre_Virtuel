import { useState, useEffect, useRef } from 'react'
import { useApi } from '../hooks/useApi'
import { useSocket } from '../hooks/useSocket'
import { useAuthStore } from '../stores/authStore'
import { HiOutlinePaperAirplane, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import './EquipmentChat.css'

export default function EquipmentChat({ equipmentId, onClose }) {
    const api = useApi()
    const socket = useSocket()
    const user = useAuthStore(s => s.user)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const res = await api.get(`/messages/equipment/${equipmentId}`)
                if (res?.data) setMessages(Array.isArray(res.data) ? res.data : (res.data.data || []))
            } catch (err) {
                console.error('Error loading messages:', err)
            } finally {
                setLoading(false)
            }
        }
        if (equipmentId) loadMessages()
    }, [equipmentId, api])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Socket.io real-time — join room + listen
    useEffect(() => {
        if (!socket || !equipmentId) return
        // Join the equipment room so we receive targeted messages
        socket.emit('join_equipment', equipmentId)
        const handler = (msg) => {
            setMessages(prev => {
                // Avoid duplicate if we already added it optimistically
                if (prev.some(m => m.id === msg.id)) return prev
                return [...prev, msg]
            })
        }
        socket.on(`chat:${equipmentId}`, handler)
        return () => {
            socket.off(`chat:${equipmentId}`, handler)
            socket.emit('leave_equipment', equipmentId)
        }
    }, [socket, equipmentId])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const res = await api.post('/messages', {
                content: newMessage.trim(),
                equipment_id: equipmentId
            })
            if (res?.data) {
                const msg = res.data.data || res.data
                setMessages(prev => [...prev, msg])
            }
            setNewMessage('')
        } catch (err) {
            console.error('Error sending message:', err)
        } finally {
            setSending(false)
        }
    }

    const formatTime = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr)
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    }

    // Group messages by date
    const groupedMessages = messages.reduce((groups, msg) => {
        const date = new Date(msg.created_at).toDateString()
        if (!groups[date]) groups[date] = []
        groups[date].push(msg)
        return groups
    }, {})

    return (
        <div className="eq-chat-panel">
            <div className="eq-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineChatBubbleLeftRight size={20} />
                    <h3>Discussion</h3>
                    <span className="eq-chat-count">{messages.length} message{messages.length !== 1 ? 's' : ''}</span>
                </div>
                {onClose && (
                    <button className="eq-chat-close" onClick={onClose}>&times;</button>
                )}
            </div>

            <div className="eq-chat-messages">
                {loading ? (
                    <div className="eq-chat-loading">Chargement...</div>
                ) : messages.length === 0 ? (
                    <div className="eq-chat-empty">
                        <HiOutlineChatBubbleLeftRight size={32} />
                        <p>Aucun message. Commencez la discussion.</p>
                    </div>
                ) : (
                    Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                        <div key={dateKey}>
                            <div className="eq-chat-date-divider">
                                <span>{formatDate(msgs[0].created_at)}</span>
                            </div>
                            {msgs.map((msg) => {
                                const isMe = msg.sender_id === user?.id || msg.sender?.id === user?.id
                                const senderName = msg.sender
                                    ? `${msg.sender.first_name} ${msg.sender.last_name}`
                                    : 'Inconnu'
                                const senderRole = msg.sender?.role || ''

                                return (
                                    <div key={msg.id} className={`eq-chat-bubble ${isMe ? 'sent' : 'received'}`}>
                                        {!isMe && (
                                            <div className="eq-chat-sender">
                                                <span className="sender-name">{senderName}</span>
                                                <span className="sender-role">{senderRole}</span>
                                            </div>
                                        )}
                                        <div className="eq-chat-content">{msg.content}</div>
                                        <span className="eq-chat-time">{formatTime(msg.created_at)}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="eq-chat-input" onSubmit={handleSend}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrire un message..."
                    disabled={sending}
                />
                <button type="submit" disabled={!newMessage.trim() || sending}>
                    <HiOutlinePaperAirplane size={18} />
                </button>
            </form>
        </div>
    )
}
