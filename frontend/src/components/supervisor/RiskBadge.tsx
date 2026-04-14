import React from 'react'

interface RiskBadgeProps {
    risk: 'low' | 'medium' | 'high' | undefined
}

const colorMap: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-green-100 text-green-700',
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk }) => {
    const classes = risk ? colorMap[risk] : 'bg-gray-100 text-gray-500'
    const label = risk ?? 'unknown'

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${classes}`}>
            {label}
        </span>
    )
}

export default RiskBadge
