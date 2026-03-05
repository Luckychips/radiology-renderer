import type { ReactNode } from 'react'

interface BaseIconProps {
    iconColor?: string
    iconSize?: string
    children: ReactNode
}

const BaseIcon = ({ iconColor = 'white', iconSize = 'size-6', children }: BaseIconProps) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5"
             stroke="currentColor"
             className={iconSize}
             style={{ color: iconColor }}>
            {children}
        </svg>
    )
}

export default BaseIcon
