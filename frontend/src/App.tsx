import { useState, useEffect, useRef } from 'react'
import { useWebRTC } from './hooks/useWebRTC'
import RoleSelection from './pages/RoleSelection'
import WaitingRoom from './pages/WaitingRoom'
import SupervisorDashboard from './pages/SupervisorDashboard'
import TopBar from './components/TopBar'
import Transcript from './components/Transcript'
import Insights from './components/Insights'
import UserPanel from './components/UserPanel'
import ConversationSummary from './components/ConversationSummary'
import IncomingCallsPanel from './components/IncomingCallsPanel'
import CallInterface from './components/CallInterface'
import { UserRole, Message, RoomState, User, AgentSession, RoomInfo, VoiceEmotion, Evaluation } from './types'

// Hardcoded agent sessions (simulating database)
const agentSessions: AgentSession[] = [
    { userId: 'agent-1', name: 'Jai', roomId: 'room-1', status: 'online' },
    { userId: 'agent-2', name: 'Mike Agent', roomId: 'room-2', status: 'online' },
    { userId: 'agent-3', name: 'Emma Agent', roomId: 'room-3', status: 'offline' }
]

class PCMPlayer {
    private audioCtx: AudioContext | null = null;
    private nextStartTime: number = 0;

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new AudioContext({ sampleRate: 16000 });
            this.nextStartTime = this.audioCtx.currentTime;
        }
    }

    play(base64Data: string) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        try {
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const pcm16 = new Int16Array(bytes.buffer);
            const floatData = new Float32Array(pcm16.length);
            for (let i = 0; i < pcm16.length; i++) {
                // Convert PCM16 to Float32 [-1, 1]
                floatData[i] = pcm16[i] / 32768.0;
            }

            const buffer = this.audioCtx.createBuffer(1, floatData.length, 16000);
            buffer.getChannelData(0).set(floatData);

            const source = this.audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioCtx.destination);

            // Schedule smoothly to prevent overlapping/clipping
            const startTime = Math.max(this.audioCtx.currentTime, this.nextStartTime);
            source.start(startTime);
            this.nextStartTime = startTime + buffer.duration;
        } catch (e) {
            console.error('PCM playback error:', e);
        }
    }

    close() {
        if (this.audioCtx) {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }
}

function App() {
    // User state
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [roomState, setRoomState] = useState<RoomState | null>(null)
    const [micPermissionGranted, setMicPermissionGranted] = useState(false)
    const [micPermissionDenied, setMicPermissionDenied] = useState(false)

    // Call state
    const [conversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [isRecording, setIsRecording] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
    const [callState, setCallState] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'in_call' | 'ended'>('idle')
    const [callDuration, setCallDuration] = useState(0)

    // AI Insights State
    const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral')
    const [escalationRisk, setEscalationRisk] = useState<'low' | 'medium' | 'high'>('low')
    const [escalationScore, setEscalationScore] = useState<number>(0)
    const [voiceEmotion, setVoiceEmotion] = useState<VoiceEmotion>('neutral')
    const [suggestion, setSuggestion] = useState<string>('')
    const [intent, setIntent] = useState<string>('')
    const [toxicityFlag, setToxicityFlag] = useState<boolean>(false)
    const [conversationSummary, setConversationSummary] = useState<string>('')

    // Supervisor state
    const [supervisorRooms, setSupervisorRooms] = useState<RoomInfo[]>([])
    const [monitoredRoomId, setMonitoredRoomId] = useState<string | null>(null)
    const supervisorWsRef = useRef<WebSocket | null>(null)

    // Customer waiting state
    const [agentOnline, setAgentOnline] = useState(false)

    // Agent availability state
    const [isAvailable, setIsAvailable] = useState(true)
    const [botSpeaking, setBotSpeaking] = useState(false)

    // Dark mode state
    const [darkMode, setDarkMode] = useState(false)

    // Incoming calls for agents 
    const [incomingCalls, setIncomingCalls] = useState<Array<{ roomId: string; customerName: string; waitTime: number }>>([])

    useEffect(() => {
        if (currentUser?.role === 'agent' && callState === 'idle') {
            // Wait 2s then simulate an incoming session to fulfill UX testing for Agent Page
            const timer = setTimeout(() => {
                setIncomingCalls([{
                    roomId: currentUser.roomId || 'production-room',
                    customerName: 'Live Site Caller',
                    waitTime: 12
                }])
            }, 2000)
            return () => clearTimeout(timer)
        }
        if (callState === 'connected' || callState === 'in_call') {
            setIncomingCalls([])
        }
    }, [currentUser, callState])

    const wsRef = useRef<WebSocket | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const processorRef = useRef<AudioWorkletNode | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const callTimerRef = useRef<number | null>(null)
    const userRoleRef = useRef<'customer' | 'agent'>('customer')
    const pcmPlayerRef = useRef<PCMPlayer>(new PCMPlayer())

    // WebRTC for peer-to-peer audio between customer and agent
    const { initPeerjsCall, hangUp } = useWebRTC()

    // Keep userRoleRef in sync with currentUser
    useEffect(() => {
        if (currentUser?.role === 'agent' || currentUser?.role === 'customer') {
            userRoleRef.current = currentUser.role
        }
    }, [currentUser])

    useEffect(() => {
        setAgentOnline(true)
    }, [currentUser])

    // Call timer effect
    useEffect(() => {
        if (callState === 'in_call') {
            callTimerRef.current = window.setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
        } else {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current)
                callTimerRef.current = null
            }
            if (callState === 'idle' || callState === 'ended') {
                setCallDuration(0)
            }
        }
        return () => {
            if (callTimerRef.current) {
                clearInterval(callTimerRef.current)
            }
        }
    }, [callState])

    // Clean up recording if call ends
    useEffect(() => {
        if (callState === 'ended' && isRecording) {
            stopRecording()
            pcmPlayerRef.current.close()
        }
    }, [callState, isRecording])

    // Handle role selection
    const handleRoleSelect = (role: UserRole, name: string, roomId: string) => {
        const userId = `${role}-${Date.now()}`
        const user: User = { userId, role, name, roomId }
        setCurrentUser(user)

        const room: RoomState = {
            roomId,
            customerConnected: role === 'customer',
            agentConnected: role === 'agent',
            supervisorConnected: role === 'supervisor',
            status: role === 'supervisor' ? 'active' : 'waiting'
        }
        setRoomState(room)

        if (role === 'supervisor') {
            setSupervisorRooms([{
                roomId,
                customerName: 'Awaiting',
                agentName: 'Awaiting',
                status: 'active',
                startTime: new Date().toISOString()
            }])
        } else if (role === 'agent') {
            room.status = 'active'
            setRoomState(room)
            setTimeout(() => {
                setCallState('calling')
                console.log('✅ Agent joining specific room:', roomId)
            }, 500)
        }
    }

    // Connect to WebSocket
    const connectWebSocket = () => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        if (wsRef.current?.readyState === WebSocket.CONNECTING) {
            return
        }

        setConnectionStatus('connecting')
        const sessionId = currentUser?.roomId || roomState?.roomId || `session-${Date.now()}`

        pcmPlayerRef.current.init() // Initialize Audio playback context

        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
        const ws = new WebSocket(`${wsUrl}/ws/${sessionId}`)

        ws.onopen = () => {
            console.log(`✅ WebSocket connected to session: ${sessionId}`)
            setConnectionStatus('connected')

            if (roomState?.roomId) {
                ws.send(JSON.stringify({
                    type: 'start',
                    session_id: roomState.roomId
                }))
            }
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                // High frequency log throttle for audio chunks
                if (data.type !== 'audio_chunk') {
                    console.log('📥 Received message type:', data.type)
                }

                if (data.type === 'audio_chunk') {
                    // Playback incoming audio chunk if it's from the OTHER person
                    if (data.role && data.role !== userRoleRef.current && data.audio) {
                        pcmPlayerRef.current.play(data.audio)
                    }
                } else if (data.type === 'ack') {
                    console.log('✅ Session ACK received, starting recording')
                    const initWebRTC = async () => {
                        setCallState('in_call')
                        const stream = streamRef.current || await startRecording()

                        if (stream && currentUser?.role) {
                            const sessionId = currentUser.roomId || 'unknown'
                            initPeerjsCall(currentUser.role as 'agent' | 'customer', sessionId, stream)
                        }
                    }
                    initWebRTC()
                } else if (data.type === 'update') {
                    handleUpdate(data)
                } else if (data.type === 'agent_whisper') {
                    handleAgentWhisper(data)
                } else if (data.type === 'error') {
                    console.error('❌ Backend error:', data.message)
                } else if (data.type === 'transcript') {
                    handleTranscript(data)
                }
            } catch (error) {
                console.error('❌ Error parsing message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error)
            setConnectionStatus('disconnected')
        }

        ws.onclose = () => {
            console.log('❌ WebSocket disconnected')
            setConnectionStatus('disconnected')
            wsRef.current = null

            if (roomState?.status === 'active') {
                setTimeout(() => connectWebSocket(), 5000)
            }
        }

        wsRef.current = ws
    }

    // Connect supervisor to monitor a specific room
    const connectSupervisorToRoom = (roomId: string) => {
        // Disconnect previous monitoring session
        if (supervisorWsRef.current) {
            supervisorWsRef.current.close()
            supervisorWsRef.current = null
        }

        setMonitoredRoomId(roomId)
        console.log(`🔍 Supervisor monitoring room: ${roomId}`)

        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
        const ws = new WebSocket(`${wsUrl}/ws/${roomId}`)

        ws.onopen = () => {
            console.log(`✅ Supervisor connected to room ${roomId}`)
            // Send supervisor join message
            ws.send(JSON.stringify({
                type: 'supervisor_join',
                session_id: roomId,
                role: 'supervisor'
            }))
        }

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                console.log('📥 Supervisor received:', data)

                if (data.type === 'update') {
                    // Update the specific room in supervisorRooms
                    setSupervisorRooms(prev => prev.map(room => {
                        if (room.roomId === roomId) {
                            const updatedRoom = { ...room }

                            // Add transcript message
                            const textPayload = data.transcript || (data.data && data.data.transcript) || data.text || (data.data && data.data.text)
                            if (textPayload) {
                                const payloadRole = data.role || (data.data && data.data.role)
                                const role: 'customer' | 'agent' = payloadRole === 'agent' ? 'agent' : 'customer'
                                const newMessage: Message = {
                                    role,
                                    text: textPayload,
                                    timestamp: new Date().toISOString()
                                }
                                updatedRoom.messages = [...(room.messages || []), newMessage]
                            }

                            // Update advanced AI evaluation metrics
                            if (data.evaluation) {
                                if (data.evaluation.sentiment) updatedRoom.sentiment = data.evaluation.sentiment
                                if (data.evaluation.escalation_risk) updatedRoom.escalationRisk = data.evaluation.escalation_risk
                                if (data.evaluation.escalation_score !== undefined) updatedRoom.escalationScore = data.evaluation.escalation_score
                                if (data.evaluation.intent) updatedRoom.intent = data.evaluation.intent
                                if (data.evaluation.agent_suggestion) updatedRoom.suggestion = data.evaluation.agent_suggestion
                                if (data.evaluation.toxicity_flag !== undefined) updatedRoom.toxicityFlag = data.evaluation.toxicity_flag
                            }

                            // Update legacy/fallback states
                            if (data.voice_emotion) updatedRoom.voiceEmotion = data.voice_emotion
                            if (!data.evaluation) {
                                if (data.sentiment) updatedRoom.sentiment = data.sentiment
                                if (data.escalation_risk) updatedRoom.escalationRisk = data.escalation_risk
                                if (data.intent) updatedRoom.intent = data.intent
                                if (data.agent_suggestion) updatedRoom.suggestion = data.agent_suggestion
                                if (data.toxicity_flag !== undefined) updatedRoom.toxicityFlag = data.toxicity_flag
                            }

                            return updatedRoom
                        }
                        return room
                    }))
                }
            } catch (error) {
                console.error('❌ Supervisor error parsing message:', error)
            }
        }

        ws.onerror = (error) => {
            console.error('❌ Supervisor WebSocket error:', error)
        }

        ws.onclose = () => {
            console.log(`❌ Supervisor disconnected from room ${roomId}`)
            if (monitoredRoomId === roomId) {
                setMonitoredRoomId(null)
            }
        }

        supervisorWsRef.current = ws
    }

    // Disconnect supervisor from monitored room
    const disconnectSupervisorFromRoom = () => {
        if (supervisorWsRef.current) {
            supervisorWsRef.current.close()
            supervisorWsRef.current = null
        }
        setMonitoredRoomId(null)
    }

    // Handle new update message format
    const handleUpdate = (data: any) => {
        // Transcript — use role from backend, but validate it's a known value
        const textPayload = data.transcript || (data.data && data.data.transcript) || data.text || (data.data && data.data.text)

        if (textPayload) {
            const role: 'customer' | 'agent' =
                (data.role || (data.data && data.data.role)) === 'agent' ? 'agent' : 'customer'
            const newMessage: Message = {
                role,
                text: textPayload,
                timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, newMessage])
        }

        // Voice analysis
        if (data.voice_emotion) setVoiceEmotion(data.voice_emotion as VoiceEmotion)

        // Evaluation block
        const ev: Evaluation | undefined = data.evaluation
        if (ev) {
            if (ev.sentiment) setSentiment(ev.sentiment)
            if (ev.escalation_risk) setEscalationRisk(ev.escalation_risk)
            if (ev.escalation_score !== undefined) setEscalationScore(ev.escalation_score)
            if (ev.agent_suggestion) setSuggestion(ev.agent_suggestion)
            if (ev.intent) setIntent(ev.intent)
            if (ev.toxicity_flag !== undefined) setToxicityFlag(ev.toxicity_flag)
        }

        // Flat fields (legacy / fallback)
        if (!data.evaluation) {
            if (data.sentiment) setSentiment(data.sentiment)
            if (data.escalation_risk) setEscalationRisk(data.escalation_risk)
            if (data.agent_suggestion) setSuggestion(data.agent_suggestion)
            if (data.intent) setIntent(data.intent)
            if (data.toxicity_flag !== undefined) setToxicityFlag(data.toxicity_flag)
            if (data.conversation_summary) setConversationSummary(data.conversation_summary)
        }
    }

    // Handle agent whisper (private coaching, agent only)
    const handleAgentWhisper = (data: any) => {
        if (data.agent_suggestion) setSuggestion(data.agent_suggestion)
        if (data.escalation_risk) setEscalationRisk(data.escalation_risk)
        if (data.toxicity_flag !== undefined) setToxicityFlag(data.toxicity_flag)

        // Play TTS audio through headphones
        if (data.tts_audio) {
            try {
                const audio = new Audio(`data:audio/mp3;base64,${data.tts_audio}`)

                audio.onplay = () => setBotSpeaking(true)
                audio.onended = () => setBotSpeaking(false)
                audio.onerror = () => setBotSpeaking(false)

                audio.play().catch(e => {
                    console.warn('TTS playback failed:', e)
                    setBotSpeaking(false)
                })
            } catch (e) {
                console.warn('TTS audio error:', e)
                setBotSpeaking(false)
            }
        }

        console.log('🔊 Agent whisper received:', data.trigger)
    }

    const handleTranscript = (data: any) => {
        // Robust extraction of text and role in case backend wraps them in a 'data' payload object
        const textPayload = data.text || (data.data && data.data.text) || data.transcript
        const rolePayload = data.role || (data.data && data.data.role) || 'customer'
        const timestampPayload = data.timestamp || (data.data && data.data.timestamp) || new Date().toISOString()

        if (textPayload) {
            const newMessage: Message = {
                role: rolePayload,
                text: textPayload,
                timestamp: timestampPayload
            }
            setMessages(prev => [...prev, newMessage])
            console.log('📝 Added transcript:', newMessage)
        }
    }

    const startRecording = async (): Promise<MediaStream | null> => {
        if (micPermissionDenied) {
            console.error('Microphone access was denied')
            return null
        }

        if (streamRef.current) return streamRef.current

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
            })

            // Mark permission as granted if not already
            if (!micPermissionGranted) {
                setMicPermissionGranted(true)
            }

            streamRef.current = stream
            const audioContext = new AudioContext({ sampleRate: 16000 })
            audioContextRef.current = audioContext

            const source = audioContext.createMediaStreamSource(stream)

            // Use ScriptProcessorNode for audio processing (4096 buffer for stability against backend queueing)
            const processor = audioContext.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor as any

            processor.onaudioprocess = (e) => {
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0)

                    // Convert Float32 to PCM Int16 (required by backend)
                    const pcmData = new Int16Array(inputData.length)
                    for (let i = 0; i < inputData.length; i++) {
                        const s = Math.max(-1, Math.min(1, inputData[i]))
                        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
                    }

                    // Base64-encode raw PCM (no WAV headers)
                    const bytes = new Uint8Array(pcmData.buffer)
                    const base64Audio = btoa(String.fromCharCode(...bytes))

                    const payload = {
                        type: 'audio_chunk',
                        session_id: roomState?.roomId || conversationId || 'unknown',
                        role: userRoleRef.current, // Use ref instead of closure variable
                        audio: base64Audio,
                        timestamp: new Date().toISOString(),
                        sample_rate: 16000
                    }

                    wsRef.current.send(JSON.stringify(payload))
                }
            }

            source.connect(processorRef.current!)
            processorRef.current!.connect(audioContext.destination)
            setIsRecording(true)
            console.log('✅ Audio streaming started')
            return stream;
        } catch (error) {
            console.error('❌ Error starting recording:', error)
            setMicPermissionDenied(true)
            return null;
        }
    }

    const stopRecording = () => {
        console.log('🛑 stopRecording called')
        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setIsRecording(false)
    }

    const handleLogout = () => {
        console.log('🚪 handleLogout called')
        console.trace('Logout call stack')
        setCallState('ended')
        stopRecording()
        hangUp()
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'end', session_id: roomState?.roomId || 'unknown' }))
            wsRef.current.close()
        }
        // Disconnect supervisor monitoring if active
        if (supervisorWsRef.current) {
            supervisorWsRef.current.close()
            supervisorWsRef.current = null
        }
        setCurrentUser(null)
        setRoomState(null)
        setMessages([])
        setMonitoredRoomId(null)

        // Reset all AI insight states for a clean dashboard on next call
        setSentiment('neutral')
        setEscalationRisk('low')
        setEscalationScore(0)
        setSuggestion('')
        setVoiceEmotion('neutral')
        setIntent('')
        setToxicityFlag(false)
        setBotSpeaking(false)
    }

    const handleCall = () => {
        console.log('🎬 handleCall triggered, current callState:', callState)
        if (callState !== 'idle') {
            console.log('⚠️ Call already in progress, ignoring')
            return
        }

        console.log('📞 Starting call...')
        setCallState('calling')

        // Update room status to active and connect WebSocket
        if (roomState) {
            const updatedRoom = { ...roomState, status: 'active' as const }
            setRoomState(updatedRoom)
            console.log('✅ Room status updated to active:', updatedRoom.roomId)
        }

        connectWebSocket()
        // callState transitions to 'in_call' when backend sends 'ack'
        // Fallback: if no ack in 5s, transition anyway
        setTimeout(() => {
            setCallState(prev => {
                if (prev === 'calling') {
                    console.log('⏰ Timeout: transitioning to in_call')
                    return 'in_call'
                }
                return prev
            })
        }, 5000)
    }

    // Handle making a new call (from UserPanel)
    const handleMakeCall = () => {
        if (!currentUser) return
        console.warn('Manual Make Call handled via RoleSelection now')
    }

    // Toggle agent availability
    const handleToggleAvailability = () => {
        setIsAvailable(prev => !prev)
    }

    // Toggle dark mode
    const handleToggleDarkMode = () => {
        setDarkMode(prev => !prev)
    }

    // Handle accepting incoming call (for agents)
    const handleAcceptCall = (roomId: string) => {
        console.log(`🎯 Agent accepting call for room: ${roomId}`)
        setIncomingCalls(prev => prev.filter(call => call.roomId !== roomId))

        if (currentUser) {
            const room: RoomState = {
                roomId,
                customerConnected: true,
                agentConnected: true,
                supervisorConnected: false,
                status: 'active'
            }
            currentUser.roomId = roomId
            setRoomState(room)

            console.log(`✅ Agent joined room: ${roomId}`)
            connectWebSocket()

            setCallState('connected')
            setTimeout(() => {
                setCallState('in_call')
            }, 1000)
        }
    }

    // Handle rejecting incoming call (for agents)
    const handleRejectCall = (roomId: string) => {
        // Remove from incoming calls
        setIncomingCalls(prev => prev.filter(call => call.roomId !== roomId))
        console.log(`Call ${roomId} rejected`)
    }

    // Render based on user role and state
    if (!currentUser) {
        console.log('🎭 Rendering: RoleSelection')
        return <RoleSelection onRoleSelect={handleRoleSelect} />
    }

    if (currentUser.role === 'supervisor') {
        console.log('🎭 Rendering: SupervisorDashboard')
        return (
            <SupervisorDashboard
                userName={currentUser.name}
                rooms={supervisorRooms}
                agents={agentSessions}
                onLogout={handleLogout}
                onMonitorRoom={connectSupervisorToRoom}
                onStopMonitoring={disconnectSupervisorFromRoom}
                monitoredRoomId={monitoredRoomId}
            />
        )
    }

    if (roomState?.status === 'waiting') {
        // Only customers see the waiting room
        // Agents go directly to their dashboard
        if (currentUser.role === 'customer') {
            console.log('🎭 Rendering: WaitingRoom', { roomId: roomState.roomId, agentOnline })
            return (
                <WaitingRoom
                    roomId={roomState.roomId}
                    userName={currentUser.name}
                    onCancel={handleLogout}
                    onCall={handleCall}
                    agentOnline={agentOnline}
                />
            )
        }
        // Agents fall through to the main interface
    }

    // Active call interface (for customer and agent)
    console.log('🎭 Rendering: Main Call Interface', { callState, roomStatus: roomState?.status })
    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <TopBar
                isRecording={isRecording}
                connectionStatus={connectionStatus}
                conversationId={conversationId}
                darkMode={darkMode}
                onToggleDarkMode={handleToggleDarkMode}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Connection Status Banner */}
                {connectionStatus === 'disconnected' && (
                    <div className={`mb-6 rounded-xl backdrop-blur-xl border ${darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50/80 border-yellow-200/50'}`}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center">
                                <svg className={`w-6 h-6 mr-3 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <h3 className={`font-semibold text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Backend Not Connected</h3>
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-yellow-200/80' : 'text-yellow-700'}`}>
                                        WebSocket backend is not running. UI works, but audio won't be processed.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={connectWebSocket}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${darkMode ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30' : 'bg-yellow-600 hover:bg-yellow-700 text-white'}`}
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {/* Microphone Permission Banner - Only show if denied */}
                {micPermissionDenied && (
                    <div className={`mb-6 rounded-xl backdrop-blur-xl border p-4 ${darkMode ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50/80 border-red-200/50'}`}>
                        <div className="flex items-center">
                            <svg className={`w-6 h-6 mr-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                            <div>
                                <h3 className={`font-semibold text-sm ${darkMode ? 'text-red-300' : 'text-red-800'}`}>Microphone Access Denied</h3>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-red-200/80' : 'text-red-700'}`}>
                                    Please allow microphone access in your browser settings.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Sidebar - User Panel */}
                    <div className="lg:col-span-3">
                        <UserPanel
                            user={currentUser}
                            roomState={roomState}
                            onMakeCall={handleMakeCall}
                            onEndCall={handleLogout}
                            connectionStatus={connectionStatus}
                            onToggleAvailability={handleToggleAvailability}
                            isAvailable={isAvailable}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-9 space-y-6">
                        {/* Show Incoming Calls Panel for agents when not in a call */}
                        {currentUser.role === 'agent' && callState === 'idle' ? (
                            <IncomingCallsPanel
                                incomingCalls={incomingCalls}
                                onAcceptCall={handleAcceptCall}
                                onRejectCall={handleRejectCall}
                            />
                        ) : (
                            <>
                                {/* Call Interface */}
                                <CallInterface
                                    callState={callState}
                                    callDuration={callDuration}
                                    isRecording={isRecording}
                                    onEndCall={handleLogout}
                                    userRole={currentUser.role as 'customer' | 'agent'}
                                    customerName={roomState?.roomId}
                                />

                                {/* Transcripts and Insights Dashboard - Hidden for customers */}
                                {currentUser.role !== 'customer' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                                        <div className="lg:col-span-8">
                                            <Transcript messages={messages} />
                                        </div>
                                        <div className="lg:col-span-4">
                                            <Insights
                                                sentiment={sentiment}
                                                escalationRisk={escalationRisk}
                                                escalationScore={escalationScore}
                                                voiceEmotion={voiceEmotion}
                                                intent={intent}
                                                toxicityFlag={toxicityFlag}
                                                suggestion={suggestion}
                                                botSpeaking={botSpeaking}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Conversation Summary */}
                                {conversationSummary && currentUser.role !== 'customer' && (
                                    <div>
                                        <ConversationSummary summary={conversationSummary} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

export default App
