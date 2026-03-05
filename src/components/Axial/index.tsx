import { useEffect, useRef, useState } from 'react'
import { RenderingEngine } from '@cornerstonejs/core'
import { Types } from '@cornerstonejs/tools'
import { BaseIcon } from '@/components'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: RenderingEngine
    toolGroup: Types.IToolGroup
    imageIds: string[]
}

export default function Axial({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    toolGroup,
    imageIds,
}: Props) {
    const elementRef = useRef<HTMLDivElement>(null)
    const viewportId = 'viewport-axial'
    const [currentImageStackIndex, setCurrentImageStackIndex] = useState(0)
    const [totalImageStackCount, setTotalImageStackCount] = useState(0)

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { Enums } = cornerstone
            renderingEngine.enableElement({
                viewportId,
                type: Enums.ViewportType.STACK,
                element: elementRef.current!,
            })
            renderingEngine.resize(true)
            toolGroup.addViewport(viewportId, renderingEngine.id)
        }

        return () => {
            toolGroup.removeViewports(viewportId, renderingEngine.id)
        }
    }, [cornerstone, cornerstoneTools]);

    useEffect(() => {
        (async () => {
            if (imageIds.length && renderingEngine) {
                const viewport: any = renderingEngine.getViewport(viewportId)
                await viewport.setStack(imageIds)
                setCurrentImageStackIndex(viewport.getCurrentImageIdIndex())
                setTotalImageStackCount(viewport.getImageIds().length)
                viewport.resetCamera(true)
                viewport.render()
            }
        })()
    }, [imageIds, renderingEngine])

    useEffect(() => {
        if (renderingEngine) {
            const viewport: any = renderingEngine.getViewport(viewportId)
            viewport.setImageIdIndex(currentImageStackIndex);
        }
    }, [currentImageStackIndex, renderingEngine]);

    return (
        <section className="relative w-[50vw] h-full">
            {totalImageStackCount > 0 && <span className="absolute z-1 left-[10px] top-[10px] text-white">{currentImageStackIndex + 1} / {totalImageStackCount}</span>}
            <div className="flex absolute z-1 right-[5px] bottom-0">
                <figure
                    className="p-2 cursor-pointer rounded-lg mr-1"
                    style={{ backgroundColor: "white" }}
                    onClick={() => {
                        if (currentImageStackIndex <= 0) return
                        const index = currentImageStackIndex - 1
                        const max = Math.max(index, totalImageStackCount - 1)
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
            <div
                ref={elementRef}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'block',
                    padding: 0,
                    textAlign: 'left',
                }}
            />
        </section>
    )
}
