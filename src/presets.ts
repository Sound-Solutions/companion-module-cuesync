import { combineRgb, type CompanionPresetDefinitions } from '@companion-module/base'

const MAX_SLOTS = 32

export function getPresets(): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitions = {}

	// Current Song button
	presets['current_song'] = {
		type: 'button',
		category: 'CueSync',
		name: 'Current Song',
		style: {
			text: '$(cuesync:current_song_name)',
			size: 12,
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(0, 0, 0),
		},
		steps: [
			{
				down: [{ actionId: 'next_page', options: {} }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'module_connected',
				options: {},
				isInverted: true,
				style: {
					bgcolor: combineRgb(200, 0, 0),
					color: combineRgb(255, 255, 255),
				},
			},
		],
	}

	// Show Cues button
	presets['show_cues'] = {
		type: 'button',
		category: 'CueSync',
		name: 'Show Cues',
		style: {
			text: 'Show\\nCues',
			size: 12,
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(40, 40, 40),
		},
		steps: [
			{
				down: [{ actionId: 'toggle_show_cues', options: {} }],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'show_cues_active',
				options: {},
				style: {
					bgcolor: combineRgb(48, 209, 88),
					color: combineRgb(255, 255, 255),
				},
			},
		],
	}

	// Song Picker button
	presets['song_picker'] = {
		type: 'button',
		category: 'CueSync',
		name: 'Song Picker',
		style: {
			text: '$(cuesync:next_song_name)',
			size: 12,
			color: combineRgb(200, 200, 200),
			bgcolor: combineRgb(30, 30, 30),
		},
		steps: [
			{
				down: [{ actionId: 'next_song', options: {} }],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Cue Slot buttons (1-32)
	for (let i = 1; i <= MAX_SLOTS; i++) {
		presets[`cue_slot_${i}`] = {
			type: 'button',
			category: 'CueSync Cue Slots',
			name: `Cue Slot ${i}`,
			style: {
				text: `$(cuesync:slot_${i}_name)`,
				size: 12,
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(26, 26, 26),
			},
			steps: [
				{
					down: [{ actionId: 'cue_slot_down', options: { slot: i } }],
					up: [{ actionId: 'cue_slot_up', options: { slot: i } }],
				},
			],
			feedbacks: [
				{
					feedbackId: 'cue_slot_color',
					options: { slot: i },
				},
			],
		}
	}

	return presets
}
