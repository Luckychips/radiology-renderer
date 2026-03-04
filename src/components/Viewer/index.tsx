import { type ChangeEvent, useEffect, useRef } from 'react'
import { setupCornerstone } from '@/cores/setup'

export default function Viewer() {
    const elementRef = useRef<HTMLDivElement>(null)
    const renderingEngineRef = useRef<any>(null)
    const dicomLoaderRef = useRef<any>(null)
    const toolGroupRef = useRef<any>(null)
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
        viewport.resetCamera(true)
        viewport.render()

        // console.log(viewport.getCamera().focalPoint)
        // const id = viewport.getImageData()
        //
        // console.log('origin:', id.origin)
        // console.log('dimensions:', id.dimensions)
        // console.log('spacing:', id.spacing)
    }

    useEffect(() => {
        (async () => {
            const { cornerstone, cornerstoneTools, dicomImageLoader } = await setupCornerstone()
            const { RenderingEngine, Enums } = cornerstone
            const { ToolGroupManager, PanTool, ZoomTool, StackScrollTool } = cornerstoneTools
            dicomLoaderRef.current = dicomImageLoader
            const renderingEngine = new RenderingEngine('engine')
            renderingEngineRef.current = renderingEngine
            renderingEngine.enableElement({
                viewportId,
                type: Enums.ViewportType.STACK,
                element: elementRef.current!,
            })
            renderingEngine.resize(true)

            const toolGroupId = 'tg'
            let toolGroup = ToolGroupManager.getToolGroup(toolGroupId)
            if (!toolGroup) {
                toolGroup = ToolGroupManager.createToolGroup(toolGroupId)
                toolGroup.addTool(PanTool.toolName)
                toolGroup.addTool(ZoomTool.toolName)
                toolGroup.addTool(StackScrollTool.toolName)
                toolGroup.setToolActive(PanTool.toolName, {
                    bindings: [{ mouseButton: 1 }],
                })
            }

            if (!toolGroup) {
                return
            }

            toolGroupRef.current = toolGroup
            toolGroup.addViewport(viewportId, renderingEngine.id)
        })()

        return () => {
            toolGroupRef.current?.destroy()
            renderingEngineRef.current?.destroy()
        }
    }, [])

    return (
        <section>
            <input type="file" id="fileInput" multiple accept=".dcm" onChange={onChange} />
            <div
                ref={elementRef}
                style={{
                    width: '512px',
                    height: '512px',
                    backgroundColor: 'black',
                    marginTop: '15px',
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
