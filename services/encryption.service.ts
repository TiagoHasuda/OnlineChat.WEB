import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'

export class EncryptionService {
    static generateRandomBytes(): Uint8Array {
        return nacl.randomBytes(24)
    }

    static generateCipherText(message: string, publicKey: Uint8Array, secretKey: Uint8Array) {
        const sharedKey = nacl.box.before(publicKey, secretKey)

        const code = nacl.randomBytes(24)

        const cipherText = nacl.box.after(
            naclUtil.decodeUTF8(message),
            code,
            sharedKey,
        )

        return { cipherText, code }
    }

    static decodeMessage(cipherText: Uint8Array, code: Uint8Array, publicKey: Uint8Array, secretKey: Uint8Array) {
        const sharedKey = nacl.box.before(publicKey, secretKey)

        const decoded_message = nacl.box.open.after(
            cipherText,
            code,
            sharedKey,
        )

        if (!!decoded_message) {
            const res = naclUtil.encodeUTF8(decoded_message)
            return res
        }
        return ''
    }
}
