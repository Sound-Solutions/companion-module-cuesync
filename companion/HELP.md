# CueSync Companion Module

Control your CueSync live cue system directly from Stream Deck hardware via Bitfocus Companion.

## Setup

1. Add a **CueSync** module instance in Companion
2. Enter the **IP address** of the machine running CueSync (e.g., `192.168.1.100`)
3. Leave the port at **8765** unless you changed it in CueSync
4. The module connects automatically — the status indicator shows green when connected

## Buttons

Drag these presets from the CueSync preset list onto your Companion pages:

### Current Song
Shows the name of the active song. If the song has more cues than slots, it shows a page indicator (e.g., "My Song (2/3)"). Press to advance to the next page of cues.

### Show Cues
Toggles between viewing the current song's cues and the show-level cues. Highlighted when show cues are active.

### Song Picker
Shows the name of the next song in the setlist. Press to advance to that song.

### Cue Slots (1–32)
Each slot displays the name and color of its mapped cue. Press to fire the cue. The slot number determines position — place as many as you need.

**Colors by action type:**
- **Blue** — OSC
- **Purple** — MIDI
- **Orange** — RCP
- **Green** — AppleScript / Enable
- **Slate** — Group

**State indicators:**
- **Pulsing white** — Armed (ready to fire)
- **Bright flash** — Firing (1 second)
- **Dimmed** — Already fired
- **Grey** — Disabled
- **Dark** — Empty slot (no cue mapped)

## How It Works

The module connects to CueSync's WebSocket server (the same one the web remote uses). When songs change — whether by timecode, manual selection, or the Song Picker button — the cue slots automatically remap to show the new song's cues. No per-show reconfiguration needed.

## Troubleshooting

- **Not connecting?** Make sure CueSync is running and the IP address is correct. Both machines must be on the same network.
- **Buttons blank?** Check that a show is loaded in CueSync with songs and cues in the current setlist.
- **Wrong cues showing?** The module follows CueSync's active song. If you're in Show Cues view, press the Show Cues button to switch back to song view.
