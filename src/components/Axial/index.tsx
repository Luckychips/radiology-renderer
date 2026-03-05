import { useEffect, useRef, useContext } from 'react'
import { CornerstoneContext } from '@/cores/provider'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: any
    imageIds: string[]
}

export default function Axial({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    imageIds,
}: Props) {
    const { toolGroup } = useContext(CornerstoneContext)!
    const elementRef = useRef<HTMLDivElement>(null)
    const renderingEngineRef = useRef<any>(null)
    const toolGroupRef = useRef<any>(null)
    const viewportId = 'viewport-axial'

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { Enums } = cornerstone
            renderingEngineRef.current = renderingEngine
            renderingEngine.enableElement({
                viewportId,
                type: Enums.ViewportType.STACK,
                element: elementRef.current!,
            })
            renderingEngine.resize(true)
            toolGroupRef.current = toolGroup
            toolGroup.addViewport(viewportId, renderingEngine.id)
        }

        return () => {
            toolGroupRef.current?.destroy()
            renderingEngineRef.current?.destroy()
        }
    }, [cornerstone, cornerstoneTools]);

    useEffect(() => {
        (async () => {
            if (imageIds.length) {
                const viewport: any = renderingEngineRef.current.getViewport(viewportId)
                await viewport.setStack(imageIds)
                viewport.resetCamera(true)
                viewport.render()
            }
        })()
    }, [imageIds])

    return (
        <section className="w-[50vw] h-full">
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
