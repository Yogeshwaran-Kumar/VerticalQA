import { useRef, useCallback } from 'react'
import Peer, { MediaConnection } from 'peerjs'

export function useWebRTC() {
    const peerRef = useRef<Peer | null>(null)
    const callRef = useRef<MediaConnection | null>(null)
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null)

    // Create a hidden <audio> element to play remote audio
    const ensureAudioElement = () => {
        if (!remoteAudioRef.current) {
            const audio = document.createElement('audio')
            audio.autoplay = true
            audio.setAttribute('playsinline', 'true')
            audio.style.display = 'none'
            document.body.appendChild(audio)
            remoteAudioRef.current = audio
        }
        return remoteAudioRef.current
    }

    const initPeerjsCall = useCallback((
        role: 'customer' | 'agent',
        roomId: string,
        localStream: MediaStream
    ) => {
        // Use consistent IDs so they can easily find each other without signaling
        const peerId = role === 'customer' ? `${roomId}-customer` : `${roomId}-agent`
        const targetId = role === 'customer' ? `${roomId}-agent` : `${roomId}-customer`

        if (peerRef.current) {
            peerRef.current.destroy()
        }

        console.log(`📡 Initializing PeerJS as ${peerId}...`)
        
        // Connect to the free PeerJS cloud signaling server
        const peer = new Peer(peerId)
        peerRef.current = peer

        peer.on('open', (id) => {
            console.log(`✅ PeerJS connected! My ID is: ${id}`)
            
            // Customer initiates the call to the agent once connected
            if (role === 'customer') {
                console.log(`📞 Customer calling Agent (${targetId})...`)
                
                // Add a slight delay to ensure agent has time to register if they joined simultaneously
                setTimeout(() => {
                    const call = peer.call(targetId, localStream)
                    callRef.current = call

                    call.on('stream', (remoteStream) => {
                        console.log('🔊 Remote audio stream received from Agent!')
                        const audio = ensureAudioElement()
                        audio.srcObject = remoteStream
                        audio.play().catch(e => console.error('Audio play error:', e))
                    })

                    call.on('error', (err) => {
                        console.error('Call error:', err)
                    })
                }, 1500)
            }
        })

        // Agent listens for incoming calls from the customer
        peer.on('call', (call) => {
            console.log(`📞 Agent received incoming call! Answering...`)
            call.answer(localStream) // Answer with local audio stream
            callRef.current = call

            call.on('stream', (remoteStream) => {
                console.log('🔊 Remote audio stream received from Customer!')
                const audio = ensureAudioElement()
                audio.srcObject = remoteStream
                audio.play().catch(e => console.error('Audio play error:', e))
            })
        })

        peer.on('error', (err) => {
            console.error('📡 PeerJS Error:', err)
            // If the target peer isn't available yet, retry after a few seconds if we are the customer
            if (err.type === 'peer-unavailable' && role === 'customer') {
                console.log('🔄 Target agent not found, retrying call in 3s...')
                setTimeout(() => {
                    if (peerRef.current && !peerRef.current.disconnected) {
                        console.log(`📞 Retrying call to Agent (${targetId})...`)
                        const call = peerRef.current.call(targetId, localStream)
                        callRef.current = call
                        call.on('stream', (remoteStream) => {
                            console.log('🔊 Remote audio stream received from Agent!')
                            const audio = ensureAudioElement()
                            audio.srcObject = remoteStream
                        })
                    }
                }, 3000)
            }
        })

    }, [])

    // Empty stubs for the legacy WebRTC functions so App.tsx doesn't break
    const startCall = useCallback(() => {}, [])
    const answerCall = useCallback(() => {}, [])
    const handleAnswer = useCallback(() => {}, [])
    const handleIceCandidate = useCallback(() => {}, [])

    const hangUp = useCallback(() => {
        console.log('📵 PeerJS hangUp called')
        if (callRef.current) {
            callRef.current.close()
            callRef.current = null
        }
        if (peerRef.current) {
            peerRef.current.destroy()
            peerRef.current = null
        }
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null
        }
        console.log('✅ PeerJS cleaned up')
    }, [])

    return { initPeerjsCall, startCall, answerCall, handleAnswer, handleIceCandidate, hangUp }
}
