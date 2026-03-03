import { useEffect, useRef } from 'react'

export default function Viewer() {
    const elementRef = useRef<HTMLDivElement>(null);

    async function init() {
        const cornerstone = await import('@cornerstonejs/core')
        const cornerstoneTools = await import('@cornerstonejs/tools')
        const dicomImageLoader = await import('@cornerstonejs/dicom-image-loader')
        const { RenderingEngine, Enums, init: coreInit } = cornerstone;

        const {
            init: toolsInit,
            addTool,
            PanTool,
            ZoomTool,
            StackScrollTool,
            ToolGroupManager,
        } = cornerstoneTools;

        await coreInit();
        await toolsInit();
        dicomImageLoader.init();

        const renderingEngineId = "engine";
        const viewportId = "viewport";

        const renderingEngine = new RenderingEngine(
            renderingEngineId
        );

        renderingEngine.setViewports([
            {
                viewportId,
                type: Enums.ViewportType.STACK,
                element: elementRef.current!,
            },
        ]);

        addTool(PanTool)
        addTool(ZoomTool)
        addTool(StackScrollTool)

        const toolGroup = ToolGroupManager.createToolGroup('toolGroup')
        toolGroup?.addTool(PanTool.toolName)
        toolGroup?.addTool(ZoomTool.toolName)
        toolGroup?.addTool(StackScrollTool.toolName)
        toolGroup?.setToolActive(StackScrollTool.toolName)
        toolGroup?.addViewport(viewportId, renderingEngineId)

        const input = document.getElementById('fileInput') as HTMLInputElement
        input.onchange = async (e: any) => {
            const files = e.target.files;
            if (!files) return;

            const imageIds: string[] = [];

            for (let i = 0; i < files.length; i++) {
                const imageId = dicomImageLoader.wadouri.fileManager.add(files[i])
                imageIds.push(imageId)
            }

            const viewport: any = renderingEngine.getViewport(viewportId)
            await viewport.setStack(imageIds)
            viewport.render()
        }
    }

    useEffect(() => {
        (async () => {
            await init()
        })();
    }, []);

    return (
        <section>
            <input type="file" id="fileInput" multiple accept=".dcm" />
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
