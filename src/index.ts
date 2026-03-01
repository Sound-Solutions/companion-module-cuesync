import {
	InstanceBase,
	runEntrypoint,
	type SomeCompanionConfigField,
} from '@companion-module/base'
import { getConfigFields, type CueSyncConfig } from './config'
import { CueSyncConnection } from './connection'
import { createInitialState, remapSlots, type ModuleState } from './state'
import { getVariableDefinitions, getAllVariableValues } from './variables'
import { getActions } from './actions'
import { getFeedbacks } from './feedbacks'
import { getPresets } from './presets'

export class CueSyncInstance extends InstanceBase<CueSyncConfig> {
	public state: ModuleState = createInitialState()
	public connection: CueSyncConnection = new CueSyncConnection(this)
	private config: CueSyncConfig = { host: '127.0.0.1', port: 8765, slotsPerPage: 32 }

	async init(config: CueSyncConfig): Promise<void> {
		this.config = config
		this.setupModule()
		this.connectToHost()
	}

	private setupModule(): void {
		this.state.slotsPerPage = this.config.slotsPerPage || 32
		this.setActionDefinitions(getActions(this))
		this.setFeedbackDefinitions(getFeedbacks(this))
		this.setVariableDefinitions(getVariableDefinitions())
		this.setPresetDefinitions(getPresets())
		this.updateVariables()
	}

	private connectToHost(): void {
		if (this.config.host) {
			this.connection.connect(this.config.host, this.config.port)
		}
	}

	async configUpdated(config: CueSyncConfig): Promise<void> {
		const hostChanged = config.host !== this.config.host || config.port !== this.config.port
		this.config = config
		this.state.slotsPerPage = config.slotsPerPage || 32
		if (hostChanged) {
			this.state = createInitialState()
			this.state.slotsPerPage = config.slotsPerPage || 32
			this.connection.destroy()
			this.connection = new CueSyncConnection(this)
			this.connectToHost()
		} else {
			// Just slots changed — remap without reconnecting
			remapSlots(this.state)
			this.refreshAll()
		}
	}

	async destroy(): Promise<void> {
		this.connection.destroy()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	/** Called by connection when WebSocket opens */
	onConnected(): void {
		this.updateVariables()
	}

	/** Called by connection when WebSocket closes */
	onDisconnected(): void {
		this.state = createInitialState()
		this.refreshAll()
	}

	/** Refresh variables, feedbacks, and presets from current state */
	refreshAll(): void {
		this.updateVariables()
		this.checkFeedbacks('cue_slot_state', 'cue_slot_color', 'module_connected', 'show_cues_active')
	}

	private updateVariables(): void {
		const values = getAllVariableValues(this.state, this.connection.isConnected)
		this.setVariableValues(values)
	}
}

runEntrypoint(CueSyncInstance, [])
