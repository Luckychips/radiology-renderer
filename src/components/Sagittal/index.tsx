import { useEffect, useRef, useContext } from 'react'
import { CornerstoneContext } from '@/cores/provider'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    renderingEngine: any
    imageIds: string[]
}

export default function Sagittal({
    cornerstone,
    cornerstoneTools,
    renderingEngine,
    imageIds,
}: Props) {
    const { toolGroup } = useContext(CornerstoneContext)!
    const elementRef = useRef<HTMLDivElement>(null)
    const renderingEngineRef = useRef<any>(null)
    const toolGroupRef = useRef<any>(null)
    const viewportId = 'viewport-sagittal'

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { Enums } = cornerstone
            renderingEngineRef.current = renderingEngine
            renderingEngine.enableElement({
                viewportId,
                type: Enums.ViewportType.ORTHOGRAPHIC,
                element: elementRef.current!,
            })
            setTimeout(() => renderingEngine.resize(true), 0)
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
            if (cornerstone && imageIds.length) {
                const { imageLoader, volumeLoader, Enums } = cornerstone
                await Promise.all(imageIds.map(id => imageLoader.loadImage(id)))
                const volumeId = 'sagittalVolume'
                const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds })
                await volume.load()
                const viewport = renderingEngineRef.current.getViewport(viewportId)
                await viewport.setVolumes([{ volumeId }])
                viewport.setOrientation(Enums.OrientationAxis.SAGITTAL)
                viewport.resetCamera(true)
                viewport.render()
            }
        })()
    }, [cornerstone, imageIds])

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
