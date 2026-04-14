export type UserRole = 'customer' | 'agent' | 'supervisor'

export interface Message {
    role: 'customer' | 'agent'
    text: string
    timestamp: string
}

export type VoiceEmotion = 'happiness' | 'neutral' | 'sadness' | 'fear' | 'disgust' | 'anger'
export type VocalTension = 'low' | 'medium' | 'high'

export interface Evaluation {
    intent: string
    sentiment: 'positive' | 'neutral' | 'negative'
    toxicity_flag: boolean
    compliance_flags?: string[]
    escalation_risk: 'low' | 'medium' | 'high'
    escalation_score: number
    agent_suggestion: string
}

export interface Metrics {
    total_latency_ms: number
    throughput_kbps: number
    asr_confidence: number
}

export interface AnalyticsData {
    intent: string
    sentiment: string
    escalation_risk: string
    toxicity_flag: boolean
    agent_suggestion: string
}

export interface RoomState {
    roomId: string
    customerConnected: boolean
    agentConnected: boolean
    supervisorConnected: boolean
    status: 'waiting' | 'active' | 'ended'
}

export interface User {
    userId: string
    role: UserRole
    name: string
    roomId?: string
}

export interface AgentSession {
    userId: string
    name: string
    roomId: string
    status: 'online' | 'offline'
}

export interface RoomInfo {
    roomId: string
    customerName: string
    agentName: string | null
    status: 'waiting' | 'active' | 'ended'
    startTime: string
    messages?: Message[]
    sentiment?: 'positive' | 'neutral' | 'negative'
    escalationRisk?: 'low' | 'medium' | 'high'
    toxicityFlag?: boolean
    callDurationSeconds?: number
    intent?: string
    suggestion?: string
    voiceEmotion?: VoiceEmotion
    escalationScore?: number
}
