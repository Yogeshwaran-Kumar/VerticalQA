interface CallInterfaceProps {
    callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'in_call' | 'ended'
    callDuration: number
    isRecording: boolean
    onEndCall: () => void
    userRole: 'customer' | 'agent'
    customerName?: string
}

function CallInterface({ callState, callDuration, isRecording, onEndCall, userRole, customerName }: CallInterfaceProps) {
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const getCallStateDisplay = () => {
        switch (callState) {
            case 'calling':
                return { text: 'Calling...', color: 'text-blue-600', icon: 'phone', animate: true }
            case 'ringing':
                return { text: 'Ringing...', color: 'text-yellow-600', icon: 'bell', animate: true }
            case 'connected':
                return { text: 'Connecting...', color: 'text-green-600', icon: 'link', animate: true }
            case 'in_call':
                return { text: 'In Call', color: 'text-green-600', icon: 'phone-active', animate: false }
            default:
                return { text: 'Idle', color: 'text-gray-600', icon: 'phone-off', animate: false }
        }
    }

    const stateDisplay = getCallStateDisplay()

    const getIconSvg = (icon: string) => {
        switch (icon) {
            case 'phone':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                )
            case 'bell':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                )
            case 'link':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                )
            case 'phone-active':
                return (
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                )
            case 'phone-off':
                return (
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                    </svg>
                )
            default:
                return null
        }
    }

    return (
        <div className="glass-panel relative overflow-hidden rounded-[2rem] shadow-2xl p-10 border border-white/40 max-w-xl mx-auto mt-6">
            <div className="absolute top-0 right-0 p-8 w-full h-full pointer-events-none">
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 ${callState === 'in_call' ? 'bg-green-400 animate-pulse-slow' : 'bg-brand-300'}`}></div>
                <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-30 ${callState === 'in_call' ? 'bg-emerald-400' : 'bg-accent-300'}`}></div>
            </div>

            {/* Call Status */}
            <div className="text-center mb-10 relative z-10">
                <div className="relative inline-flex items-center justify-center">
                    {callState === 'in_call' && (
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-[30px] opacity-20 animate-pulse-slow"></div>
                    )}
                    <div className={`w-32 h-32 flex items-center justify-center rounded-[2rem] shadow-inner border bg-white/60 backdrop-blur-sm mb-6 ${stateDisplay.animate ? 'animate-bounce' : ''}`}>
                        <div className={stateDisplay.color}>
                            {getIconSvg(stateDisplay.icon)}
                        </div>
                    </div>
                </div>
                
                <h2 className={`text-4xl font-extrabold tracking-tight ${stateDisplay.color} mb-3 drop-shadow-sm`}>
                    {stateDisplay.text}
                </h2>
                
                <div className="h-16">
                    {callState === 'in_call' && (
                        <div className="text-6xl font-mono font-black text-gray-800 tracking-tighter drop-shadow-md animate-fade-in">
                            {formatDuration(callDuration)}
                        </div>
                    )}
                </div>
            </div>

            {/* Audio Status Indicator */}
            {callState === 'in_call' && (
                <div className="flex items-center justify-center gap-3 mb-8 relative z-10 animate-slide-up">
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-[1rem] shadow-sm border ${isRecording ? 'bg-green-50/80 border-green-200 text-green-700' : 'bg-gray-50/80 border-gray-200 text-gray-500'}`}>
                        <div className="relative flex h-4 w-4">
                            {isRecording && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-4 w-4 ${isRecording ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">
                            {isRecording ? 'Uplink Active' : 'Uplink Paused'}
                        </span>
                    </div>
                </div>
            )}

            {/* Call Controls */}
            {callState === 'in_call' && (
                <div className="flex justify-center gap-4 relative z-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <button
                        onClick={onEndCall}
                        className="group flex flex-col items-center gap-2"
                    >
                        <div className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex items-center justify-center transition-all duration-300 transform group-hover:scale-105 active:scale-95 text-white">
                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                            </svg>
                        </div>
                        <span className="font-bold text-red-600 text-sm tracking-wide">End Call</span>
                    </button>
                </div>
            )}

            {/* Role Indicator */}
            <div className="mt-8 text-center relative z-10">
                <span className="inline-flex items-center gap-2 px-6 py-2 bg-white/60 border border-gray-200/50 shadow-sm rounded-full text-xs font-bold text-gray-500 uppercase tracking-widest backdrop-blur-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        {userRole === 'customer' ? (
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        ) : (
                            <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        )}
                    </svg>
                    {userRole}
                </span>
                
                {userRole === 'agent' && customerName && (
                    <div className="mt-4 flex justify-center animate-fade-in text-gray-700">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm font-semibold shadow-sm">
                            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12a5 5 0 110-10 5 5 0 010 10zm0 2c-5.333 0-8 2.667-8 5v2h16v-2c0-2.333-2.667-5-8-5z" /></svg>
                            Talking to: <span className="text-blue-700 capitalize">{customerName.replace(/_/g, ' ')}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CallInterface
