import { BaseIcon } from '@/components'

interface Props {
    currentImageStackIndex: number
    totalImageStackCount: number
    setCurrentImageStackIndex: (v: number) => void
}

export default function ImageStackPager({
    currentImageStackIndex,
    totalImageStackCount,
    setCurrentImageStackIndex,
}: Props) {
    return (
        <>
            {totalImageStackCount > 0 && <span className="absolute z-1 left-[10px] top-[10px] text-white">{currentImageStackIndex + 1} / {totalImageStackCount}</span>}
            <div className="flex absolute z-1 right-[5px] bottom-[5px]">
                <figure
                    className="p-2 cursor-pointer rounded-lg mr-1"
                    style={{ backgroundColor: "white" }}
                    onClick={() => {
                        if (currentImageStackIndex <= 0) return
                        const index = currentImageStackIndex - 1
                        const max = Math.min(index, totalImageStackCount - 1)
                        setCurrentImageStackIndex(max)
                    }}>
                    <BaseIcon iconColor="black">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5"/>
                    </BaseIcon>
                </figure>
                <figure
                    className="p-2 cursor-pointer rounded-lg"
                    style={{backgroundColor: "white"}}
                    onClick={() => {
                        if (currentImageStackIndex >= totalImageStackCount - 1) return
                        const index = currentImageStackIndex + 1
                        const min = Math.min(index, totalImageStackCount - 1)
                        setCurrentImageStackIndex(min)
                    }}>
                    <BaseIcon iconColor="black">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/>
                    </BaseIcon>
                </figure>
            </div>
        </>
    )
}
