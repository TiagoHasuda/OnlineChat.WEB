export interface Message {
    from: string
    fromPublicKey: Uint8Array
    to: string
    toPublicKey: Uint8Array
    message: Uint8Array
    code: Uint8Array
    date: number
}
