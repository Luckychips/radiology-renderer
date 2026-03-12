export interface ViewerStackStoreProps {
    axialCurrentImageStackIndex: number
    setAxialCurrentImageStackIndex: (v: number) => void
    coronalCurrentImageStackIndex: number
    setCoronalCurrentImageStackIndex: (v: number) => void
    sagittalCurrentImageStackIndex: number
    setSagittalCurrentImageStackIndex: (v: number) => void
}
