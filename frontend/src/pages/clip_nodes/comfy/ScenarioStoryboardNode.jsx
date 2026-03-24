import React from "react";
import { Handle, Position, NodeShell, handleStyle } from "./comfyNodeShared";

export default function ScenarioStoryboardNode({ id, data }) {
  const scenes = Array.isArray(data?.scenes) ? data.scenes : [];
  const totalScenes = scenes.length;
  const generationMap = data?.sceneGeneration && typeof data.sceneGeneration === "object" ? data.sceneGeneration : {};
  const generatedImages = scenes.filter((scene, idx) => {
    const key = String(scene?.sceneId || `S${idx + 1}`);
    const runtime = generationMap[key] && typeof generationMap[key] === "object" ? generationMap[key] : {};
    return String(runtime?.imageStatus || runtime?.status || "").trim() === "done";
  }).length;
  const generatedVideos = scenes.filter((scene, idx) => {
    const key = String(scene?.sceneId || `S${idx + 1}`);
    const runtime = generationMap[key] && typeof generationMap[key] === "object" ? generationMap[key] : {};
    return String(runtime?.videoStatus || runtime?.status || "").trim() === "done";
  }).length;
  const status = totalScenes > 0 ? "ready" : "idle";

  return (
    <>
      <Handle type="target" position={Position.Left} id="scenario_storyboard_in" className="clipSB_handle" style={handleStyle("scenario_storyboard_in")} />
      <Handle type="source" position={Position.Right} id="scenario_storyboard_out" className="clipSB_handle" style={handleStyle("scenario_storyboard_out")} />
      <NodeShell title="SCENARIO STORYBOARD" onClose={() => data?.onRemoveNode?.(id)} icon={<span aria-hidden>🎞️</span>} className="clipSB_nodeStoryboard">
        <div className="clipSB_assemblyStats" style={{ marginTop: 4 }}>
          <div className="clipSB_assemblyRow"><span>Сцен</span><strong>{totalScenes}</strong></div>
          <div className="clipSB_assemblyRow"><span>Фото</span><strong>{generatedImages}/{totalScenes || 0}</strong></div>
          <div className="clipSB_assemblyRow"><span>Видео</span><strong>{generatedVideos}/{totalScenes || 0}</strong></div>
          <div className="clipSB_assemblyRow"><span>Статус</span><strong>{status}</strong></div>
        </div>

        <div className="clipSB_selectHint" style={{ marginTop: 8 }}>Сцены готовы. Можно открыть editor.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="clipSB_btn" onClick={() => data?.onOpenScenarioStoryboard?.(id)} disabled={totalScenes === 0} type="button">Открыть editor</button>
        </div>
      </NodeShell>
    </>
  );
}
