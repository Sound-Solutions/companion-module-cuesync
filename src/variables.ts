import type { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'
import { getCurrentSong, getNextSong, getSlotCue, getTotalPages, type ModuleState } from './state'

const MAX_SLOTS = 32

export function getVariableDefinitions(): CompanionVariableDefinition[] {
	const vars: CompanionVariableDefinition[] = [
		{ variableId: 'current_song_name', name: 'Current Song Name' },
		{ variableId: 'next_song_name', name: 'Next Song Name' },
		{ variableId: 'connected', name: 'Connection Status' },
	]

	for (let i = 1; i <= MAX_SLOTS; i++) {
		vars.push({ variableId: `slot_${i}_name`, name: `Cue Slot ${i} Name` })
	}

	return vars
}

export function getAllVariableValues(state: ModuleState, connected: boolean): CompanionVariableValues {
	const values: CompanionVariableValues = {}

	// Connection status
	values['connected'] = connected ? 'true' : 'false'

	// Current song name with page indicator
	const song = getCurrentSong(state)
	if (song) {
		const totalPages = getTotalPages(state)
		if (totalPages > 1) {
			values['current_song_name'] = `${song.name} (${state.currentPage + 1}/${totalPages})`
		} else {
			values['current_song_name'] = song.name
		}
	} else {
		values['current_song_name'] = ''
	}

	// Next song name
	const next = getNextSong(state)
	values['next_song_name'] = next?.name ?? ''

	// Slot names
	for (let i = 1; i <= MAX_SLOTS; i++) {
		const cue = getSlotCue(state, i)
		values[`slot_${i}_name`] = cue?.name ?? ''
	}

	return values
}
