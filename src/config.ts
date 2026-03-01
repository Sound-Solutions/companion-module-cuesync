import { type SomeCompanionConfigField } from '@companion-module/base'

export interface CueSyncConfig {
	host: string
	port: number
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
	]
}
