export const data = {
    orientation: {
        row: [1, 0, 0],
        col: [0, 1, 0],
        normal: [0, 0, 1],
    },
    appearance: {
        color: {
            red: [1, 0, 0],
            green: [0, 1, 0],
            blue: [0, 0, 1],
        }
    }
}

export const getCenterFromBounds = (bounds: number[]) => {
    return [
        (bounds[0] + bounds[1]) / 2,
        (bounds[2] + bounds[3]) / 2,
        (bounds[4] + bounds[5]) / 2
    ]
}

/**
 *
 * @param coordinate  - 3d volume center position (x, y, z)
 * @param vector1     - direction vector (axial,coronal:row, sagittal:col)
 * @param vector2     - direction vector (axial:col, coronal,sagittal:normal)
 * @param horizontal  - volume size (axial,coronal:width, sagittal:height)
 * @param vertical    - volume size (axial:height, coronal,sagittal:depth)
 */
export const getCalculatedOrigin = (
    coordinate: number[],
    vector1: number[],
    vector2: number[],
    horizontal: number,
    vertical: number,
) => {
    return [
        coordinate[0] - vector1[0] * horizontal / 2 - vector2[0] * vertical / 2,
        coordinate[1] - vector1[1] * horizontal / 2 - vector2[1] * vertical / 2,
        coordinate[2] - vector1[2] * horizontal / 2 - vector2[2] * vertical / 2,
    ]
}

export const getCalculatedPoint1 = (
    coordinate: number[],
    vector1: number[],
    vector2: number[],
    horizontal: number,
    vertical: number,
) => {
    return [
        coordinate[0] + vector1[0] * horizontal / 2 - vector2[0] * vertical / 2,
        coordinate[1] + vector1[1] * horizontal / 2 - vector2[1] * vertical / 2,
        coordinate[2] + vector1[2] * horizontal / 2 - vector2[2] * vertical / 2,
    ]
}

export const getCalculatedPoint2 = (
    coordinate: number[],
    vector1: number[],
    vector2: number[],
    horizontal: number,
    vertical: number,
) => {
    return [
        coordinate[0] - vector1[0] * horizontal / 2 + vector2[0] * vertical / 2,
        coordinate[1] - vector1[1] * horizontal / 2 + vector2[1] * vertical / 2,
        coordinate[2] - vector1[2] * horizontal / 2 + vector2[2] * vertical / 2,
    ]
}
