from __future__ import annotations

import re
from typing import Any

from app.engine.audio_analyzer import derive_audio_semantic_profile


def _compact_text(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def try_extract_transcript(*, payload: dict[str, Any], analysis: dict[str, Any]) -> dict[str, str]:
    """Placeholder hook for future ASR integrations. Returns empty values for now."""
    return {"lyricsText": "", "transcriptText": "", "spokenTextHint": ""}


def preprocess_audio_text(*, payload: dict[str, Any], analysis: dict[str, Any]) -> dict[str, Any]:
    explicit_text = _compact_text(payload.get("text"))
    lyrics_text = _compact_text(payload.get("lyricsText") or payload.get("lyrics"))
    transcript_text = _compact_text(payload.get("transcriptText") or payload.get("transcript"))
    spoken_hint = _compact_text(payload.get("spokenTextHint"))

    if explicit_text:
        return {
            "exactLyricsAvailable": bool(lyrics_text),
            "lyricsText": lyrics_text,
            "transcriptText": transcript_text,
            "spokenTextHint": spoken_hint,
            "audioSemanticSummary": _compact_text(payload.get("audioSemanticSummary")),
            "audioSemanticHints": payload.get("audioSemanticHints") if isinstance(payload.get("audioSemanticHints"), list) else [],
            "textSource": "existing_text",
        }

    if lyrics_text or transcript_text or spoken_hint:
        return {
            "exactLyricsAvailable": bool(lyrics_text),
            "lyricsText": lyrics_text,
            "transcriptText": transcript_text,
            "spokenTextHint": spoken_hint,
            "audioSemanticSummary": _compact_text(payload.get("audioSemanticSummary")),
            "audioSemanticHints": payload.get("audioSemanticHints") if isinstance(payload.get("audioSemanticHints"), list) else [],
            "textSource": "transcript",
        }

    extracted = try_extract_transcript(payload=payload, analysis=analysis)
    extracted_lyrics = _compact_text(extracted.get("lyricsText"))
    extracted_transcript = _compact_text(extracted.get("transcriptText"))
    extracted_spoken = _compact_text(extracted.get("spokenTextHint"))
    if extracted_lyrics or extracted_transcript or extracted_spoken:
        return {
            "exactLyricsAvailable": bool(extracted_lyrics),
            "lyricsText": extracted_lyrics,
            "transcriptText": extracted_transcript,
            "spokenTextHint": extracted_spoken,
            "audioSemanticSummary": _compact_text(payload.get("audioSemanticSummary")),
            "audioSemanticHints": payload.get("audioSemanticHints") if isinstance(payload.get("audioSemanticHints"), list) else [],
            "textSource": "transcript",
        }

    semantic = derive_audio_semantic_profile(analysis)
    return {
        "exactLyricsAvailable": False,
        "lyricsText": "",
        "transcriptText": "",
        "spokenTextHint": "",
        "audioSemanticSummary": _compact_text(semantic.get("audioSemanticSummary")),
        "audioSemanticHints": semantic.get("audioSemanticHints") if isinstance(semantic.get("audioSemanticHints"), list) else [],
        "textSource": "semantic_fallback",
    }
