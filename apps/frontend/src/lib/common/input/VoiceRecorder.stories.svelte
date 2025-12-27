<!-- Review pending by Autumnlight -->
<script module lang="ts">
import { defineMeta } from "@storybook/addon-svelte-csf";
import VoiceRecorder from "./VoiceRecorder.component.svelte";
import { VoiceRecorderState } from "./voiceRecorder.lib";

const { Story } = defineMeta({
	argTypes: {
		disabled: {
			control: "boolean",
			description: "Disable the recorder",
		},
		state: {
			control: "select",
			description: "Current recorder state",
			options: Object.values(VoiceRecorderState),
		},
	},
	component: VoiceRecorder,
	parameters: {
		backgrounds: {
			default: "elevated",
			values: [
				{
					name: "elevated",
					value: "#121212",
				},
			],
		},
	},
	tags: [
		"autodocs",
	],
	title: "Common/Input/VoiceRecorder",
});
</script>

<script lang="ts">
let interactiveState = $state(VoiceRecorderState.Idle);
let transcription = $state("");
let error = $state("");
let mediaRecorder: MediaRecorder | null = null;
let audioStream: MediaStream | null = null;
let chunks: Blob[] = [];

async function handleToggle() {
	if (interactiveState === VoiceRecorderState.Recording) {
		if (mediaRecorder) {
			mediaRecorder.stop();
		}
		return;
	}

	if (interactiveState !== VoiceRecorderState.Idle) return;

	error = "";
	try {
		audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
		chunks = [];

		mediaRecorder.ondataavailable = (e) => {
			if (e.data.size > 0) chunks.push(e.data);
		};

		mediaRecorder.onstop = async () => {
			if (audioStream) {
				for (const track of audioStream.getTracks()) {
					track.stop();
				}
				audioStream = null;
			}

			if (chunks.length === 0) {
				interactiveState = VoiceRecorderState.Idle;
				return;
			}

			interactiveState = VoiceRecorderState.Processing;
			const audioBlob = new Blob(chunks, { type: "audio/webm" });

			const formData = new FormData();
			formData.append("audio", audioBlob, "recording.webm");

			try {
				const response = await fetch("http://localhost:4030/transcription", {
					method: "POST",
					body: formData,
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				const data = await response.json();
				transcription = data.transcription;
			} catch (err) {
				error = err instanceof Error ? err.message : "Transcription failed";
			} finally {
				interactiveState = VoiceRecorderState.Idle;
			}
		};

		mediaRecorder.start();
		interactiveState = VoiceRecorderState.Recording;
	} catch (err) {
		error = err instanceof Error ? err.message : "Failed to access microphone";
		interactiveState = VoiceRecorderState.Idle;
	}
}
</script>

{#snippet template(args: any)}
	<div class="p-8">
		<VoiceRecorder {...args} />
	</div>
{/snippet}

<Story name="Idle" args={{ state: VoiceRecorderState.Idle }} {template} />
<Story name="Recording" args={{ state: VoiceRecorderState.Recording }} {template} />
<Story name="Processing" args={{ state: VoiceRecorderState.Processing }} {template} />
<Story name="Disabled" args={{ disabled: true }} {template} />

{#snippet allStatesTemplate(_args: any)}
	<div class="flex items-center gap-6 p-8">
		<div class="flex flex-col items-center gap-2">
			<VoiceRecorder state={VoiceRecorderState.Idle} />
			<span class="text-[10px] text-text-secondary">Idle</span>
		</div>
		<div class="flex flex-col items-center gap-2">
			<VoiceRecorder state={VoiceRecorderState.Recording} />
			<span class="text-[10px] text-text-secondary">Recording</span>
		</div>
		<div class="flex flex-col items-center gap-2">
			<VoiceRecorder state={VoiceRecorderState.Processing} />
			<span class="text-[10px] text-text-secondary">Processing</span>
		</div>
		<div class="flex flex-col items-center gap-2">
			<VoiceRecorder disabled />
			<span class="text-[10px] text-text-secondary">Disabled</span>
		</div>
	</div>
{/snippet}

<Story name="AllStates" args={{}} template={allStatesTemplate} />

{#snippet interactiveTemplate(_args: any)}
	<div class="flex flex-col items-center gap-6 p-8">
		<div class="text-center text-[11px] text-text-secondary">
			Click to start recording, click again to stop and transcribe
		</div>

		<VoiceRecorder
			state={interactiveState}
			onclick={handleToggle}
		/>

		<div class="flex flex-col items-center gap-2">
			<span class="text-[10px] text-text-tertiary">State: {interactiveState}</span>

			{#if transcription}
				<div class="max-w-md rounded border border-terminal-green/30 bg-terminal-green/10 p-3">
					<span class="text-[10px] text-terminal-green">Transcription:</span>
					<p class="mt-1 text-xs text-text-primary">{transcription}</p>
				</div>
			{/if}

			{#if error}
				<div class="max-w-md rounded border border-terminal-red/30 bg-terminal-red/10 p-3">
					<span class="text-[10px] text-terminal-red">Error:</span>
					<p class="mt-1 text-xs text-text-primary">{error}</p>
				</div>
			{/if}
		</div>
	</div>
{/snippet}

<Story name="Interactive" args={{}} template={interactiveTemplate} />
