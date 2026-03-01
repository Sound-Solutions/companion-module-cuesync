import { combineRgb, type CompanionFeedbackDefinitions } from '@companion-module/base'
import type { CueSyncInstance } from './index'
import { getSlotCue } from './state'

// Action type colors (matching CueSync web remote)
const ACTION_COLORS: Record<string, number> = {
	osc: combineRgb(10, 132, 255),       // Blue #0A84FF
	midi: combineRgb(191, 90, 242),      // Purple #BF5AF2
	rcp: combineRgb(255, 159, 10),       // Orange #FF9F0A
	applescript: combineRgb(48, 209, 88), // Green #30D158
	enable: combineRgb(48, 209, 88),     // Green #30D158
	group: combineRgb(71, 85, 105),      // Slate #475569
	unknown: combineRgb(75, 85, 99),     // Gray #4B5563
}

// Dimmed versions of action type colors (for fired state)
const ACTION_COLORS_DIMMED: Record<string, number> = {
	osc: combineRgb(3, 40, 77),
	midi: combineRgb(57, 27, 73),
	rcp: combineRgb(77, 48, 3),
	applescript: combineRgb(14, 63, 26),
	enable: combineRgb(14, 63, 26),
	group: combineRgb(21, 26, 32),
	unknown: combineRgb(23, 26, 30),
}

function getActionColor(actionType: string, dimmed = false): number {
	const map = dimmed ? ACTION_COLORS_DIMMED : ACTION_COLORS
	return map[actionType] ?? map['unknown']
}

export function getFeedbacks(instance: CueSyncInstance): CompanionFeedbackDefinitions {
	return {
		cue_slot_state: {
			type: 'boolean',
			name: 'Cue Slot State',
			description: 'Changes button appearance based on the cue state in the given slot',
			defaultStyle: {
				bgcolor: combineRgb(10, 132, 255),
				color: combineRgb(255, 255, 255),
			},
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
			callback: (feedback) => {
				const slot = feedback.options.slot as number
				const cue = getSlotCue(instance.state, slot)
				return cue !== null
			},
			subscribe: () => {},
			unsubscribe: () => {},
		},

		cue_slot_color: {
			type: 'advanced',
			name: 'Cue Slot Color',
			description: 'Sets button color based on cue action type and state',
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
			callback: (feedback) => {
				const slot = feedback.options.slot as number
				const state = instance.state
				const cue = getSlotCue(state, slot)

				if (!cue) {
					// Empty slot
					return { bgcolor: combineRgb(26, 26, 26), color: combineRgb(80, 80, 80) }
				}

				if (!cue.isEnabled) {
					// Disabled
					return { bgcolor: combineRgb(51, 51, 51), color: combineRgb(102, 102, 102) }
				}

				// Check firing state (temporary green flash)
				if (state.firingCues.has(cue.id)) {
					return { bgcolor: combineRgb(0, 200, 0), color: combineRgb(255, 255, 255) }
				}

				// Check cue scheduler state
				const cueState = state.cueStates[cue.id]

				switch (cueState) {
					case 'armed':
						return {
							bgcolor: combineRgb(255, 204, 0),
							color: combineRgb(0, 0, 0),
						}
					case 'fired':
						return {
							bgcolor: getActionColor(cue.actionType, true),
							color: combineRgb(150, 150, 150),
						}
					case 'disabled':
						return { bgcolor: combineRgb(51, 51, 51), color: combineRgb(102, 102, 102) }
					default:
						// pending, waiting, or normal
						return {
							bgcolor: getActionColor(cue.actionType),
							color: combineRgb(255, 255, 255),
						}
				}
			},
		},

		module_connected: {
			type: 'boolean',
			name: 'Module Connected',
			description: 'True when connected to CueSync',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				return instance.connection.isConnected
			},
		},

		show_cues_active: {
			type: 'boolean',
			name: 'Show Cues Active',
			description: 'True when viewing show-level cues instead of song cues',
			defaultStyle: {
				bgcolor: combineRgb(48, 209, 88),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				return instance.state.viewMode === 'showCues'
			},
		},
	}
}
