import { useState, useEffect, useRef } from 'react'
import { HiOutlinePaperAirplane, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { useAuthStore } from '../stores/authStore'
import { useApi } from '../hooks/useApi'
import { useSocket } from '../hooks/useSocket'
import toast from 'react-hot-toast'

export default function ChatWindow({ interventionId }) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const user = useAuthStore((s) => s.user)
    const api = useApi()
    const socket = useSocket()
    const scrollRef = useRef()

    useEffect(() => {
        // Fetch history
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/messages/intervention/${interventionId}`)
                if (res?.data) setMessages(res.data)
                else if (Array.isArray(res)) setMessages(res)
            } catch (err) {
                console.error("Erreur historique messages", err)
            }
        }
        if (interventionId) fetchHistory()

        // Socket logic
        if (socket) {
            socket.emit('join_intervention', interventionId)

            socket.on('new_message', (msg) => {
                // S'assurer que le message appartient à cette intervention
                if (msg.intervention_id === interventionId) {
                    setMessages((prev) => [...prev, msg])
                }
            })

            return () => {
                socket.emit('leave_intervention', interventionId)
                socket.off('new_message')
            }
        }
    }, [interventionId, socket, api])

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            await api.post('/messages', {
                content: newMessage,
                intervention_id: interventionId
            })
            setNewMessage('')
        } catch (err) {
            toast.error("Erreur d'envoi du message")
        }
    }

    return (
        <div className="chat-window">
            <div className="chat-header">
                <HiOutlineChatBubbleLeftRight size={20} />
                <h3>Messagerie Interne</h3>
            </div>

            <div className="chat-messages">
                {(!messages || messages.length === 0) && (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '40px 20px' }}>
                        Aucun message. Commencez la conversation.
                    </div>
                )}
                {Array.isArray(messages) && messages.map((msg) => (
                    <div key={msg.id} className={`message-item ${msg.sender_id === user?.id ? 'own' : ''}`}>
                        <div className="message-info">
                            <span className="sender-name">{msg.sender?.first_name} {msg.sender?.last_name}</span>
                            <span className="message-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form className="chat-input" onSubmit={handleSend}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Tapez votre message..."
                />
                <button type="submit">
                    <HiOutlinePaperAirplane size={18} />
                </button>
            </form>

            <style jsx>{`
                .chat-window {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    min-height: 400px;
                    background: rgba(15, 23, 42, 0.3);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 12px;
                    overflow: hidden;
                }
                .chat-header {
                    padding: 12px 16px;
                    background: rgba(30, 41, 59, 0.5);
                    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .chat-header h3 { font-size: 14px; font-weight: 600; margin: 0; }
                
                .chat-messages {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .message-item {
                    max-width: 80%;
                    align-self: flex-start;
                }
                .message-item.own {
                    align-self: flex-end;
                }
                .message-info {
                    display: flex;
                    gap: 8px;
                    font-size: 11px;
                    margin-bottom: 4px;
                }
                .message-item.own .message-info { justify-content: flex-end; }
                .sender-name { font-weight: 600; color: #94a3b8; }
                .message-time { color: #64748b; }
                
                .message-content {
                    padding: 8px 12px;
                    background: rgba(51, 65, 85, 0.5);
                    border-radius: 10px;
                    font-size: 14px;
                    line-height: 1.4;
                }
                .message-item.own .message-content {
                    background: #3b82f6;
                    color: white;
                }
                
                .chat-input {
                    padding: 12px;
                    background: rgba(30, 41, 59, 0.8);
                    display: flex;
                    gap: 10px;
                }
                .chat-input input {
                    flex: 1;
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(148, 163, 184, 0.1);
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: white;
                    font-size: 13px;
                }
                .chat-input input:focus { outline: none; border-color: #3b82f6; }
                .chat-input button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
            `}</style>
        </div>
    )
}
