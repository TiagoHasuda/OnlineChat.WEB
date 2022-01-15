import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { ChangeEvent, FocusEvent, FormEvent, useEffect, useState } from 'react'
import Socket from '../socket/socket'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  const newUserResponse = (data: any) => {
    if (Object.keys(data).includes('message')) {
      setError(data.message)
    } else {
      Socket.privateKey = new Uint8Array(data.secretKey)
      Socket.nickname = data.name
      router.push('/chat')
    }
  }

  useEffect(() => {
    Socket.on('connect', () => {
      console.log('Connected')
    })

    Socket.on('newUserResponse', newUserResponse)

    return () => {
      Socket.off('newUserResponse', newUserResponse)
    }
  }, [])

  const submitForm = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!nickname) return
    Socket.emit('newUser', { name: nickname })
  }

  const inputBlur = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (!e.target.value)
      setError('Empty nickname')
  }

  const inputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value)
    setError('')
  }

  return <div className={styles.homeContainer}>
    <form className={styles.formContainer} onSubmit={submitForm}>
      <label className={styles.label}>Nickname</label>
      <input
        type='text'
        className={styles.nicknameInput}
        value={nickname}
        onChange={inputChange}
        onBlur={inputBlur}
      />
      {!!error && <a className={styles.error}>{error}</a>}
      <button className={styles.submitBtn}>Enter</button>
    </form>
  </div>
}

export default Home
