import WebSocket from 'ws'
import type { CueSyncInstance } from './index'
import { InstanceStatus } from '@companion-module/base'
import {
	remapSlots,
	shouldAutoPageFlip,
	advancePage,
	type CueState,
	type ShowData,
} from './state'

const RECONNECT_INITIAL_MS = 2000
const RECONNECT_MULTIPLIER = 1.5
const RECONNECT_MAX_MS = 30000

export class CueSyncConnection {
	private ws: WebSocket | null = null
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null
	private reconnectDelay = RECONNECT_INITIAL_MS
	private destroyed = false
	private firingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()

	constructor(private instance: CueSyncInstance) {}

	connect(host: string, port: number): void {
		this.disconnect()
		this.destroyed = false

		const wsPort = port + 1
		const url = `ws://${host}:${wsPort}`
		this.instance.log('info', `Connecting to ${url}`)
		this.instance.updateStatus(InstanceStatus.Connecting)

		try {
			this.ws = new WebSocket(url)
		} catch (e) {
			this.instance.log('error', `WebSocket creation failed: ${e}`)
			this.scheduleReconnect(host, port)
			return
		}

		this.ws.on('open', () => {
			this.instance.log('info', 'Connected')
			this.instance.updateStatus(InstanceStatus.Ok)
			this.reconnectDelay = RECONNECT_INITIAL_MS
			this.instance.onConnected()
		})

		this.ws.on('message', (data) => {
			try {
				const msg = JSON.parse(data.toString())
				this.handleMessage(msg)
			} catch (e) {
				this.instance.log('warn', `Failed to parse message: ${e}`)
			}
		})

		this.ws.on('close', () => {
			this.instance.log('info', 'Disconnected')
			if (!this.destroyed) {
				this.instance.updateStatus(InstanceStatus.Disconnected)
				this.instance.onDisconnected()
				this.scheduleReconnect(host, port)
			}
		})

		this.ws.on('error', (err) => {
			this.instance.log('error', `WebSocket error: ${err.message}`)
		})
	}

	private handleMessage(msg: Record<string, unknown>): void {
		const state = this.instance.state

		switch (msg.type) {
			case 'snapshot': {
				state.show = msg.show as ShowData
				state.currentSongId = msg.currentSongId as string
				state.cueStates = (msg.cueStates as Record<string, CueState>) ?? {}
				state.currentPage = 0
				state.viewMode = 'song'
				remapSlots(state)
				this.instance.refreshAll()
				break
			}

			case 'songChanged': {
				state.currentSongId = msg.songId as string
				if (msg.cueStates) {
					state.cueStates = msg.cueStates as Record<string, CueState>
				}
				state.currentPage = 0
				state.viewMode = 'song'
				remapSlots(state)
				this.instance.refreshAll()
				break
			}

			case 'cueFired': {
				const cueId = msg.cueId as string
				state.firingCues.add(cueId)

				// Clear any existing timer for this cue
				const existing = this.firingTimers.get(cueId)
				if (existing) clearTimeout(existing)

				this.firingTimers.set(
					cueId,
					setTimeout(() => {
						state.firingCues.delete(cueId)
						this.firingTimers.delete(cueId)
						this.instance.checkFeedbacks('cue_slot_state', 'cue_slot_color')
					}, 1000),
				)

				// Auto-page-flip
				if (shouldAutoPageFlip(state, cueId)) {
					advancePage(state)
					this.instance.refreshAll()
				} else {
					this.instance.checkFeedbacks('cue_slot_state', 'cue_slot_color')
				}
				break
			}

			case 'cueStateChanged': {
				const cueId = msg.cueId as string
				state.cueStates[cueId] = msg.state as CueState
				this.instance.checkFeedbacks('cue_slot_state', 'cue_slot_color')
				break
			}

			case 'cueEnabled': {
				const cueId = msg.cueId as string
				const enabled = msg.enabled as boolean
				// Update the cue in the show data
				if (state.show) {
					const updateCue = (cues: { id: string; isEnabled: boolean }[]) => {
						const cue = cues.find((c) => c.id === cueId)
						if (cue) cue.isEnabled = enabled
					}
					for (const song of state.show.currentSetlist.songs) {
						updateCue(song.cues)
					}
					updateCue(state.show.showCues)
				}
				this.instance.refreshAll()
				break
			}
		}
	}

	send(msg: Record<string, unknown>): void {
		if (this.ws?.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(msg))
		}
	}

	get isConnected(): boolean {
		return this.ws?.readyState === WebSocket.OPEN
	}

	private scheduleReconnect(host: string, port: number): void {
		if (this.destroyed) return
		this.instance.log('info', `Reconnecting in ${this.reconnectDelay}ms`)
		this.reconnectTimer = setTimeout(() => {
			this.connect(host, port)
		}, this.reconnectDelay)
		this.reconnectDelay = Math.min(this.reconnectDelay * RECONNECT_MULTIPLIER, RECONNECT_MAX_MS)
	}

	disconnect(): void {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		for (const timer of this.firingTimers.values()) {
			clearTimeout(timer)
		}
		this.firingTimers.clear()
		if (this.ws) {
			this.ws.removeAllListeners()
			this.ws.close()
			this.ws = null
		}
	}

	destroy(): void {
		this.destroyed = true
		this.disconnect()
	}
}
