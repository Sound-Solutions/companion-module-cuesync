export interface CueData {
	id: string
	name: string
	actionType: string
	isEnabled: boolean
}

export interface SongData {
	id: string
	name: string
	isEnabled: boolean
	cues: CueData[]
}

export interface ShowData {
	name: string
	currentSetlist: {
		id: string
		name: string
		songs: SongData[]
	}
	showCues: CueData[]
}

export interface SlotMapping {
	cue: CueData
	cueIndex: number
}

export type CueState = 'pending' | 'armed' | 'waiting' | 'fired' | 'disabled'

export interface ModuleState {
	show: ShowData | null
	currentSongId: string | null
	cueStates: Record<string, CueState>
	firingCues: Set<string>
	currentPage: number
	viewMode: 'song' | 'showCues'
	slotsPerPage: number
	slotMap: Map<number, SlotMapping>
}

export function createInitialState(): ModuleState {
	return {
		show: null,
		currentSongId: null,
		cueStates: {},
		firingCues: new Set(),
		currentPage: 0,
		viewMode: 'song',
		slotsPerPage: 32,
		slotMap: new Map(),
	}
}

export function getCurrentSong(state: ModuleState): SongData | null {
	if (!state.show || !state.currentSongId) return null
	return state.show.currentSetlist.songs.find((s) => s.id === state.currentSongId) ?? null
}

export function getActiveCues(state: ModuleState): CueData[] {
	if (!state.show) return []
	if (state.viewMode === 'showCues') return state.show.showCues
	const song = getCurrentSong(state)
	return song?.cues ?? []
}

export function remapSlots(state: ModuleState): void {
	state.slotMap.clear()
	const cues = getActiveCues(state)
	const start = state.currentPage * state.slotsPerPage
	const pageCues = cues.slice(start, start + state.slotsPerPage)

	for (let i = 0; i < pageCues.length; i++) {
		state.slotMap.set(i + 1, {
			cue: pageCues[i],
			cueIndex: start + i,
		})
	}
}

export function getSlotCue(state: ModuleState, slotNum: number): CueData | null {
	return state.slotMap.get(slotNum)?.cue ?? null
}

export function getTotalPages(state: ModuleState): number {
	const cues = getActiveCues(state)
	if (cues.length === 0 || state.slotsPerPage === 0) return 1
	return Math.ceil(cues.length / state.slotsPerPage)
}

export function advancePage(state: ModuleState): void {
	const total = getTotalPages(state)
	if (total <= 1) return
	state.currentPage = (state.currentPage + 1) % total
	remapSlots(state)
}

export function getNextSong(state: ModuleState): SongData | null {
	if (!state.show || !state.currentSongId) return null
	const songs = state.show.currentSetlist.songs
	const idx = songs.findIndex((s) => s.id === state.currentSongId)
	if (idx === -1 || songs.length === 0) return null
	return songs[(idx + 1) % songs.length]
}

export function advanceSong(state: ModuleState): string | null {
	const next = getNextSong(state)
	if (!next) return null
	state.currentSongId = next.id
	state.currentPage = 0
	state.viewMode = 'song'
	remapSlots(state)
	return next.id
}

export function shouldAutoPageFlip(state: ModuleState, firedCueId: string): boolean {
	if (state.slotMap.size === 0) return false
	if (state.currentPage >= getTotalPages(state) - 1) return false

	// Find the last enabled cue on the page
	const slots = Array.from(state.slotMap.entries()).sort((a, b) => b[0] - a[0])
	for (const [, mapping] of slots) {
		if (mapping.cue.isEnabled) {
			return mapping.cue.id === firedCueId
		}
	}
	return false
}
