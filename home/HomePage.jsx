import { useState } from "react";
import { FaBell, FaBoxArchive, FaCheck, FaChevronDown, FaChevronUp, FaCopy, FaEllipsisVertical, FaEye, FaEyeSlash, FaFileCirclePlus, FaGlobe, FaLayerGroup, FaRegClock, FaTrash } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { questionTypes } from "../../data/mockData";
import { formatDeadline, getRespondentUrl, getResponsesForItem, getStatusClassName, getVisibilityLabel } from "../../utils/formBuilderUtils";

const actionStatusPriority = { "未回答": 0, "期限切れ": 1, "回答済み": 2 };
const createdStatusPriority = { "下書き": 0, "公開中": 1, "終了": 2 };
const actionStatuses = new Set(["未回答", "回答済み", "期限切れ"]);
const toCreatedStatus = (status) => {
  if (status === "下書き") return "下書き";
  if (status === "公開中") return "公開中";
  return "終了";
};

export function HomePage({ templates, hoveredTemplate, hoveredTemplateId, setHoveredTemplateId, onStartBlank, onStartAi, onStartTemplate, onDuplicateTemplate, onDeleteTemplate, homeTab, setHomeTab, actionItems, createdForms, onOpenCreated, onShareCreated, onOpenResponses, onOpenVersions, onOpenPublish, onTogglePublishState, onToggleVisibility, onOpenRecipients, onOpenNotifications, onOpenReview, onDuplicate, onAddTemplate, onArchive, onDelete, currentRole }) {
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false);
  const actionTabItems = actionItems
    .filter((item) => actionStatuses.has(item.status))
    .sort((a, b) => {
      const aRank = actionStatusPriority[a.status] ?? 9;
      const bRank = actionStatusPriority[b.status] ?? 9;
      if (aRank !== bRank) return aRank - bRank;
      return String(a.due || "9999/12/31").localeCompare(String(b.due || "9999/12/31"));
    });
  const createdTabItems = [...createdForms].sort((a, b) => {
    const aStatus = toCreatedStatus(a.status);
    const bStatus = toCreatedStatus(b.status);
    const aRank = createdStatusPriority[aStatus] ?? 9;
    const bRank = createdStatusPriority[bStatus] ?? 9;
    if (aRank !== bRank) return aRank - bRank;
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
  const actionTabCount = actionTabItems.filter((item) => item.status === "未回答").length;
  const createdTabCount = createdTabItems.filter((item) => item.status === "下書き").length;

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <section className="space-y-4">
        <Card>
          <CardContent className="p-5 md:p-6">
            <h2 className="text-2xl font-bold text-slate-900">新規フォーム作成</h2>
            <p className="mt-2 text-sm text-slate-500">作成手段を選んで開始します。</p>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="flex h-full flex-col justify-between rounded-xl border bg-white p-5 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-900"><FaFileCirclePlus className="text-purple-600" />空のフォーム</div>
                  <p className="mt-2 text-sm text-slate-500">ゼロから質問を組み立てます。</p>
                </div>
                <Button className="mt-5 gap-2 bg-purple-600 hover:bg-purple-700" onClick={onStartBlank}><FaFileCirclePlus />空のフォームを作成</Button>
              </div>

              <div className="flex h-full flex-col justify-between rounded-xl border bg-slate-50 p-5 shadow-sm">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-900"><FaLayerGroup className="text-purple-600" />AIで作成</div>
                  <p className="mt-2 text-sm text-slate-500">要件を入力すると Gemini からフォームJSONを生成します。</p>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700" onClick={onStartAi}>AIでフォームを作成</Button>
                  <Button type="button" variant="outline" className="shrink-0" aria-label={templatePanelOpen ? "テンプレートを非表示" : "テンプレートを表示"} onClick={() => setTemplatePanelOpen((open) => !open)}>
                    {templatePanelOpen ? <FaChevronUp /> : <FaChevronDown />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {templatePanelOpen && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FaLayerGroup />テンプレートから作成</CardTitle></CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                {templates.map((template) => {
                  const Icon = template.icon;
                  const active = hoveredTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      className={`rounded-xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${active ? "border-purple-400 ring-2 ring-purple-100" : "border-slate-200"}`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="rounded-lg bg-purple-50 p-3 text-purple-600"><Icon /></div>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            type="button"
                            aria-label={`${template.title}のテンプレート操作`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                          >
                            <FaEllipsisVertical />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onDuplicateTemplate(template)}><FaCopy />複製</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDeleteTemplate(template)}><FaTrash />削除</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <button type="button" onClick={() => setHoveredTemplateId(template.id)} className="w-full text-left">
                        <div className="font-semibold text-slate-900">{template.title}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{template.description}</p>
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <TemplatePreview template={hoveredTemplate} onStartTemplate={onStartTemplate} />
          </div>
        )}
      </section>

      <section id="home-tab-section" className="space-y-4">
        <div className="flex gap-2 border-b">
          <TabButton active={homeTab === "actions"} count={actionTabCount} onClick={() => setHomeTab("actions")}>アンケート回答</TabButton>
          <TabButton active={homeTab === "created"} count={createdTabCount} onClick={() => setHomeTab("created")}>アンケート管理</TabButton>
        </div>
        {homeTab === "actions" && <ActionList items={actionTabItems} />}
        {homeTab === "created" && <CreatedList items={createdTabItems} onOpen={onOpenCreated} onShare={onShareCreated} onResponses={onOpenResponses} onVersions={onOpenVersions} onToggleVisibility={onToggleVisibility} onRecipients={onOpenRecipients} onNotifications={onOpenNotifications} onReview={onOpenReview} onDuplicate={onDuplicate} onAddTemplate={onAddTemplate} onArchive={onArchive} onDelete={onDelete} currentRole={currentRole} />}
      </section>
    </main>
  );
}

export function TemplatePreview({ template, onStartTemplate }) {
  const requiredCount = template.questions.filter((question) => question.required).length;
  const questionTypeCount = new Set(template.questions.map((question) => question.type)).size;

  return (
    <Card className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg">テンプレートプレビュー</CardTitle>
        <p className="text-sm text-slate-500">{template.title}</p>
        <Button className="mt-2 w-full bg-purple-600 hover:bg-purple-700" onClick={() => onStartTemplate(template)}>テンプレートを適用</Button>
      </CardHeader>
      <CardContent className="max-h-[70vh] space-y-3 overflow-y-auto pr-3 lg:max-h-[calc(100vh-14rem)]">
        <div className="rounded-xl border-t-8 border-t-purple-600 bg-white p-4 shadow-sm">
          <div className="text-xl font-bold">{template.title}</div>
          <p className="mt-2 text-sm text-slate-500">{template.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2"><div className="font-semibold text-slate-900">{template.questions.length}</div><div className="text-slate-500">質問</div></div>
            <div className="rounded-lg bg-slate-50 p-2"><div className="font-semibold text-slate-900">{requiredCount}</div><div className="text-slate-500">必須</div></div>
            <div className="rounded-lg bg-slate-50 p-2"><div className="font-semibold text-slate-900">{questionTypeCount}</div><div className="text-slate-500">形式</div></div>
          </div>
        </div>
        {template.questions.map((question) => (
          <div key={question.title} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="font-medium">{question.title}{question.required && <span className="ml-1 text-red-500">*</span>}</div>
            <p className="mt-1 text-xs text-slate-500">{questionTypes.find((type) => type.value === question.type)?.label}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TabButton({ active, count, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`relative px-4 py-3 text-sm font-medium ${active ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>
      {children}
      {typeof count === "number" && <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-purple-600 text-white" : "bg-slate-200 text-slate-600"}`}>{count}</span>}
    </button>
  );
}

export function ActionList({ items }) {
  const [showAnsweredItems, setShowAnsweredItems] = useState(false);
  const [removedExpiredItemIds, setRemovedExpiredItemIds] = useState([]);
  const visibleItems = items
    .filter((item) => showAnsweredItems || item.status !== "回答済み")
    .filter((item) => !removedExpiredItemIds.includes(item.id));

  const removeExpiredItem = (itemId) => {
    setRemovedExpiredItemIds((current) => current.includes(itemId) ? current : [...current, itemId]);
  };

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-end">
        <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
          <input
            type="checkbox"
            checked={showAnsweredItems}
            onChange={(event) => setShowAnsweredItems(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
          <span>回答済みアンケートを表示</span>
        </label>
      </div>
      {visibleItems.map((item) => (
        <Card key={item.id}>
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <FaBell className="text-purple-600" />
                <h3 className="font-semibold">{item.title}</h3>
                <span className={`rounded-full px-2 py-1 text-xs ${item.status === "未回答" ? "bg-red-50 text-red-600" : item.status === "期限切れ" ? "bg-amber-50 text-amber-700" : getStatusClassName("終了")}`}>{item.status}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                <span><FaRegClock className="mr-1 inline" />回答期限: {item.due}</span>
              </div>
            </div>
            {item.status === "期限切れ" ? (
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={() => removeExpiredItem(item.id)}
              >
                削除
              </Button>
            ) : (
              <a
                className={`inline-flex h-9 shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium transition ${item.status === "回答済み" ? "border bg-white text-slate-700 hover:bg-slate-50" : "text-white bg-purple-600 hover:bg-purple-700"}`}
                href={item.status === "回答済み" ? `${getRespondentUrl(item)}?mode=review` : getRespondentUrl(item)}
                target="_blank"
                rel="noreferrer"
              >
                {item.status === "回答済み" ? "確認" : "回答"}
              </a>
            )}
          </CardContent>
        </Card>
      ))}
      {visibleItems.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-slate-500">表示できるアンケートはありません。</CardContent></Card>}
    </div>
  );
}

export function CreatedList({ items, onOpen, onShare, onResponses, onVersions, onToggleVisibility, onRecipients, onNotifications, onReview, onDuplicate, onAddTemplate, onArchive, onDelete, currentRole }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const filteredItems = items
    .filter((item) => {
      const displayStatus = toCreatedStatus(item.status);
      return statusFilter === "all" || displayStatus === statusFilter;
    })
    .filter((item) => {
      return item.title.toLowerCase().includes(query.toLowerCase());
    });
  const statusOptions = ["all", "下書き", "公開中", "終了"];

  return (
    <div className="grid gap-3">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="フォーム名で検索" />
          <select className="h-9 rounded-md border bg-white px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "すべての状態" : status}</option>)}
          </select>
        </CardContent>
      </Card>
      {filteredItems.map((item) => {
        const displayStatus = toCreatedStatus(item.status);
        return (
        <Card key={item.id}>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <FaCheck className="text-green-600" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(displayStatus)}`}>{displayStatus}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span><FaRegClock className="mr-1 inline" />更新: {item.updatedAt}</span>
                  <span>回答数: {getResponsesForItem(item).length}</span>
                  <span><FaGlobe className="mr-1 inline" />{getVisibilityLabel(item.visibility)}</span>
                  <span>期限: {formatDeadline(item.deadline)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {displayStatus === "下書き" && <Button className="bg-purple-600 hover:bg-purple-700" disabled={!currentRole.canEdit} onClick={() => onOpen(item, "edit")}>編集</Button>}
                {displayStatus !== "下書き" && <Button variant="outline" onClick={() => onResponses(item)}>集計</Button>}
                {displayStatus === "公開中" && <Button variant="outline" onClick={() => onShare(item)}>共有</Button>}
                <DropdownMenu>
                  <DropdownMenuTrigger aria-label={`${item.title}のその他操作`} className="inline-flex h-9 items-center justify-center rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
                    <FaEllipsisVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem disabled={!currentRole.canPublish} onClick={() => onToggleVisibility(item)}>{displayStatus === "公開中" ? <><FaEyeSlash />終了する</> : <><FaEye />公開する</>}</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(item)}><FaCopy />複製</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddTemplate(item)}><FaBoxArchive />テンプレートに追加</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(item)}><FaTrash />削除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
      {filteredItems.length === 0 && <Card><CardContent className="p-6 text-center text-sm text-slate-500">条件に一致するフォームはありません。</CardContent></Card>}
    </div>
  );
}
