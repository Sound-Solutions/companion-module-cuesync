import type { CompanionActionDefinitions } from '@companion-module/base'
import type { CueSyncInstance } from './index'
import { advancePage, advanceSong, getSlotCue, remapSlots } from './state'

// Track hold timers per slot for press-and-hold toggle
const holdTimers: Map<number, ReturnType<typeof setTimeout>> = new Map()
const holdFired: Set<number> = new Set()

export function getActions(instance: CueSyncInstance): CompanionActionDefinitions {
	return {
		cue_slot_down: {
			name: 'Cue Slot Down',
			description: 'Press handler: starts hold timer for toggle, fires cue if released before 1s',
			options: [
				{
					type: 'number',
					id: 'slot',
					label: 'Slot Number',
					default: 1,
					min: 1,
					max: 32,
				},
			],
			callback: (action) => {
				const slot = action.options.slot as number
				// Clear any existing timer
				const existing = holdTimers.get(slot)
				if (existing) clearTimeout(existing)
				holdFired.delete(slot)

				// Start 1s timer for toggle
				holdTimers.set(slot, setTimeout(() => {
					holdTimers.delete(slot)
					holdFired.add(slot)
					const cue = getSlotCue(instance.state, slot)
					if (cue) {
						instance.connection.send({ type: 'toggleCue', cueId: cue.id })
					}
				}, 1000))
			},
		},

		cue_slot_up: {
			name: 'Cue Slot Up',
			description: 'Release handler: fires cue if hold timer has not elapsed',
			options: [
				{
					type: 'number',
					id: 'slot',
					label: 'Slot Number',
					default: 1,
					min: 1,
					max: 32,
				},
			],
			callback: (action) => {
				const slot = action.options.slot as number
				const timer = holdTimers.get(slot)
				if (timer) {
					// Released before 1s — cancel toggle, fire cue instead
					clearTimeout(timer)
					holdTimers.delete(slot)
					const cue = getSlotCue(instance.state, slot)
					if (cue) {
						instance.connection.send({ type: 'fireCue', cueId: cue.id })
					}
				}
				// If holdFired has this slot, toggle already happened — do nothing
				holdFired.delete(slot)
			},
		},

		fire_cue_slot: {
			name: 'Fire Cue Slot',
			description: 'Fire the cue mapped to the given slot number',
			options: [
				{
					type: 'number',
					id: 'slot',
					label: 'Slot Number',
					default: 1,
					min: 1,
					max: 32,
				},
			],
			callback: (action) => {
				const slot = action.options.slot as number
				const cue = getSlotCue(instance.state, slot)
				if (cue) {
					instance.connection.send({ type: 'fireCue', cueId: cue.id })
				}
			},
		},

		toggle_cue_slot: {
			name: 'Toggle Cue Slot',
			description: 'Toggle enable/disable for the cue mapped to the given slot number',
			options: [
				{
					type: 'number',
					id: 'slot',
					label: 'Slot Number',
					default: 1,
					min: 1,
					max: 32,
				},
			],
			callback: (action) => {
				const slot = action.options.slot as number
				const cue = getSlotCue(instance.state, slot)
				if (cue) {
					instance.connection.send({ type: 'toggleCue', cueId: cue.id })
				}
			},
		},

		next_page: {
			name: 'Next Page',
			description: 'Advance to the next page of cues (wraps at end)',
			options: [],
			callback: () => {
				advancePage(instance.state)
				instance.refreshAll()
			},
		},

		next_song: {
			name: 'Next Song',
			description: 'Advance to the next song in the setlist (wraps at end)',
			options: [],
			callback: () => {
				const newSongId = advanceSong(instance.state)
				if (newSongId) {
					// Updates local view only — CueSync's timecode/manual selection drives the actual song.
					// CueSync finds cues by UUID across all songs, so firing from a previewed song works.
					// The view resyncs when CueSync broadcasts the next songChanged.
					instance.refreshAll()
				}
			},
		},

		toggle_show_cues: {
			name: 'Toggle Show Cues',
			description: 'Switch between song cues and show-level cues',
			options: [],
			callback: () => {
				const state = instance.state
				state.viewMode = state.viewMode === 'showCues' ? 'song' : 'showCues'
				state.currentPage = 0
				remapSlots(state)
				instance.refreshAll()
			},
		},
	}
}
