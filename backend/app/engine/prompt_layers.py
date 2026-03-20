from __future__ import annotations

import re
from typing import Any


IMAGE_HOSTILE_PATTERNS = [
    r"\bsemantic_fallback\b",
    r"\btoward chorus\b",
    r"\bopening phase\b",
    r"\bcontinuity across scenes\b",
    r"\bsceneid\b",
    r"\bduration\b",
    r"\bstory_action\b",
    r"\bbeat sync\b",
    r"\bphase[_\s-]*\w+\b",
]


def _clean_line(value: Any) -> str:
    text = re.sub(r"\s+", " ", str(value or "").strip())
    return text.strip(" ,;:-")


def clean_physics_prompt_text(*values: Any) -> str:
    segments: list[str] = []
    for value in values:
        raw = str(value or "").strip()
        if not raw:
            continue
        for part in re.split(r"[\n\r]+|(?<=[.!?])\s+", raw):
            line = _clean_line(part)
            if not line:
                continue
            lowered = line.lower()
            if any(re.search(pattern, lowered, flags=re.IGNORECASE) for pattern in IMAGE_HOSTILE_PATTERNS):
                continue
            segments.append(line)

    deduped: list[str] = []
    seen: set[str] = set()
    for item in segments:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return ". ".join(deduped)


def _as_block(title: str, lines: list[str]) -> str:
    cleaned = [_clean_line(line) for line in lines if _clean_line(line)]
    return "\n".join([f"{title}:"] + [f"- {line}" for line in cleaned])


def build_physics_first_image_blocks(
    *,
    scene_delta: str,
    scene_text: str,
    scene_goal: str,
    style: str,
    lighting_anchor: str,
    location_anchor: str,
    environment_anchor: str,
    weather_anchor: str,
    surface_anchor: str,
    world_scale_context: str,
    entity_scale_anchor_text: str,
    effective_character_anchor: str,
    effective_location_anchor: str,
    effective_style_anchor: str,
    continuity_hint: str,
) -> dict[str, str]:
    subject_scene_state = clean_physics_prompt_text(scene_delta, scene_text, scene_goal)
    mood_source = clean_physics_prompt_text(scene_text, scene_goal, continuity_hint, effective_style_anchor, style)
    light_world = _as_block("LIGHT WORLD", [
        lighting_anchor or "one coherent light world with believable practical and ambient sources",
        weather_anchor,
        effective_style_anchor,
        "one coherent light direction across the frame",
        "believable shadow logic with natural falloff and ambient bounce",
        "light wraps naturally around subject edges when the scene calls for it",
    ])
    subject_identity = _as_block("SUBJECT IDENTITY", [
        effective_character_anchor or "preserve the exact established subject identity from references",
        subject_scene_state,
        "preserve face, hair, body proportions, wardrobe identity, accessories, and species/object identity from references",
    ])
    environment_contact = _as_block("ENVIRONMENT CONTACT / PHYSICAL INTEGRATION", [
        effective_location_anchor or location_anchor,
        environment_anchor,
        world_scale_context,
        entity_scale_anchor_text,
        "subject must feel physically present in the location with grounded feet and contact shadows",
        "match subject scale to the environment and maintain believable wall, floor, or surface contact when relevant",
        "no pasted-on subject or cutout separation from the world",
    ])
    geometry = _as_block("GEOMETRY / CAMERA", [
        subject_scene_state,
        "prefer real optics language such as eye-level medium shot, 35mm or 50mm lens, f/2.8, natural depth of field",
        "camera framing should feel photographed rather than stylized metadata or cinematic buzzwords",
    ])
    texture = _as_block("TEXTURE / REALISM", [
        surface_anchor,
        "realistic skin texture, realistic fabric folds, and subtle physical imperfections",
        "subtle grain or chromatic aberration only if it supports a photographed result",
        "avoid beauty-retouch, poster gloss, or synthetic CGI polish",
    ])
    mood_physics = _as_block("MOOD PHYSICS", [
        mood_source or style,
        "express mood as physical scene state, body tension, air density, temperature, and believable shadow behavior",
        "restrained threat or quiet tension should remain realistic and grounded when the scene is dark or unsettling",
    ])
    negative_constraints = _as_block("NEGATIVE CONSTRAINTS", [
        "no collage",
        "no split screen",
        "no duplicated people",
        "no plastic skin",
        "no CGI look",
        "no cutout edges",
        "no pasted-on subject",
        "no glam studio retouch",
        "no extra limbs",
        "no text, watermark, or UI overlays",
    ])
    return {
        "lightWorldBlock": light_world,
        "subjectIdentityBlock": subject_identity,
        "environmentContactBlock": environment_contact,
        "geometryBlock": geometry,
        "textureBlock": texture,
        "moodPhysicsBlock": mood_physics,
        "negativeConstraintsBlock": negative_constraints,
    }


def build_clip_video_motion_prompt(
    *,
    base_prompt: str,
    transition_prompt: str = "",
    camera: str = "",
    fmt: str = "",
    seconds: int | float | None = None,
) -> str:
    scene_motion = clean_physics_prompt_text(transition_prompt, base_prompt)
    duration_text = ""
    if seconds:
        try:
            duration_text = f"{float(seconds):g} second motion beat"
        except Exception:
            duration_text = ""
    camera_text = _clean_line(camera) or "subtle handheld push-in or gentle dolly-in when motivated"
    format_text = _clean_line(fmt)
    lines = [
        "CLIP VIDEO MOTION:",
        f"- scene action over time: {scene_motion or 'physically grounded motion within one continuous real world'}",
        f"- camera motion: {camera_text}",
        "- subject motion: natural breathing, realistic posture shifts, believable weight transfer, and grounded inertia",
        "- environment motion: fabric and hair respond to air, particles and background elements move naturally, shadows shift consistently with camera angle and scene light",
        "- lighting continuity: keep one-world lighting continuity and coherent shadow direction through the shot",
        "- motion constraints: no floaty motion, no rubber limbs, no cutout motion, no pasted layers",
    ]
    if duration_text:
        lines.append(f"- timing: {duration_text}")
    if format_text:
        lines.append(f"- framing: compose motion for {format_text}")
    return "\n".join(lines)
