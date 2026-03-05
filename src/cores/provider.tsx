import { type ReactNode, createContext } from 'react'
import { ToolGroupManager, PanTool, ZoomTool, StackScrollTool } from '@cornerstonejs/tools'

const toolGroup =  ToolGroupManager.getToolGroup('mainToolGroup') || ToolGroupManager.createToolGroup('mainToolGroup')
if (toolGroup) {
    toolGroup.addTool(PanTool.toolName)
    toolGroup.addTool(ZoomTool.toolName)
    toolGroup.addTool(StackScrollTool.toolName)
    toolGroup.setToolActive(PanTool.toolName, {
        bindings: [{ mouseButton: 1 }],
    })
}

interface ContextType {
    toolGroup: any
}

export const CornerstoneContext = createContext<ContextType | null>(null)

interface Props {
    children: ReactNode
}

export const CornerstoneProvider = ({ children }: Props) => {
    return (
        <CornerstoneContext.Provider value={{ toolGroup }}>
            {children}
        </CornerstoneContext.Provider>
    )
}
