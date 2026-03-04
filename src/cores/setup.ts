let initializedCornerstone: Promise<any> | null = null

export const setupCornerstone = async () => {
    if (initializedCornerstone) return initializedCornerstone

    initializedCornerstone = (async () => {
        const cornerstone = await import('@cornerstonejs/core')
        const cornerstoneTools = await import('@cornerstonejs/tools')
        const dicomImageLoader = await import('@cornerstonejs/dicom-image-loader')

        await cornerstone.init()
        await cornerstoneTools.init()
        dicomImageLoader.init()

        return { cornerstone, cornerstoneTools, dicomImageLoader }
    })()

    return initializedCornerstone
}
