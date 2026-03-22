import React from "react";
import { Handle, Position, NodeShell, handleStyle } from "./comfyNodeShared";
import {
  NARRATIVE_SOURCE_OPTIONS,
  NARRATIVE_CONTENT_TYPE_OPTIONS,
  NARRATIVE_MODE_OPTIONS,
  NARRATIVE_STYLE_OPTIONS,
  NARRATIVE_RESULT_TABS,
} from "./comfyNarrativeDomain";

const OUTPUT_HANDLES = [
  { id: "scenario_out", labelRu: "Сценарий" },
  { id: "voice_script_out", labelRu: "Озвучка" },
  { id: "brain_package_out", labelRu: "Для мозга" },
  { id: "bg_music_prompt_out", labelRu: "Музыка" },
];

function renderBrainPackage(brainPackage) {
  if (!brainPackage) {
    return <div className="clipSB_small">Нажмите «СОЗДАТЬ СЦЕНАРИЙ», чтобы собрать пакет для мозга.</div>;
  }

  const entities = Array.isArray(brainPackage.entities) ? brainPackage.entities : [];
  const sceneLogic = Array.isArray(brainPackage.sceneLogic) ? brainPackage.sceneLogic : [];

  return (
    <div className="clipSB_narrativeReadable">
      <div><strong>Тип контента:</strong> {brainPackage.contentTypeLabel}</div>
      <div><strong>Стиль:</strong> {brainPackage.styleLabel}</div>
      <div><strong>Главный источник:</strong> {brainPackage.sourceLabel}</div>
      <div><strong>Сущности:</strong> {entities.join(", ") || "—"}</div>
      <div>
        <strong>Логика сцен:</strong>
        <ol>
          {sceneLogic.map((item) => <li key={item}>{item}</li>)}
        </ol>
      </div>
      <div><strong>Аудио стратегия:</strong> {brainPackage.audioStrategy}</div>
      <div><strong>Режиссёрская задача:</strong> {brainPackage.directorNote}</div>
    </div>
  );
}

export default function ComfyNarrativeNode({ id, data }) {
  const sourceMode = data?.sourceMode || "TEXT";
  const activeResultTab = data?.activeResultTab || "scenario";
  const outputs = data?.outputs || {};

  const sourceInput = sourceMode === "TEXT"
    ? (
      <div className="clipSB_narrativeField">
        <div className="clipSB_brainLabel">Описание / история</div>
        <textarea
          className="clipSB_textarea clipSB_narrativeTextarea"
          value={data?.textInput || ""}
          onChange={(e) => data?.onFieldChange?.(id, { textInput: e.target.value })}
          placeholder="Опишите историю, идею ролика или полный текст основы"
          rows={7}
        />
      </div>
    )
    : sourceMode === "AUDIO"
      ? (
        <div className="clipSB_narrativeField">
          <div className="clipSB_brainLabel">Аудио</div>
          <textarea
            className="clipSB_textarea clipSB_narrativeTextarea"
            value={data?.audioInput || ""}
            onChange={(e) => data?.onFieldChange?.(id, { audioInput: e.target.value })}
            placeholder="Пока placeholder: заметка об аудио, тексте речи или описании трека"
            rows={4}
          />
          <div className="clipSB_selectHint">Здесь пока простой placeholder без загрузки файла.</div>
        </div>
      )
      : (
        <div className="clipSB_narrativeField">
          <div className="clipSB_brainLabel">Ссылка на видео</div>
          <input
            className="clipSB_input"
            value={data?.videoUrlInput || ""}
            onChange={(e) => data?.onFieldChange?.(id, { videoUrlInput: e.target.value })}
            placeholder="https://..."
          />
        </div>
      );

  return (
    <>
      {OUTPUT_HANDLES.map((item, index) => (
        <Handle
          key={item.id}
          type="source"
          position={Position.Right}
          id={item.id}
          className="clipSB_handle"
          style={handleStyle("text", { top: 92 + index * 34 })}
        />
      ))}
      <NodeShell
        title="СЦЕНАРИЙ"
        icon={<span aria-hidden>📚</span>}
        onClose={() => data?.onRemoveNode?.(id)}
        className="clipSB_nodeNarrative"
      >
        <div className="clipSB_narrativeSubtitle">Создание истории и логики сцен</div>

        <div className="clipSB_narrativePorts">
          {OUTPUT_HANDLES.map((item) => (
            <div key={item.id} className="clipSB_narrativePortLabel">{item.labelRu}</div>
          ))}
        </div>

        <section className="clipSB_narrativeSection">
          <div className="clipSB_brainLabel">Источник</div>
          <div className="clipSB_narrativeSegmented">
            {NARRATIVE_SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`clipSB_narrativeChip ${sourceMode === option.value ? "isActive" : ""}`.trim()}
                onClick={() => data?.onFieldChange?.(id, { sourceMode: option.value })}
              >
                {option.labelRu}
              </button>
            ))}
          </div>
        </section>

        <div className="clipSB_narrativeGrid">
          <label className="clipSB_narrativeField">
            <div className="clipSB_brainLabel">Тип видео</div>
            <select className="clipSB_select" value={data?.contentType || "story"} onChange={(e) => data?.onFieldChange?.(id, { contentType: e.target.value })}>
              {NARRATIVE_CONTENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.labelRu}</option>)}
            </select>
          </label>

          <label className="clipSB_narrativeField">
            <div className="clipSB_brainLabel">Как обработать</div>
            <select className="clipSB_select" value={data?.narrativeMode || "cinematic_expand"} onChange={(e) => data?.onFieldChange?.(id, { narrativeMode: e.target.value })}>
              {NARRATIVE_MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.labelRu}</option>)}
            </select>
          </label>

          <label className="clipSB_narrativeField">
            <div className="clipSB_brainLabel">Стиль</div>
            <select className="clipSB_select" value={data?.styleProfile || "realistic"} onChange={(e) => data?.onFieldChange?.(id, { styleProfile: e.target.value })}>
              {NARRATIVE_STYLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.labelRu}</option>)}
            </select>
          </label>
        </div>

        <label className="clipSB_narrativeField">
          <div className="clipSB_brainLabel">Что изменить / добавить</div>
          <textarea
            className="clipSB_textarea clipSB_narrativeTextarea clipSB_narrativeTextarea--compact"
            value={data?.directorNote || ""}
            onChange={(e) => data?.onFieldChange?.(id, { directorNote: e.target.value })}
            placeholder="Например: добавь экшена, сделай мрачнее, усиль конфликт"
            rows={3}
          />
        </label>

        {sourceInput}

        <div className="clipSB_narrativeActions">
          <button className="clipSB_btn clipSB_narrativeGenerate" onClick={() => data?.onGenerate?.(id)}>
            СОЗДАТЬ СЦЕНАРИЙ
          </button>
        </div>

        <section className="clipSB_narrativeResultSection">
          <div className="clipSB_narrativeTabs">
            {NARRATIVE_RESULT_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`clipSB_narrativeTab ${activeResultTab === tab.value ? "isActive" : ""}`.trim()}
                onClick={() => data?.onFieldChange?.(id, { activeResultTab: tab.value })}
              >
                {tab.labelRu}
              </button>
            ))}
          </div>

          <div className="clipSB_narrativeResultBody">
            {activeResultTab === "scenario" ? <pre>{outputs.scenario || "Пока нет сценария. Заполните поля и нажмите кнопку."}</pre> : null}
            {activeResultTab === "voice" ? <pre>{outputs.voiceScript || "Здесь появится текст для диктора и диалоги."}</pre> : null}
            {activeResultTab === "brain" ? renderBrainPackage(outputs.brainPackage) : null}
            {activeResultTab === "music" ? <pre>{outputs.bgMusicPrompt || "Здесь появится prompt только для фоновой музыки."}</pre> : null}
          </div>
        </section>
      </NodeShell>
    </>
  );
}
