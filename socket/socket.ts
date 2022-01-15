import { io, Socket as IoSocket } from 'socket.io-client'

export default class Socket {
    private static socket: IoSocket = io('ws://james-chat-api.herokuapp.com', {
        reconnection: false,
        transports: ['websocket'],
    })

    public static privateKey: Uint8Array
    public static nickname: string | undefined = undefined

    static on(ev: string, listener: (...args: any[]) => void) {
        return this.socket.on(ev, listener)
    }

    static emit(ev: string, ...args: any[]) {
        return this.socket.emit(ev, args)
    }

    static off(ev?: string | undefined, listener?: ((...args: any[]) => void) | undefined) {
        return this.socket.off(ev, listener)
    }
}
