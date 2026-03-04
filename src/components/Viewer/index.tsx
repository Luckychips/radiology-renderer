import { type ChangeEvent, useEffect, useRef } from 'react'
import { setupCornerstone } from '@/cores/setup'

export default function Viewer() {
    const elementRef = useRef<HTMLDivElement>(null)
    const renderingEngineRef = useRef<any>(null)
    const dicomLoaderRef = useRef<any>(null)
    const viewportId = 'viewport'

    const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const imageIds: string[] = []
        for (let i = 0; i < files.length; i++) {
            const imageId = dicomLoaderRef.current.wadouri.fileManager.add(files[i])
            imageIds.push(imageId)
        }

        const viewport: any = renderingEngineRef.current.getViewport(viewportId)
        await viewport.setStack(imageIds)
        viewport.render()
    }

    useEffect(() => {
        (async () => {
            const { cornerstone, dicomImageLoader } = await setupCornerstone()
            const { RenderingEngine, Enums } = cornerstone
            dicomLoaderRef.current = dicomImageLoader
            const renderingEngine = new RenderingEngine('engine')
            renderingEngineRef.current = renderingEngine
            renderingEngine.setViewports([
                {
                    viewportId,
                    type: Enums.ViewportType.STACK,
                    element: elementRef.current!,
                },
            ])
        })()

        return () => {
            renderingEngineRef.current?.destroy()
        }
    }, [])

    return (
        <section>
            <input type="file" id="fileInput" multiple accept=".dcm" onChange={onChange} />
            <div
                ref={elementRef}
                style={{
                    width: "512px",
                    height: "512px",
                    backgroundColor: "black",
                    marginTop: "10px",
                }}
            />
        </section>
    )
}
