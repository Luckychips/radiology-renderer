import { create } from 'zustand'
import type { ViewerStackStoreProps } from '@/types/store'

export const useViewerStore = create<ViewerStackStoreProps>((set) => ({
    axialCurrentImageStackIndex: 0,
    setAxialCurrentImageStackIndex: (v: number) => set({ axialCurrentImageStackIndex: v }),
    coronalCurrentImageStackIndex: 0,
    setCoronalCurrentImageStackIndex: (v: number) => set({ coronalCurrentImageStackIndex: v }),
    sagittalCurrentImageStackIndex: 0,
    setSagittalCurrentImageStackIndex: (v: number) => set({ sagittalCurrentImageStackIndex: v }),
}))
