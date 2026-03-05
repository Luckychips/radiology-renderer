import { useEffect, useRef } from 'react'

interface Props {
    cornerstone: any
    cornerstoneTools: any
    imageIds: string[]
}

export default function Axial({
    cornerstone,
    cornerstoneTools,
    imageIds,
}: Props) {
    const elementRef = useRef<HTMLDivElement>(null)
    const renderingEngineRef = useRef<any>(null)
    const toolGroupRef = useRef<any>(null)
    const viewportId = 'viewport-axial'

    useEffect(() => {
        if (cornerstone && cornerstoneTools) {
            const { RenderingEngine, Enums } = cornerstone
            const { ToolGroupManager, PanTool, ZoomTool, StackScrollTool } = cornerstoneTools
            const renderingEngine = new RenderingEngine('engine-axial')
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
