import React from 'react'

interface SentimentBadgeProps {
    sentiment: 'positive' | 'neutral' | 'negative' | undefined
}

const colorMap: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    neutral: 'bg-yellow-100 text-yellow-700',
    negative: 'bg-red-100 text-red-700',
}

export const SentimentBadge: React.FC<SentimentBadgeProps> = ({ sentiment }) => {
    const classes = sentiment ? colorMap[sentiment] : 'bg-gray-100 text-gray-500'
    const label = sentiment ?? 'unknown'

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}>
            {label}
        </span>
    )
}

export default SentimentBadge
