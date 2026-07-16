import { useMemo, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaArrowDown, FaArrowUp, FaBolt, FaCheck, FaCopy, FaGripVertical, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { questionTypes } from "../../data/mockData";
import { normalizeQuestion, questionHasOptions } from "../../utils/formBuilderUtils";

const collaboratorOptions = [
  { id: "user-yamada", label: "山田 花子", type: "メンバー" },
  { id: "user-sato", label: "佐藤 健", type: "メンバー" },
  { id: "user-suzuki", label: "鈴木 美咲", type: "メンバー" },
  { id: "org-sales", label: "営業本部", type: "組織" },
  { id: "org-dev", label: "開発本部", type: "組織" },
  { id: "org-hr", label: "人事本部", type: "組織" },
];

export function SortableQuestion(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.question.id });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={isDragging ? "relative z-10 opacity-80" : ""}><QuestionCard {...props} attributes={attributes} listeners={listeners} isDragging={isDragging} /></div>;
}

export function EditPage({ form, setForm, isDirty, saveNotice, sensors, onDragEnd, updateQuestion, addQuestion, deleteQuestion, duplicateQuestion, moveQuestion, changeType, updateOption, addOption, deleteOption }) {
  const [activeTab, setActiveTab] = useState("builder");
  const [collaboratorSearch, setCollaboratorSearch] = useState("");
  const noticeIsWarning = saveNotice?.startsWith("公開前チェック未完了") || saveNotice?.includes("権限") || saveNotice?.includes("ありません");
  const creatorName = form.settings?.creatorName || "〇〇さん";
  const selectedCollaboratorIds = useMemo(() => {
    const value = form.settings?.collaboratorIds;
    return Array.isArray(value) ? value : collaboratorOptions.slice(0, 2).map((option) => option.id);
  }, [form.settings?.collaboratorIds]);
  const filteredCollaboratorOptions = collaboratorOptions.filter((option) => option.label.toLowerCase().includes(collaboratorSearch.toLowerCase()));
  const selectedCollaborators = collaboratorOptions.filter((option) => selectedCollaboratorIds.includes(option.id));

  const toggleCollaborator = (targetId) => {
    const nextIds = selectedCollaboratorIds.includes(targetId)
      ? selectedCollaboratorIds.filter((id) => id !== targetId)
      : [...selectedCollaboratorIds, targetId];
    setForm({
      ...form,
      settings: {
        ...form.settings,
        collaboratorIds: nextIds,
      },
    });
  };

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
      <div className="flex min-h-5 flex-wrap items-center justify-end gap-3 px-1 text-xs text-slate-500">
        {noticeIsWarning ? <span className="text-amber-700">{saveNotice}</span> : <span>{isDirty ? "自動保存中です。" : "このフォームは自動保存されています。"}</span>}
      </div>
      <section className="space-y-4">
        <div className="flex gap-2 border-b">
          <button type="button" onClick={() => setActiveTab("builder")} className={`px-4 py-3 text-sm font-medium ${activeTab === "builder" ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>フォーム作成</button>
          <button type="button" onClick={() => setActiveTab("collaborator")} className={`px-4 py-3 text-sm font-medium ${activeTab === "collaborator" ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>共同編集設定</button>
        </div>

        {activeTab === "builder" && (
          <>
            <Card className="border-t-8 border-t-purple-600">
              <CardHeader><CardTitle className="text-2xl">フォーム作成</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input className="text-xl font-semibold" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
                <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </CardContent>
            </Card>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={form.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {form.questions.map((question, index) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      updateQuestion={updateQuestion}
                      deleteQuestion={deleteQuestion}
                      changeType={changeType}
                      updateOption={updateOption}
                      addOption={addOption}
                      deleteOption={deleteOption}
                      duplicateQuestion={duplicateQuestion}
                      moveQuestion={moveQuestion}
                      totalQuestions={form.questions.length}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="flex justify-center pb-12"><Button onClick={addQuestion} className="gap-2 bg-purple-600 hover:bg-purple-700"><FaPlus />質問を追加</Button></div>
          </>
        )}

        {activeTab === "collaborator" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">共同編集設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="text-sm font-medium text-purple-900">アンケート作成者</div>
                <div className="mt-2 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="font-semibold text-slate-900">{creatorName}</span>
                    <span className="ml-2 text-xs text-slate-500">作成者</span>
                  </div>
                  <div className="text-xs text-purple-700">固定メンバー（共同編集者設定では変更不可）</div>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-4">
                <div className="font-medium text-slate-900">共同編集者</div>
                <p className="mt-1 text-sm text-slate-500">公開設定・権限ポップアップにあった共同編集者設定をここで管理します。アンケート作成者はこの一覧とは別に管理されます。</p>
                <div className="mt-3 space-y-3">
                  <Input value={collaboratorSearch} onChange={(event) => setCollaboratorSearch(event.target.value)} placeholder="氏名・組織名で検索" />
                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border bg-white p-2">
                    {filteredCollaboratorOptions.map((option) => (
                      <label key={option.id} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-slate-50">
                        <span className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedCollaboratorIds.includes(option.id)}
                            onChange={() => toggleCollaborator(option.id)}
                          />
                          <span>{option.label}</span>
                        </span>
                        <span className="text-xs text-slate-400">{option.type}</span>
                      </label>
                    ))}
                    {filteredCollaboratorOptions.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">候補が見つかりません。</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-slate-700">選択中の共同編集者</div>
                {selectedCollaborators.length === 0 ? (
                  <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">共同編集者が選択されていません。</div>
                ) : (
                  selectedCollaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex flex-col gap-1 rounded-md bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <div><span className="font-medium text-slate-900">{collaborator.label}</span><span className="ml-2 text-xs text-slate-500">{collaborator.type}</span></div>
                      <div className="text-xs text-slate-500">編集権限あり</div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

export function QuestionCard({ question: rawQuestion, index, updateQuestion, deleteQuestion, duplicateQuestion, moveQuestion, changeType, updateOption, addOption, deleteOption, totalQuestions, attributes, listeners, isDragging }) {
  const question = normalizeQuestion(rawQuestion);
  const [aiAction, setAiAction] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const hasOptions = questionHasOptions(question.type);
  const questionTypeLabel = questionTypes.find((type) => type.value === question.type)?.label ?? "記述式";

  const moveOption = (optionIndex, direction) => {
    const nextIndex = direction === "up" ? optionIndex - 1 : optionIndex + 1;
    if (nextIndex < 0 || nextIndex >= question.options.length) return;
    const nextOptions = [...question.options];
    [nextOptions[optionIndex], nextOptions[nextIndex]] = [nextOptions[nextIndex], nextOptions[optionIndex]];
    updateQuestion(question.id, { options: nextOptions });
  };

  const improveWithAi = async (instruction) => {
    setAiAction(instruction);
    setAiError("");
    setAiSuggestion(null);
    try {
      const response = await fetch("/api/form-builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${instruction}。質問は1件のままにし、この質問だけを改善してください。`,
          currentForm: {
            version: 1,
            title: "質問の改善",
            description: "",
            settings: {},
            sections: [{ title: "質問", description: "" }],
            questions: [{ ...question, id: undefined, sectionId: undefined, section: "質問" }],
          },
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "AI改善に失敗しました。");
      const nextQuestion = result?.form?.questions?.[0];
      if (!nextQuestion) throw new Error("改善案を取得できませんでした。");
      setAiSuggestion(normalizeQuestion({ ...nextQuestion, id: question.id, sectionId: question.sectionId }));
    } catch (error) {
      setAiError(error.message);
    } finally {
      setAiAction("");
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    updateQuestion(question.id, aiSuggestion);
    setAiSuggestion(null);
  };

  return (
    <Card className={`border-l-4 border-l-purple-500 ${isDragging ? "shadow-2xl ring-2 ring-purple-300" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <button aria-label={`質問${index + 1}をドラッグして並べ替え`} className="cursor-grab rounded p-2 text-slate-400 hover:bg-slate-100" {...attributes} {...listeners}><FaGripVertical /></button>
          <div>
            <CardTitle className="text-base text-slate-500">質問 {index + 1}</CardTitle>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button aria-label={`質問${index + 1}を上へ移動`} variant="ghost" size="icon" disabled={index === 0} onClick={() => moveQuestion(question.id, "up")}><FaArrowUp /></Button>
          <Button aria-label={`質問${index + 1}を下へ移動`} variant="ghost" size="icon" disabled={index >= totalQuestions - 1} onClick={() => moveQuestion(question.id, "down")}><FaArrowDown /></Button>
          <Button aria-label={`質問${index + 1}を複製`} variant="ghost" size="icon" onClick={() => duplicateQuestion(question.id)}><FaCopy /></Button>
          <Button aria-label={`質問${index + 1}を削除`} variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}><FaTrash /></Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-purple-100 bg-purple-50 p-3">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-purple-800"><FaBolt />AIで改善</span>
          {["短く分かりやすくする", "選択肢を改善する", "回答しやすくする"].map((instruction) => (
            <Button key={instruction} type="button" size="sm" variant="outline" disabled={Boolean(aiAction)} onClick={() => improveWithAi(instruction)}>
              {aiAction === instruction ? "改善中…" : instruction}
            </Button>
          ))}
        </div>
        {aiError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{aiError}</div>}
        {aiSuggestion && (
          <div className="rounded-lg border border-purple-200 bg-white p-4 text-sm">
            <div className="font-semibold text-purple-800">AIの改善案</div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">現在</div><div className="mt-1 font-medium">{question.title}</div></div>
              <div className="rounded-md bg-purple-50 p-3"><div className="text-xs text-purple-600">改善後</div><div className="mt-1 font-medium">{aiSuggestion.title}</div></div>
            </div>
            {questionHasOptions(aiSuggestion.type) && <p className="mt-2 text-xs text-slate-600">選択肢: {aiSuggestion.options.join(" / ")}</p>}
            <div className="mt-3 flex gap-2"><Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={applyAiSuggestion}><FaCheck className="mr-1" />採用</Button><Button size="sm" variant="outline" onClick={() => setAiSuggestion(null)}><FaXmark className="mr-1" />破棄</Button></div>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <Input value={question.title} onChange={(event) => updateQuestion(question.id, { title: event.target.value })} />
          <Select value={question.type} onValueChange={(value) => changeType(question.id, value)}>
            <SelectTrigger><SelectValue>{questionTypeLabel}</SelectValue></SelectTrigger>
            <SelectContent>{questionTypes.map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Input value={question.description} onChange={(event) => updateQuestion(question.id, { description: event.target.value })} placeholder="説明文（任意）" />
        </div>

        {hasOptions && (
          <div className="space-y-2">
            {question.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center gap-2">
                <span className="w-6 text-center text-sm text-slate-500">{question.type === "checkbox" ? "□" : question.type === "radio" ? "○" : optionIndex + 1}</span>
                <Input value={option} onChange={(event) => updateOption(question.id, optionIndex, event.target.value)} />
                <Button aria-label={`選択肢${optionIndex + 1}を上へ移動`} variant="ghost" size="icon" disabled={optionIndex === 0} onClick={() => moveOption(optionIndex, "up")}><FaArrowUp /></Button>
                <Button aria-label={`選択肢${optionIndex + 1}を下へ移動`} variant="ghost" size="icon" disabled={optionIndex >= question.options.length - 1} onClick={() => moveOption(optionIndex, "down")}><FaArrowDown /></Button>
                <Button aria-label={`選択肢${optionIndex + 1}を削除`} variant="ghost" size="icon" disabled={question.options.length <= 1} onClick={() => deleteOption(question.id, optionIndex)}><FaTrash /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>選択肢追加</Button>
            <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={question.allowOther} onChange={(event) => updateQuestion(question.id, { allowOther: event.target.checked })} />「その他」を追加</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={question.randomizeOptions} onChange={(event) => updateQuestion(question.id, { randomizeOptions: event.target.checked })} />選択肢をランダム表示</label>
            </div>
          </div>
        )}

        {question.type === "file" && (
          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 md:grid-cols-[1fr_160px]">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">許可するファイル種別</label>
              <Input value={question.fileTypes.join(", ")} onChange={(event) => updateQuestion(question.id, { fileTypes: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500">最大ファイル数</label>
              <Input type="number" min="1" value={question.maxFiles} onChange={(event) => updateQuestion(question.id, { maxFiles: Number(event.target.value) })} />
            </div>
          </div>
        )}

        <div className="flex justify-end border-t pt-3">
          <button
            type="button"
            role="switch"
            aria-checked={question.required}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            onClick={() => updateQuestion(question.id, { required: !question.required })}>
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${question.required ? "bg-purple-600" : "bg-slate-300"}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${question.required ? "translate-x-5" : "translate-x-0.5"}`} />
            </span>
            必須
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
