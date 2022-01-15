import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { Message } from '../models/message'
import { User } from '../models/user'
import { EncryptionService } from '../services/encryption.service'
import Socket from '../socket/socket'
import styles from '../styles/Chat.module.css'

const Chat: NextPage = () => {
    const router = useRouter()
    const [chats, _setChats] = useState<(User & { lastMessage: string })[]>([])
    const chatsRef = useRef(chats)
    const setChats = (data: (User & { lastMessage: string })[]) => {
        chatsRef.current = data
        _setChats(data)
    }
    const [selectedChat, _setSelectedChat] = useState<User>()
    const selectedChatRef = useRef(selectedChat)
    const setSelectedChat = (data: User) => {
        selectedChatRef.current = data
        _setSelectedChat(data)
    }
    const [showNewChat, setShowNewChat] = useState(false)
    const [newChatNickname, setNewChatNickname] = useState('')
    const [newChatMessage, _setNewChatMessage] = useState('')
    const newChatMessageRef = useRef(newChatMessage)
    const setNewChatMessage = (data: string) => {
        newChatMessageRef.current = data
        _setNewChatMessage(data)
    }
    const [history, _setHistory] = useState<Message[]>([])
    const historyRef = useRef(history)
    const setHistory = (data: Message[]) => {
        historyRef.current = data
        _setHistory(data)
    }
    const [chatMessage, setChatMessage] = useState('')

    const newMessage = (data: Message) => {
        setShowNewChat(false)
        if (data.from === Socket.nickname && !!data.toPublicKey && !!Socket.privateKey) {
            const newToPublicKey = new Uint8Array(data.toPublicKey)
            const transcriptedMessage = EncryptionService.decodeMessage(new Uint8Array(data.message), new Uint8Array(data.code), newToPublicKey, Socket.privateKey)
            const chat = chatsRef.current.find(chat => chat.name === data.to)
            if (!chat)
                setChats([
                    ...chatsRef.current,
                    {
                        name: data.to,
                        lastMessage: transcriptedMessage,
                        publicKey: newToPublicKey,
                    }
                ])
            else {
                setChats(chatsRef.current.map(chat => chat.name !== data.to ? chat : {
                    lastMessage: transcriptedMessage,
                    name: chat.name,
                    publicKey: chat.publicKey,
                }))
                if (selectedChatRef.current?.name === chat.name)
                    setHistory([
                        ...historyRef.current,
                        data,
                    ])
            }
        } else if (!!data.fromPublicKey && !!Socket.privateKey) {
            const newFromPublicKey = new Uint8Array(data.fromPublicKey)
            const transcriptedMessage = EncryptionService.decodeMessage(new Uint8Array(data.message), new Uint8Array(data.code), newFromPublicKey, Socket.privateKey)
            const chat = chatsRef.current.find(chat => chat.name === data.from)
            if (!chat)
                setChats([
                    ...chatsRef.current,
                    {
                        name: data.from,
                        lastMessage: transcriptedMessage,
                        publicKey: newFromPublicKey,
                    }
                ])
            else {
                setChats(chatsRef.current.map(chat => chat.name !== data.from ? chat : {
                    lastMessage: transcriptedMessage,
                    name: chat.name,
                    publicKey: chat.publicKey,
                }))
                if (selectedChatRef.current?.name === chat.name)
                    setHistory([
                        ...historyRef.current,
                        data,
                    ])
            }
        }
    }

    const getUserResponse = (data: any) => {
        if (Object.keys(data).includes('message'))
            alert(data.message)
        else {
            sendMessage(data.name, new Uint8Array(data.publicKey), newChatMessageRef.current)
        }
    }

    const sendMessageResponse = (data: Error) => {
        if (Object.keys(data).includes('message'))
            alert(data.message)
    }

    const getHistoryResponse = (data: any) => {
        if (!Array.isArray(data))
            alert(data.message)
        else
            setHistory(data)
    }

    useEffect(() => {
        if (Socket.privateKey === undefined)
            router.push('/')
        Socket.on('newMessage', newMessage)
        Socket.on('getUserResponse', getUserResponse)
        Socket.on('sendMessageResponse', sendMessageResponse)
        Socket.on('getHistoryResponse', getHistoryResponse)

        return () => {
            Socket.off('newMessage', newMessage)
            Socket.off('getUserResponse', getUserResponse)
            Socket.off('sendMessageResponse', sendMessageResponse)
            Socket.off('getHistoryResponse', getHistoryResponse)
        }
    }, [])

    const backdropClick = () => {
        setShowNewChat(false)
    }

    const sendNewMessage = () => {
        if (!newChatNickname || !newChatMessage) return alert('Please fill out all fields')
        Socket.emit('getUser', { name: newChatNickname })
    }

    const sendMessage = (nickname: string, publicKey: Uint8Array, message: string) => {
        if (!Socket.nickname || !Socket.privateKey) return
        const { cipherText, code } = EncryptionService.generateCipherText(message, publicKey, Socket.privateKey)
        const newMessage: Message = {
            code,
            date: new Date().getTime(),
            from: Socket.nickname,
            to: nickname,
            message: cipherText,
            fromPublicKey: new Uint8Array([]),
            toPublicKey: new Uint8Array([]),
        }
        Socket.emit('sendMessage', newMessage)
    }

    const selectChat = (chat: User & { lastMessage: string }) => {
        setSelectedChat(chat)
        Socket.emit('getHistory', { from: Socket.nickname, to: chat.name })
    }

    const submitMessage = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!selectedChat) return
        sendMessage(selectedChat.name, selectedChat.publicKey, chatMessage)
        setChatMessage('')
    }

    return <div className={styles.chatContainer}>
        <div className={styles.chatsContainer}>
            <div className={styles.chatsTitle}>
                <a>Chats</a>
                <div className={styles.newChatBtn} onClick={() => setShowNewChat(true)}>+</div>
            </div>
            <div className={styles.chatsList}>
                {chats.length === 0 ? <div className={styles.noChatLabel}>
                    No chats
                </div> : chats.map((chat, index) => <div className={`${styles.listItem}${chat.name === selectedChat?.name ? ` ${styles.selectedItem}` : ''}`} key={index} onClick={() => selectChat(chat)}>
                    <a className={styles.chatName}>{chat.name}</a>
                    <a className={styles.chatLastMessage}>{chat.lastMessage}</a>
                </div>)}
            </div>
        </div>
        <div className={styles.messagesContainer}>
            <a className={styles.messagesTitle}>Messages</a>
            <div className={styles.historyContainer}>
                <div className={styles.history}>
                    {history.map((item, index) => <div key={index} className={item.from === Socket.nickname ? styles.messageSent : styles.messageReceived}>
                        <a>{EncryptionService.decodeMessage(
                            new Uint8Array(item.message),
                            new Uint8Array(item.code),
                            item.from === Socket.nickname ? new Uint8Array(item.toPublicKey) : new Uint8Array(item.fromPublicKey),
                            Socket.privateKey
                        )}</a>
                    </div>)}
                </div>
                <form onSubmit={submitMessage}>
                    <input
                        type='text'
                        className={styles.messageInput}
                        maxLength={5000}
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    />
                </form>
            </div>
        </div>
        {showNewChat && <div className={styles.backdrop} onClick={backdropClick}>
            <div className={styles.newChatContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.label}>New Chat</div>
                <input
                    type='text'
                    placeholder='Nickname'
                    className={styles.textInput}
                    value={newChatNickname}
                    onChange={(e) => setNewChatNickname(e.target.value)}
                />
                <input
                    type='text'
                    placeholder='Message'
                    className={styles.textInput}
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                />
                <button className={styles.sendNewMessageButton} onClick={sendNewMessage}>Send</button>
            </div>
        </div>}
    </div>
}

export default Chat
