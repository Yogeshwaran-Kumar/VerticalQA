
interface SentimentChartProps {
    positive: number
    neutral: number
    negative: number
}

export function SentimentChart({ positive, neutral, negative }: SentimentChartProps) {
    const total = positive + neutral + negative

    if (total === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Sentiment Distribution</h3>
                <div className="flex items-center justify-center h-12 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                    <span className="text-sm text-gray-400">No active calls</span>
                </div>
                <div className="flex gap-4 mt-3">
                    {[
                        { label: 'Positive', color: 'bg-green-500', count: 0 },
                        { label: 'Neutral', color: 'bg-amber-400', count: 0 },
                        { label: 'Negative', color: 'bg-red-500', count: 0 },
                    ].map(({ label, color, count }) => (
                        <div key={label} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                            <span className="text-xs text-gray-500">{label}: {count}</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const positivePercent = (positive / total) * 100
    const neutralPercent = (neutral / total) * 100
    const negativePercent = (negative / total) * 100

    const segments = [
        { label: 'Positive', count: positive, percent: positivePercent, barColor: 'bg-green-500', dotColor: 'bg-green-500' },
        { label: 'Neutral', count: neutral, percent: neutralPercent, barColor: 'bg-amber-400', dotColor: 'bg-amber-400' },
        { label: 'Negative', count: negative, percent: negativePercent, barColor: 'bg-red-500', dotColor: 'bg-red-500' },
    ]

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Sentiment Distribution</h3>

            {/* Stacked bar */}
            <div className="flex h-8 rounded-lg overflow-hidden w-full">
                {segments.map(({ label, percent, barColor, count }) =>
                    count > 0 ? (
                        <div
                            key={label}
                            className={`${barColor} flex items-center justify-center transition-all duration-300`}
                            style={{ width: `${percent}%` }}
                            title={`${label}: ${count}`}
                        >
                            {percent >= 15 && (
                                <span className="text-white text-xs font-semibold">{count}</span>
                            )}
                        </div>
                    ) : null
                )}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 flex-wrap">
                {segments.map(({ label, dotColor, count }) => (
                    <div key={label} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                        <span className="text-xs text-gray-600">
                            <span className="font-medium">{label}</span>: {count}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default SentimentChart
