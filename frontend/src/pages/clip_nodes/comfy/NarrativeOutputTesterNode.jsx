import React from "react";
import { Handle, Position, NodeShell, handleStyle } from "./comfyNodeShared";

export const NARRATIVE_TESTER_HANDLE_TOP = 96;

export const NARRATIVE_TESTER_CONFIG = {
  scenarioOutputTesterNode: {
    type: "scenarioOutputTesterNode",
    title: "ТЕСТЕР СЦЕНАРИЯ",
    icon: "🧪",
    acceptHandle: "scenario_out",
    statusLabel: "Сценарий получен",
    waitingLabel: "Сценарий подключён",
    emptyTitle: "Подключите выход narrative.scenario_out",
    emptyHint: "Этот тестер показывает полный сценарий, который реально летит по проводу.",
    payloadKind: "text",
    payloadKey: "scenario",
    metricsLabel: "символов",
  },
  voiceOutputTesterNode: {
    type: "voiceOutputTesterNode",
    title: "ТЕСТЕР ОЗВУЧКИ",
    icon: "📡",
    acceptHandle: "voice_script_out",
    statusLabel: "Озвучка получена",
    waitingLabel: "Озвучка подключена",
    emptyTitle: "Подключите выход narrative.voice_script_out",
    emptyHint: "Этот тестер показывает полный voice script без дальнейшей генерации.",
    payloadKind: "text",
    payloadKey: "voiceScript",
    metricsLabel: "символов",
  },
  brainPackageTesterNode: {
    type: "brainPackageTesterNode",
    title: "ТЕСТЕР МОЗГА",
    icon: "🔬",
    acceptHandle: "brain_package_out",
    statusLabel: "Brain package получен",
    waitingLabel: "Brain package подключён",
    emptyTitle: "Подключите выход narrative.brain_package_out",
    emptyHint: "Этот тестер показывает структурированный пакет для мозговой ноды и raw JSON.",
    payloadKind: "brain",
    payloadKey: "brainPackage",
  },
  musicPromptTesterNode: {
    type: "musicPromptTesterNode",
    title: "ТЕСТЕР МУЗЫКИ",
    icon: "⚡",
    acceptHandle: "bg_music_prompt_out",
    statusLabel: "Music prompt получен",
    waitingLabel: "Music prompt подключён",
    emptyTitle: "Подключите выход narrative.bg_music_prompt_out",
    emptyHint: "Этот тестер показывает полный prompt для фоновой музыки.",
    payloadKind: "text",
    payloadKey: "bgMusicPrompt",
    metricsLabel: "символов",
  },
};

function formatBrainValue(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }
  const normalized = String(value || "").trim();
  return normalized || "—";
}

function TesterEmptyState({ config, isConnected }) {
  return (
    <div className={`clipSB_testerEmpty ${isConnected ? "isConnected" : ""}`.trim()}>
      <div className="clipSB_testerEmptyTitle">{config.emptyTitle}</div>
      <div className="clipSB_testerEmptyHint">{config.emptyHint}</div>
      <div className="clipSB_testerWaitingBadge">{isConnected ? "Подключено, ожидается payload" : "Ожидается payload"}</div>
    </div>
  );
}

function TesterTextBody({ config, payload, isConnected }) {
  const text = String(payload || "").trim();
  if (!text) {
    return <TesterEmptyState config={config} isConnected={isConnected} />;
  }

  return (
    <>
      <div className="clipSB_testerMetaRow">
        <span className="clipSB_testerStatusBadge isReady">{config.statusLabel}</span>
        <span className="clipSB_testerMetric">{text.length} {config.metricsLabel || "символов"}</span>
      </div>
      <div className="clipSB_testerPayload clipSB_testerPayload--text">
        <pre>{text}</pre>
      </div>
    </>
  );
}

function TesterBrainBody({ config, payload, isConnected }) {
  const brain = payload && typeof payload === "object" ? payload : null;
  if (!brain) {
    return <TesterEmptyState config={config} isConnected={isConnected} />;
  }

  return (
    <>
      <div className="clipSB_testerMetaRow">
        <span className="clipSB_testerStatusBadge isReady">{config.statusLabel}</span>
        <span className="clipSB_testerMetric">{Object.keys(brain).length} полей</span>
      </div>
      <div className="clipSB_testerPayload clipSB_testerPayload--brain">
        <div className="clipSB_testerKvGrid">
          <div className="clipSB_testerKvItem"><span>contentTypeLabel</span><strong>{formatBrainValue(brain.contentTypeLabel)}</strong></div>
          <div className="clipSB_testerKvItem"><span>styleLabel</span><strong>{formatBrainValue(brain.styleLabel)}</strong></div>
          <div className="clipSB_testerKvItem"><span>sourceLabel</span><strong>{formatBrainValue(brain.sourceLabel)}</strong></div>
          <div className="clipSB_testerKvItem"><span>sourcePreview</span><strong>{formatBrainValue(brain.sourcePreview)}</strong></div>
          <div className="clipSB_testerKvItem"><span>entities</span><strong>{formatBrainValue(brain.entities)}</strong></div>
          <div className="clipSB_testerKvItem"><span>sceneLogic</span><strong>{formatBrainValue(brain.sceneLogic)}</strong></div>
          <div className="clipSB_testerKvItem"><span>audioStrategy</span><strong>{formatBrainValue(brain.audioStrategy)}</strong></div>
          <div className="clipSB_testerKvItem"><span>directorNote</span><strong>{formatBrainValue(brain.directorNote)}</strong></div>
        </div>
        <details className="clipSB_testerRawJson">
          <summary>Raw JSON</summary>
          <pre>{JSON.stringify(brain, null, 2)}</pre>
        </details>
      </div>
    </>
  );
}

function NarrativeOutputTesterNode({ id, data }) {
  const config = data?.testerConfig || NARRATIVE_TESTER_CONFIG[data?.testerType] || NARRATIVE_TESTER_CONFIG.scenarioOutputTesterNode;
  const isConnected = !!data?.isConnected;
  const hasPayload = !!data?.hasPayload;

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id={config.acceptHandle}
        className="clipSB_handle"
        style={handleStyle(config.acceptHandle, { top: NARRATIVE_TESTER_HANDLE_TOP })}
      />
      <NodeShell
        title={config.title}
        icon={<span aria-hidden>{config.icon}</span>}
        onClose={() => data?.onRemoveNode?.(id)}
        className={`clipSB_nodeTester clipSB_nodeTester--${config.payloadKind}`}
      >
        <div className="clipSB_testerSubtitle">LAB / DEBUG RECEIVER · временная технода для проверки narrative pipeline</div>
        <div className="clipSB_testerMetaRow">
          <span className={`clipSB_testerStatusBadge ${isConnected ? "isConnected" : ""}`.trim()}>
            {isConnected ? config.waitingLabel : "Не подключено"}
          </span>
          <span className="clipSB_testerMetric">accept: {config.acceptHandle}</span>
        </div>
        {config.payloadKind === "brain"
          ? <TesterBrainBody config={config} payload={hasPayload ? data?.payload : null} isConnected={isConnected} />
          : <TesterTextBody config={config} payload={hasPayload ? data?.payload : ""} isConnected={isConnected} />}
      </NodeShell>
    </>
  );
}

export function ScenarioOutputTesterNode(props) {
  return <NarrativeOutputTesterNode {...props} />;
}

export function VoiceOutputTesterNode(props) {
  return <NarrativeOutputTesterNode {...props} />;
}

export function BrainPackageTesterNode(props) {
  return <NarrativeOutputTesterNode {...props} />;
}

export function MusicPromptTesterNode(props) {
  return <NarrativeOutputTesterNode {...props} />;
}
