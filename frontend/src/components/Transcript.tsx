

interface Message {
    role: 'customer' | 'agent'
    text: string
    timestamp: string
}

interface TranscriptProps {
    messages: Message[]
}

function Transcript({ messages }: TranscriptProps) {
    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    return (
        <div className="bg-white rounded-lg shadow-sm h-[600px] border border-gray-100 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 tracking-tight">Live Transcript</h2>
                    <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                        {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 transcript-container flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full my-auto">
                        <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-gray-400 font-medium">No messages yet</p>
                            <p className="text-gray-300 text-xs mt-1">
                                Conversation will stream here
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-4 w-full">
                        {/* Render reversed array so newest message is at DOM index 0 (top) */}
                        {[...messages].reverse().map((message, index) => (
                            <div
                                key={index}
                                className={`w-full max-w-2xl rounded-xl px-6 py-4 shadow-sm border flex flex-col gap-2 ${message.role === 'customer'
                                    ? 'bg-blue-50/50 border-blue-100/60'
                                    : 'bg-white border-gray-200/60'
                                    }`}
                            >
                                <div className="flex items-center justify-between border-b pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${message.role === 'customer' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                        <span className={`text-xs font-bold uppercase tracking-wider ${message.role === 'customer' ? 'text-blue-800' : 'text-gray-700'}`}>
                                            {message.role === 'customer' ? 'Customer' : 'Agent'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-mono tracking-wider text-gray-400">
                                        {formatTimestamp(message.timestamp)}
                                    </span>
                                </div>
                                <p className={`text-[15px] leading-relaxed font-medium ${message.role === 'customer' ? 'text-gray-800' : 'text-gray-700'}`}>
                                    {message.text}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Transcript
