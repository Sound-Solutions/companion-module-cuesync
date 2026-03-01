import { type SomeCompanionConfigField } from '@companion-module/base'

export interface CueSyncConfig {
	host: string
	port: number
	slotsPerPage: number
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'textinput',
			id: 'host',
			label: 'CueSync Host',
			width: 8,
			default: '127.0.0.1',
		},
		{
			type: 'number',
			id: 'port',
			label: 'HTTP Port',
			width: 4,
			default: 8765,
			min: 1,
			max: 65534,
		},
		{
			type: 'number',
			id: 'slotsPerPage',
			label: 'Cue Slots Per Page',
			width: 4,
			default: 32,
			min: 1,
			max: 32,
			tooltip: 'Set this to the number of Cue Slot buttons you placed on your Companion page. Controls when cues overflow to the next page.',
		},
	]
}
