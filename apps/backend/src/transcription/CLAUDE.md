# Transcription

The primary Voxtral chat request uses a plain-text vocabulary prompt. If it fails, the service falls back to the audio transcription endpoint.

The fallback's `transcriptionContextBiasTerms` must contain only nonempty terms without whitespace or commas. Keep `Oh My Pi` in the chat prompt only; the fallback uses `OMP`. Both vocabulary lists include Electric, ElectricSQL, ElysiaJS, Convex, ACL, permission, Autumn, Codex, Claude, and ClaudeCode.

Recordings are saved before transcription and remain available for regeneration after provider errors.
