import { useEffect, useState } from 'react'

interface WaitingRoomProps {
    roomId: string
    userName: string
    onCancel: () => void
    onCall: () => void
    agentOnline: boolean
}

function WaitingRoom({ roomId, userName, onCancel, onCall, agentOnline }: WaitingRoomProps) {
    const [dots, setDots] = useState('.')
    const [isCallStarting, setIsCallStarting] = useState(false)

    console.log('🏠 WaitingRoom rendered:', { roomId, userName, agentOnline, isCallStarting })

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '.' : prev + '.')
        }, 500)
        return () => clearInterval(interval)
    }, [])

    const handleStartCall = () => {
        console.log('🔘 Start Call button clicked')
        console.log('📊 Current state:', { isCallStarting, agentOnline })
        setIsCallStarting(true)
        console.log('📞 Calling onCall()')
        onCall()
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
                    {/* Animated Icon */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-32 h-32 bg-blue-500/20 rounded-full animate-ping"></div>
                        </div>
                        <div className="relative flex justify-center">
                            {agentOnline ? (
                                <svg className="w-16 h-16 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            ) : (
                                <svg className="w-16 h-16 text-yellow-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>
                    </div>

                    {/* Status */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {agentOnline ? 'Agent is Online' : `Waiting for Agent${dots}`}
                    </h2>
                    <p className="text-gray-400 mb-6">
                        {agentOnline
                            ? `Hello ${userName}, you can now start your call`
                            : `Hello ${userName}, please wait while we connect you to an available agent`}
                    </p>

                    {/* Room Info */}
                    <div className="bg-white/5 rounded-lg p-4 mb-6">
                        <div className="text-sm text-gray-400 mb-1">Room ID</div>
                        <div className="text-white font-mono text-lg">{roomId.substring(0, 8)}</div>
                    </div>

                    {/* Status Indicators */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <span className="text-gray-300">Customer (You)</span>
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-green-400 text-sm">Connected</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                            <span className="text-gray-300">Agent</span>
                            <span className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${agentOnline ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`}></div>
                                <span className={`${agentOnline ? 'text-green-400' : 'text-yellow-400'} text-sm`}>
                                    {agentOnline ? 'Online' : 'Waiting...'}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Call Button */}
                    <div className="space-y-3 mb-6">
                        {agentOnline ? (
                            <button
                                onClick={handleStartCall}
                                disabled={isCallStarting}
                                className={`w-full px-6 py-4 rounded-lg font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 ${isCallStarting
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white transform hover:scale-105'
                                    }`}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                {isCallStarting ? 'Starting Call...' : 'Start Call'}
                            </button>
                        ) : (
                            <button
                                disabled
                                className="w-full px-6 py-4 bg-gray-600/50 text-gray-400 rounded-lg font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                Call (Agent Offline)
                            </button>
                        )}
                    </div>

                    {/* Cancel Button */}
                    <button
                        onClick={onCancel}
                        className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors border border-red-500/30"
                    >
                        Cancel & Leave
                    </button>

                    {/* Tips */}
                    <div className="mt-6 text-left">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-gray-500">Tips while you wait:</p>
                        </div>
                        <ul className="text-xs text-gray-400 space-y-1">
                            <li>• Prepare your questions or concerns</li>
                            <li>• Ensure your microphone is working</li>
                            <li>• Average wait time: 30-60 seconds</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default WaitingRoom
