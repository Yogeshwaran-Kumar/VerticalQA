interface IncomingCall {
    roomId: string
    customerName: string
    waitTime: number
}

interface IncomingCallsPanelProps {
    incomingCalls: IncomingCall[]
    onAcceptCall: (roomId: string) => void
    onRejectCall: (roomId: string) => void
}

function IncomingCallsPanel({ incomingCalls, onAcceptCall, onRejectCall }: IncomingCallsPanelProps) {
    const formatWaitTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="backdrop-blur-xl bg-white/80 border border-gray-200/50 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Incoming Calls</h2>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">{incomingCalls.length} Waiting</span>
                </div>
            </div>

            <div className="space-y-3">
                {incomingCalls.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-gray-500 font-medium">No incoming calls</p>
                        <p className="text-gray-400 text-sm mt-1">Waiting for customers to call...</p>
                    </div>
                ) : (
                    incomingCalls.map((call) => (
                        <div
                            key={call.roomId}
                            className="backdrop-blur-md bg-white/60 border border-gray-200/50 rounded-lg p-4 hover:bg-white/80 transition-all"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800">{call.customerName}</div>
                                        <div className="text-xs text-gray-500">
                                            Waiting: {formatWaitTime(call.waitTime)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => onAcceptCall(call.roomId)}
                                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    Accept
                                </button>
                                <button
                                    onClick={() => onRejectCall(call.roomId)}
                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-sm transition-colors border border-red-200"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default IncomingCallsPanel
