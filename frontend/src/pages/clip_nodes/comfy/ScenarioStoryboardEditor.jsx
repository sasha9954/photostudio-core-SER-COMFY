import React, { useEffect, useMemo, useRef, useState } from "react";

const RENDER_MODE_OPTIONS = [
  { value: "image_to_video", label: "image_to_video" },
  { value: "lip_sync", label: "lip_sync" },
  { value: "first_last", label: "first_last" },
];

function fmtSec(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return num.toFixed(1);
}

function safeSceneDuration(scene = {}) {
  const explicit = Number(scene?.audioSliceExpectedDurationSec ?? scene?.durationSec);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const t0 = Number(scene?.audioSliceStartSec ?? scene?.t0 ?? 0);
  const t1 = Number(scene?.audioSliceEndSec ?? scene?.t1 ?? t0);
  return Math.max(0, t1 - t0);
}

function SceneSection({ title, children, defaultOpen = true }) {
  return (
    <details className="clipSB_scenarioEditorSection" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="clipSB_scenarioEditorSectionBody">{children}</div>
    </details>
  );
}

export default function ScenarioStoryboardEditor({
  open,
  nodeId,
  scenes,
  sceneGeneration,
  audioData,
  onClose,
  onUpdateScene,
  onGenerateScene,
  onUpdateMusic,
  onGenerateMusic,
}) {
  const [selected, setSelected] = useState(0);
  const masterAudioRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setSelected(0);
  }, [open, nodeId]);

  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const safeGeneration = sceneGeneration && typeof sceneGeneration === "object" ? sceneGeneration : {};
  const safeAudioData = audioData && typeof audioData === "object" ? audioData : {};

  const phrases = useMemo(() => {
    if (Array.isArray(safeAudioData?.phrases) && safeAudioData.phrases.length) return safeAudioData.phrases;
    return safeScenes.map((scene, idx) => ({
      sceneId: String(scene?.sceneId || `S${idx + 1}`),
      startSec: Number(scene?.audioSliceStartSec ?? scene?.t0 ?? 0),
      endSec: Number(scene?.audioSliceEndSec ?? scene?.t1 ?? scene?.t0 ?? 0),
      text: String(scene?.localPhrase || scene?.summaryRu || "").trim(),
      energy: String(scene?.emotionRu || "").trim(),
      context: String(scene?.locationRu || "").trim(),
    }));
  }, [safeAudioData?.phrases, safeScenes]);

  const safeIndex = safeScenes.length ? Math.min(Math.max(selected, 0), safeScenes.length - 1) : -1;
  const selectedScene = safeIndex >= 0 ? safeScenes[safeIndex] : null;
  const selectedSceneId = String(selectedScene?.sceneId || "").trim();
  const selectedPhraseIndex = phrases.findIndex((phrase) => String(phrase?.sceneId || "") === selectedSceneId);

  const jumpToPhrase = (startSec) => {
    if (!masterAudioRef.current) return;
    const t0 = Number(startSec);
    if (!Number.isFinite(t0)) return;
    masterAudioRef.current.currentTime = Math.max(0, t0);
    masterAudioRef.current.play().catch(() => {});
  };

  const previewSceneAudioSlice = (scene) => {
    if (!scene || !masterAudioRef.current) return;
    const startSec = Number(scene?.audioSliceStartSec ?? scene?.t0 ?? 0);
    const endSec = Number(scene?.audioSliceEndSec ?? scene?.t1 ?? startSec);
    if (!Number.isFinite(startSec) || !Number.isFinite(endSec)) return;
    masterAudioRef.current.currentTime = Math.max(0, startSec);
    masterAudioRef.current.play().catch(() => {});
    const durationMs = Math.max(100, (Math.max(endSec, startSec) - startSec) * 1000);
    window.setTimeout(() => {
      if (!masterAudioRef.current) return;
      masterAudioRef.current.pause();
    }, durationMs);
  };

  if (!open) return null;

  return (
    <div className="clipSB_scenarioOverlay" onClick={onClose}>
      <div className="clipSB_scenarioPanel clipSB_scenarioEditorPanel" onClick={(event) => event.stopPropagation()}>
        <div className="clipSB_scenarioHeader">
          <div>
            <div className="clipSB_scenarioTitle">Scenario Storyboard Editor</div>
            <div className="clipSB_scenarioMeta">Сцен: {safeScenes.length}</div>
          </div>
          <button className="clipSB_iconBtn" onClick={onClose} type="button">×</button>
        </div>

        <div className="clipSB_scenarioEditorAudioPanel">
          <div className="clipSB_scenarioEditorAudioTitle">AUDIO PANEL</div>
          <div className="clipSB_scenarioEditorAudioGrid">
            <div>
              <div className="clipSB_small">MASTER AUDIO • duration: {fmtSec(safeAudioData?.durationSec)}s</div>
              {safeAudioData?.audioUrl ? (
                <audio ref={masterAudioRef} controls className="clipSB_audioPlayer" src={safeAudioData.audioUrl} />
              ) : (
                <div className="clipSB_hint">Master audio отсутствует.</div>
              )}
            </div>

            <div>
              <div className="clipSB_small">MUSIC / BACKGROUND</div>
              <textarea
                className="clipSB_textarea"
                rows={2}
                value={String(safeAudioData?.musicPromptRu || "")}
                onChange={(event) => onUpdateMusic?.(nodeId, { musicPromptRu: event.target.value })}
                placeholder="musicPromptRu"
              />
              <details style={{ marginTop: 6 }}>
                <summary>EN version</summary>
                <textarea
                  className="clipSB_textarea"
                  rows={2}
                  value={String(safeAudioData?.musicPromptEn || "")}
                  onChange={(event) => onUpdateMusic?.(nodeId, { musicPromptEn: event.target.value })}
                  placeholder="musicPromptEn"
                />
              </details>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <button className="clipSB_btn" type="button" onClick={() => onGenerateMusic?.(nodeId)} disabled={safeAudioData?.musicStatus === "loading"}>
                  {safeAudioData?.musicStatus === "loading" ? "Генерирую..." : "Сгенерировать музыку"}
                </button>
                <span className="clipSB_small">status: {String(safeAudioData?.musicStatus || "idle")}</span>
              </div>
              {safeAudioData?.musicUrl ? <audio controls className="clipSB_audioPlayer" src={safeAudioData.musicUrl} style={{ marginTop: 8 }} /> : null}
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="clipSB_small">PHRASE BREAKDOWN</div>
            <div className="clipSB_scenarioEditorPhraseList">
              {phrases.map((phrase, idx) => {
                const isActive = idx === selectedPhraseIndex;
                return (
                  <div key={`${phrase.sceneId || idx}-${idx}`} className={`clipSB_scenarioEditorPhraseItem ${isActive ? "isActive" : ""}`}>
                    <div className="clipSB_small">[{fmtSec(phrase.startSec)} - {fmtSec(phrase.endSec)}] "{phrase.text || "—"}"</div>
                    <div className="clipSB_hint">{phrase.energy ? `energy: ${phrase.energy}` : ""}{phrase.context ? ` • context: ${phrase.context}` : ""}</div>
                    <button className="clipSB_btn clipSB_btnSecondary" type="button" onClick={() => jumpToPhrase(phrase.startSec)}>▶ Перейти к фразе</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="clipSB_scenarioBody clipSB_scenarioEditorBody">
          <div className="clipSB_scenarioList">
            {safeScenes.map((scene, idx) => {
              const sceneId = String(scene?.sceneId || `S${idx + 1}`);
              const runtime = safeGeneration[sceneId] && typeof safeGeneration[sceneId] === "object" ? safeGeneration[sceneId] : {};
              return (
                <button key={sceneId} className={`clipSB_scenarioItem ${idx === safeIndex ? "isActive" : ""}`} type="button" onClick={() => setSelected(idx)}>
                  <div className="clipSB_scenarioItemTop">
                    <div className="clipSB_storyboardSceneId">[ {sceneId} ]</div>
                    <div className="clipSB_scenarioItemTime">{fmtSec(scene?.audioSliceStartSec ?? scene?.t0)} → {fmtSec(scene?.audioSliceEndSec ?? scene?.t1)}</div>
                  </div>
                  <div className="clipSB_scenarioItemText">"{scene?.summaryRu || scene?.localPhrase || "—"}"</div>
                  <div className="clipSB_hint">mode: {scene?.renderMode || "image_to_video"} • status: {runtime?.status || "idle"}</div>
                </button>
              );
            })}
          </div>

          <div className="clipSB_scenarioEdit">
            {!selectedScene ? <div className="clipSB_empty">Нет выбранной сцены</div> : (
              <>
                <SceneSection title="ОСНОВА" defaultOpen>
                  <div className="clipSB_storyboardKv"><span>summaryRu</span><strong>{selectedScene.summaryRu || "—"}</strong></div>
                  <div className="clipSB_storyboardKv"><span>actors</span><strong>{Array.isArray(selectedScene.actors) && selectedScene.actors.length ? selectedScene.actors.join(", ") : "—"}</strong></div>
                  <div className="clipSB_storyboardKv"><span>locationRu</span><strong>{selectedScene.locationRu || "—"}</strong></div>
                  <div className="clipSB_storyboardKv"><span>emotionRu</span><strong>{selectedScene.emotionRu || "—"}</strong></div>
                  <details><summary>EN version</summary><div className="clipSB_small">summaryEn: {selectedScene.summaryEn || "—"}</div></details>
                </SceneSection>

                <SceneSection title="IMAGE" defaultOpen>
                  <div className="clipSB_storyboardPromptBox">{selectedScene.imagePromptRu || "—"}</div>
                  <details><summary>EN version</summary><div className="clipSB_storyboardPromptBox">{selectedScene.imagePromptEn || "—"}</div></details>
                </SceneSection>

                <SceneSection title="VIDEO" defaultOpen>
                  <div className="clipSB_storyboardPromptBox">{selectedScene.videoPromptRu || "—"}</div>
                  <div className="clipSB_small" style={{ marginTop: 6 }}>cameraRu: {selectedScene.cameraRu || "—"}</div>
                  <details><summary>EN version</summary><div className="clipSB_storyboardPromptBox">{selectedScene.videoPromptEn || "—"}</div><div className="clipSB_small" style={{ marginTop: 6 }}>cameraEn: {selectedScene.cameraEn || "—"}</div></details>
                </SceneSection>

                <SceneSection title="AUDIO / РЕЧЬ" defaultOpen>
                  <div className="clipSB_storyboardKv"><span>narrationMode</span><strong>{selectedScene.narrationMode || "—"}</strong></div>
                  <div className="clipSB_storyboardKv"><span>localPhrase</span><strong>{selectedScene.localPhrase || "—"}</strong></div>
                  <div className="clipSB_storyboardKv"><span>audioSliceStartSec</span><strong>{fmtSec(selectedScene.audioSliceStartSec)}s</strong></div>
                  <div className="clipSB_storyboardKv"><span>audioSliceEndSec</span><strong>{fmtSec(selectedScene.audioSliceEndSec)}s</strong></div>
                  <div className="clipSB_storyboardKv"><span>duration</span><strong>{fmtSec(safeSceneDuration(selectedScene))}s</strong></div>
                  <button className="clipSB_btn clipSB_btnSecondary" type="button" onClick={() => previewSceneAudioSlice(selectedScene)}>▶ прослушать кусок</button>
                </SceneSection>

                {selectedScene.needsTwoFrames ? (
                  <SceneSection title="FIRST / LAST" defaultOpen={false}>
                    <div className="clipSB_small">startFramePromptRu: {selectedScene.startFramePromptRu || "—"}</div>
                    <div className="clipSB_small">endFramePromptRu: {selectedScene.endFramePromptRu || "—"}</div>
                    <details><summary>EN version</summary><div className="clipSB_small">startFramePromptEn: {selectedScene.startFramePromptEn || "—"}</div><div className="clipSB_small">endFramePromptEn: {selectedScene.endFramePromptEn || "—"}</div></details>
                  </SceneSection>
                ) : null}

                <SceneSection title="GENERATION" defaultOpen>
                  <label className="clipSB_narrativeField">
                    <div className="clipSB_brainLabel">renderMode</div>
                    <select className="clipSB_select" value={selectedScene.renderMode || "image_to_video"} onChange={(event) => onUpdateScene?.(nodeId, selectedSceneId, { renderMode: event.target.value })}>
                      {RENDER_MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <button className="clipSB_btn" type="button" onClick={() => onGenerateScene?.(nodeId, selectedSceneId)}>Сгенерировать сцену</button>
                    <span className="clipSB_small">status: {String(safeGeneration[selectedSceneId]?.status || "idle")}</span>
                  </div>
                </SceneSection>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
