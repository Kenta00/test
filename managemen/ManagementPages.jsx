import { useState } from "react";
import { FaCalendarDays, FaGear, FaGlobe } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  sampleHeaderImageUrl,
  stateScenarios,
  visibilityOptions,
} from "../../data/mockData";
import {
  formatDeadline,
  getAuditLogs,
  getNotificationRulesForItem,
  getPublishChecklistForForm,
  getPublishReviewSummary,
  getRecipientCounts,
  getRecipientsForItem,
  getRespondentUrl,
  getResponsesForItem,
  getVersionsForItem,
  getVisibilityLabel,
  createFormFromActionItem,
  createDefaultSettings,
  saveNotificationRules,
  toDeadlineInputValue,
} from "../../utils/formBuilderUtils";

const targetOptions = [
  { id: "scope-link", label: "リンクを知っている人", type: "公開" },
  { id: "org-sales", label: "営業本部", type: "組織" },
  { id: "org-dev", label: "開発本部", type: "組織" },
  { id: "org-hr", label: "人事本部", type: "組織" },
  { id: "user-yamada", label: "山田 花子", type: "人" },
  { id: "user-sato", label: "佐藤 健", type: "人" },
  { id: "user-suzuki", label: "鈴木 美咲", type: "人" },
];

const audienceTargetOptions = targetOptions;

function getAudienceLabel(selectedIds = []) {
  const labels = audienceTargetOptions
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => option.label);
  return labels.length > 0 ? labels.join(" / ") : "公開先を選択";
}

export function FormSettingsDialog({ open, onOpenChange, settings, onChange }) {
  const selectedVisibility = visibilityOptions.find((option) => option.value === settings.visibility) ?? visibilityOptions[1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><FaGear />フォーム設定</DialogTitle>
          <DialogDescription>公開範囲と見た目を設定できます。</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><FaGlobe className="text-purple-600" />公開範囲</label>
            <Select value={settings.visibility} onValueChange={(value) => onChange({ visibility: value })}>
              <SelectTrigger className="w-full"><SelectValue>{getVisibilityLabel(settings.visibility)}</SelectValue></SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">{selectedVisibility.description}</p>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><FaCalendarDays className="text-purple-600" />公開期限</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input type="datetime-local" value={settings.deadline} onChange={(event) => onChange({ deadline: event.target.value })} />
              <Button type="button" variant="outline" onClick={() => onChange({ deadline: "" })}>期限なし</Button>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border bg-white p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={settings.acceptingResponses} onChange={(event) => onChange({ acceptingResponses: event.target.checked })} />
              回答を受け付ける
            </label>
            <p className="text-xs text-slate-500">オフにすると、回答者には受付停止画面を表示します。</p>
          </div>

          <div className="space-y-2 border-t pt-5">
            <label className="text-sm font-medium text-slate-700">ヘッダー画像</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={settings.headerImageUrl} onChange={(event) => onChange({ headerImageUrl: event.target.value })} placeholder="画像URLを入力" />
              <Button type="button" variant="outline" onClick={() => onChange({ headerImageUrl: sampleHeaderImageUrl })}>サンプル</Button>
              <Button type="button" variant="outline" onClick={() => onChange({ headerImageUrl: "" })}>削除</Button>
            </div>
            {settings.headerImageUrl && <img className="h-28 w-full rounded-md object-cover" src={settings.headerImageUrl} alt="ヘッダー画像プレビュー" referrerPolicy="no-referrer" />}
          </div>

          <div className="grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">公開範囲</div>
              <div className="mt-1 font-medium text-slate-800">{getVisibilityLabel(settings.visibility)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">公開期限</div>
              <div className="mt-1 font-medium text-slate-800">{formatDeadline(settings.deadline)}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">回答受付</div>
              <div className="mt-1 font-medium text-slate-800">{settings.acceptingResponses ? "受付中" : "停止中"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">ヘッダー画像</div>
              <div className="mt-1 font-medium text-slate-800">{settings.headerImageUrl ? "設定あり" : "未設定"}</div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-slate-400">送信完了メッセージ</div>
              <div className="mt-1 font-medium text-slate-800">固定表示（ご回答ありがとうございました）</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpenChange(false)}>完了</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShareLinkDialog({ item, onOpenChange }) {
  const shareUrl = item ? getRespondentUrl(item) : "";

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>フォーム共有</DialogTitle>
          <DialogDescription>回答者に渡すリンクを確認できます。</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{item.title}</div>
              <p className="mt-1 text-sm text-slate-500">公開範囲: {getVisibilityLabel(item.visibility)} / 期限: {formatDeadline(item.deadline ?? toDeadlineInputValue(item.due))}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">回答リンク</label>
              <Input readOnly value={shareUrl} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => navigator.clipboard?.writeText(shareUrl)}>コピー</Button>
          <a className="inline-flex h-9 items-center justify-center rounded-md bg-purple-600 px-3 text-sm font-medium text-white transition hover:bg-purple-700" href={shareUrl} target="_blank" rel="noreferrer">回答画面の表示</a>
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ResponseDashboardPage({ item, onBack }) {
  const responses = getResponsesForItem(item);
  const dashboardForm = createFormFromActionItem(item);
  const questions = Array.isArray(dashboardForm.questions) ? dashboardForm.questions : [];
  const recipients = getRecipientsForItem(item);
  const recipientCounts = getRecipientCounts(recipients);
  const unansweredRecipients = recipients.filter((recipient) => ["未回答", "リマインド済み", "未送信"].includes(recipient.status));
  const headquartersStats = Object.values(recipients.reduce((current, recipient) => {
    const headquarters = recipient.department === "配布リスト"
      ? "配布リスト"
      : recipient.department?.endsWith("部")
        ? `${recipient.department.slice(0, -1)}本部`
        : (recipient.department || "未設定");
    const previous = current[headquarters] ?? { headquarters, total: 0, answered: 0 };
    return {
      ...current,
      [headquarters]: {
        headquarters,
        total: previous.total + 1,
        answered: previous.answered + (recipient.status === "回答済み" ? 1 : 0),
      },
    };
  }, {})).map((stat) => ({
    ...stat,
    rate: stat.total > 0 ? Math.round((stat.answered / stat.total) * 100) : 0,
  })).sort((a, b) => b.rate - a.rate || a.headquarters.localeCompare(b.headquarters, "ja"));
  const responseRate = recipientCounts.total > 0 ? Math.round((recipientCounts.answered / recipientCounts.total) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>作成済み一覧</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">集計</h2>
          <p className="text-sm text-slate-500">{item.title}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="回答者/対象者" value={`${recipientCounts.answered}/${recipientCounts.total}`} />
        <MetricCard label="回答率" value={`${responseRate}%`} />
        <MetricCard label="公開範囲" value={getVisibilityLabel(item.visibility)} />
        <MetricCard label="回答期限" value={formatDeadline(item.deadline)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">未回答者一覧</CardTitle>
            <p className="text-sm text-slate-500">未回答・リマインド済み・未送信の対象者を表示します。</p>
          </CardHeader>
          <CardContent>
            {unansweredRecipients.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">未回答者はいません。</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b text-xs text-slate-500">
                    <tr>
                      <th className="px-3 py-2">氏名/グループ</th>
                      <th className="px-3 py-2">メール</th>
                      <th className="px-3 py-2">部署</th>
                      <th className="px-3 py-2">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unansweredRecipients.map((recipient) => (
                      <tr key={`${recipient.email}-${recipient.name}`} className="border-b">
                        <td className="px-3 py-3 font-medium text-slate-800">{recipient.name}</td>
                        <td className="px-3 py-3 text-slate-600">{recipient.email}</td>
                        <td className="px-3 py-3 text-slate-600">{recipient.department}</td>
                        <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(recipient.status)}`}>{recipient.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">本部別回答率</CardTitle>
            <p className="text-sm text-slate-500">本部ごとの回答済み比率を確認できます。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {headquartersStats.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">対象者データがありません。</div>
            ) : headquartersStats.map((stat) => (
              <div key={stat.headquarters} className="rounded-lg border bg-white p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{stat.headquarters}</span>
                  <span className="text-slate-600">{stat.answered}/{stat.total} ({stat.rate}%)</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-purple-600" style={{ width: `${stat.rate}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <ResponseInsightsTabs responses={responses} questions={questions} />
    </main>
  );
}

export function MetricCard({ label, value }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className="mt-2 text-xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}

const choiceQuestionTypes = new Set(["radio", "checkbox", "select", "rating", "consent"]);
const pieColors = ["#7c3aed", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6", "#ec4899"];

function getQuestionAnswers(responses, questionTitle) {
  return responses.map((response) => ({
    respondent: getRespondentDisplayName(response),
    submittedAt: response.submittedAt,
    value: response.answers?.[questionTitle] ?? "-",
  }));
}

function getRespondentDisplayName(response) {
  const answerName = response.answers?.["氏名"] || response.answers?.["申請者名"];
  if (answerName) return answerName;
  return response.respondent || "-";
}

function getChoiceCounts(questionType, answers) {
  const counts = {};
  answers.forEach(({ value }) => {
    if (questionType === "checkbox") {
      const options = String(value || "-")
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean);
      if (options.length === 0) {
        counts["未回答"] = (counts["未回答"] ?? 0) + 1;
        return;
      }
      options.forEach((option) => {
        counts[option] = (counts[option] ?? 0) + 1;
      });
      return;
    }
    const label = value && value !== "-" ? value : "未回答";
    counts[label] = (counts[label] ?? 0) + 1;
  });
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

async function copyPieChartImageToClipboard(segments, chartTitle) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (total <= 0) return;

  const canvas = document.createElement("canvas");
  const width = 900;
  const height = 560;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  context.fillStyle = "#0f172a";
  context.font = "bold 28px sans-serif";
  context.fillText(chartTitle || "回答集計", 40, 56);

  const centerX = 220;
  const centerY = 300;
  const radius = 130;
  let angle = -Math.PI / 2;

  segments.forEach((segment, index) => {
    const ratio = segment.count / total;
    const nextAngle = angle + ratio * Math.PI * 2;
    context.beginPath();
    context.moveTo(centerX, centerY);
    context.arc(centerX, centerY, radius, angle, nextAngle);
    context.closePath();
    context.fillStyle = pieColors[index % pieColors.length];
    context.fill();
    angle = nextAngle;
  });

  context.fillStyle = "#334155";
  context.font = "16px sans-serif";
  context.fillText(`回答数: ${total}件`, 160, 470);

  const legendLeft = 430;
  let legendTop = 130;
  segments.forEach((segment, index) => {
    const ratio = Math.round((segment.count / total) * 100);
    context.fillStyle = pieColors[index % pieColors.length];
    context.fillRect(legendLeft, legendTop - 12, 14, 14);
    context.fillStyle = "#1e293b";
    context.font = "15px sans-serif";
    context.fillText(`${segment.label}  ${segment.count}件 (${ratio}%)`, legendLeft + 24, legendTop);
    legendTop += 34;
  });

  if (!window.ClipboardItem || !navigator.clipboard?.write) return;
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}

function PieChartSummary({ segments, chartTitle }) {
  const total = segments.reduce((sum, segment) => sum + segment.count, 0);
  if (total <= 0) return <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">集計できる回答がありません。</div>;

  const gradient = segments.map((segment, index) => {
    const startCount = segments.slice(0, index).reduce((sum, item) => sum + item.count, 0);
    const start = (startCount / total) * 100;
    const end = ((startCount + segment.count) / total) * 100;
    return `${pieColors[index % pieColors.length]} ${start}% ${end}%`;
  }).join(", ");

  return (
    <button
      type="button"
      className="w-full rounded-lg p-1 text-left transition hover:bg-slate-50"
      title="円グラフ画像をコピー"
      onClick={() => { void copyPieChartImageToClipboard(segments, chartTitle); }}
    >
      <div className="grid gap-4 md:grid-cols-[130px_minmax(0,1fr)] md:items-center">
        <div className="mx-auto h-28 w-28 rounded-full" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="space-y-2">
          {segments.map((segment, index) => {
            const ratio = Math.round((segment.count / total) * 100);
            return (
              <div key={segment.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index % pieColors.length] }} />
                  <span>{segment.label}</span>
                </div>
                <span className="text-slate-500">{segment.count}件 ({ratio}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}

function QuestionSummaryCard({ question, responses }) {
  const answers = getQuestionAnswers(responses, question.title);
  const isChoiceQuestion = choiceQuestionTypes.has(question.type);
  const choiceSegments = isChoiceQuestion ? getChoiceCounts(question.type, answers) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.title}</CardTitle>
        <p className="text-xs text-slate-500">{isChoiceQuestion ? "選択式質問" : "文章入力質問"}</p>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">まだ回答はありません。</div>
        ) : isChoiceQuestion ? (
          <PieChartSummary segments={choiceSegments} chartTitle={`${question.title} 集計`} />
        ) : (
          <div className="space-y-2">
            {answers.map((answer, index) => (
              <div key={`${answer.respondent}-${index}`} className="rounded-lg bg-slate-50 p-3 text-sm">
                <div className="font-medium text-slate-800">{answer.respondent}</div>
                <div className="mt-1 text-slate-600">{answer.value || "-"}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ResponseInsightsTabs({ responses, questions }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedResponseId, setSelectedResponseId] = useState(responses[0]?.id ?? "");

  const selectedResponse = responses.find((response) => response.id === selectedResponseId) ?? responses[0];

  return (
    <section className="space-y-4">
      <div className="flex gap-2 border-b">
        <button type="button" onClick={() => setActiveTab("summary")} className={`px-4 py-3 text-sm font-medium ${activeTab === "summary" ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>要約</button>
        <button type="button" onClick={() => setActiveTab("individual")} className={`px-4 py-3 text-sm font-medium ${activeTab === "individual" ? "border-b-2 border-purple-600 text-purple-700" : "text-slate-500 hover:text-slate-900"}`}>個別</button>
      </div>

      {activeTab === "summary" && (
        <div className="space-y-4">
          {questions.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-sm text-slate-500">質問データがありません。</CardContent></Card>
          ) : questions.map((question) => <QuestionSummaryCard key={question.title} question={question} responses={responses} />)}
        </div>
      )}

      {activeTab === "individual" && (
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.6fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">回答者</CardTitle>
            </CardHeader>
            <CardContent>
              {responses.length === 0 ? (
                <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">まだ回答はありません。</div>
              ) : (
                <div className="space-y-2">
                  {responses.map((response) => (
                    <button key={response.id} type="button" className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${selectedResponse?.id === response.id ? "border-purple-300 bg-purple-50" : "border-slate-200 bg-white hover:bg-slate-50"}`} onClick={() => setSelectedResponseId(response.id)}>
                      <div className="font-medium text-slate-900">{getRespondentDisplayName(response)}</div>
                      <div className="mt-1 text-xs text-slate-500">{response.submittedAt}</div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">回答内容</CardTitle>
              <p className="text-sm text-slate-500">選択した回答者の全回答を表示します。</p>
            </CardHeader>
            <CardContent>
              {selectedResponse ? (
                <div className="space-y-3">
                  {Object.entries(selectedResponse.answers).map(([key, value]) => (
                    <div key={key} className="border-b pb-3">
                      <div className="text-xs font-medium text-slate-500">{key}</div>
                      <div className="mt-1 text-sm text-slate-900">{value || "-"}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">回答者を選択してください。</div>}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

export function RecipientManagementPage({ item, onBack, onOpenNotifications }) {
  const recipients = getRecipientsForItem(item);
  const [filter, setFilter] = useState("all");
  const counts = getRecipientCounts(recipients);
  const filteredRecipients = filter === "all" ? recipients : recipients.filter((recipient) => recipient.status === filter);

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>作成済み一覧</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">回答者管理</h2>
          <p className="text-sm text-slate-500">{item.title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">CSV取り込み</Button>
          <Button variant="outline">対象者を追加</Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpenNotifications(item)}>通知設定</Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard label="対象者" value={`${counts.total}名`} />
        <MetricCard label="回答済み" value={`${counts.answered}名`} />
        <MetricCard label="未回答" value={`${counts.pending}名`} />
        <MetricCard label="公開範囲" value={getVisibilityLabel(item.visibility)} />
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">対象者一覧</CardTitle>
            <p className="text-sm text-slate-500">配布先、回答状況、最終連絡日時を確認します。</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {["all", "未送信", "未回答", "リマインド済み", "回答済み"].map((status) => (
                <Button key={status} variant={filter === status ? "default" : "outline"} size="sm" className={filter === status ? "bg-purple-600 hover:bg-purple-700" : ""} onClick={() => setFilter(status)}>{status === "all" ? "すべて" : status}</Button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b text-xs text-slate-500">
                  <tr><th className="px-3 py-2">氏名/グループ</th><th className="px-3 py-2">メール</th><th className="px-3 py-2">部署</th><th className="px-3 py-2">状態</th><th className="px-3 py-2">最終連絡</th></tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((recipient) => (
                    <tr key={recipient.email} className="border-b">
                      <td className="px-3 py-3 font-medium text-slate-900">{recipient.name}</td>
                      <td className="px-3 py-3 text-slate-600">{recipient.email}</td>
                      <td className="px-3 py-3 text-slate-600">{recipient.department}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(recipient.status)}`}>{recipient.status}</span></td>
                      <td className="px-3 py-3 text-slate-500">{recipient.lastContact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">CSV取り込み仕様</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="rounded-lg bg-slate-50 p-3">必須列: 氏名, メールアドレス, 部署</div>
              <div className="rounded-lg bg-slate-50 p-3">重複メールは上書き確認ダイアログを表示</div>
              <div className="rounded-lg bg-red-50 p-3 text-red-700">エラー例: 3行目のメールアドレスが不正です。</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">一括操作</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
              <Button variant="outline">未回答者再送</Button>
              <Button variant="outline">選択者を除外</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

export function NotificationSettingsDialog({ item, onOpenChange }) {
  const rules = getNotificationRulesForItem(item);

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "92vw", maxWidth: "1100px" }}>
        <DialogHeader>
          <DialogTitle>通知・リマインド設定</DialogTitle>
          <DialogDescription>回答依頼、未回答リマインド、受付終了通知の仕様確認用モックです。</DialogDescription>
        </DialogHeader>
        {item && <NotificationSettingsContent key={item.id} item={item} initialRules={rules} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
}

export function NotificationSettingsContent({ item, initialRules, onOpenChange }) {
  const [draftRules, setDraftRules] = useState(initialRules);
  const recipients = getRecipientsForItem(item);
  const counts = getRecipientCounts(recipients);
  const primaryRule = draftRules[0];

  const updateRule = (index, patch) => setDraftRules((current) => current.map((rule, ruleIndex) => ruleIndex === index ? { ...rule, ...patch } : rule));
  const saveRules = () => {
    saveNotificationRules(item, draftRules);
    onOpenChange(false);
  };
  const sendTest = () => appendAuditLog({ action: "通知テスト送信", target: item.title, detail: `${primaryRule?.subject ?? "通知"} をテスト送信` });

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-4">
            <div className="font-medium text-slate-900">{item.title}</div>
            <p className="mt-1 text-sm text-slate-500">対象者 {counts.total}名 / 未回答 {counts.pending}名 / 期限 {formatDeadline(item.deadline)}</p>
          </div>
          <div className="space-y-3">
            {draftRules.map((rule, index) => (
              <div key={rule.label} className="rounded-lg border bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <label className="flex items-start gap-3">
                    <input type="checkbox" checked={rule.enabled} onChange={(event) => updateRule(index, { enabled: event.target.checked })} />
                    <span>
                      <span className="block font-medium text-slate-900">{rule.label}</span>
                      <span className="block text-sm text-slate-500">{rule.timing} / {rule.channel}</span>
                    </span>
                  </label>
                  <span className={`rounded-full px-2 py-1 text-xs ${rule.enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{rule.enabled ? "有効" : "無効"}</span>
                </div>
                <Input className="mt-3" value={rule.subject} onChange={(event) => updateRule(index, { subject: event.target.value })} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">通知文面プレビュー</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md bg-slate-50 p-3"><div className="text-xs text-slate-500">件名</div><div className="mt-1 font-medium">{primaryRule?.subject ?? "通知件名"}</div></div>
              <div className="rounded-md bg-slate-50 p-3 leading-6 text-slate-600">
                {item.title} の回答をお願いします。回答期限は {formatDeadline(item.deadline)} です。リンクからフォームを開いて送信してください。
              </div>
              <Button variant="outline" className="w-full" onClick={sendTest}>テスト送信</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg">送信対象</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div>初回依頼: {counts.total}名</div>
              <div>未回答リマインド: {counts.pending}名</div>
              <div>回答完了通知: 回答者本人</div>
            </CardContent>
          </Card>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>クローズ</Button>
        <Button variant="outline" onClick={saveRules}>下書き保存</Button>
        <Button className="bg-purple-600 hover:bg-purple-700" onClick={saveRules}>設定を反映</Button>
      </DialogFooter>
    </>
  );
}

export function PrePublishReviewDialog({ item, onOpenChange, onOpenPublish, onOpenNotifications, onPublish }) {
  const summary = item ? getPublishReviewSummary(item) : null;
  const checklist = item ? getPublishChecklistForForm(createFormFromActionItem(item), getRecipientsForItem(item), getNotificationRulesForItem(item)) : [];

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "92vw", maxWidth: "1100px" }}>
        <DialogHeader>
          <DialogTitle>公開前レビュー</DialogTitle>
          <DialogDescription>公開直前に確認する項目と、公開後に変わる状態をまとめた画面です。</DialogDescription>
        </DialogHeader>
        {item && summary && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-5">
              <MetricCard label="セクション" value={`${summary.sectionCount}`} />
              <MetricCard label="質問" value={`${summary.questionCount}`} />
              <MetricCard label="必須" value={`${summary.requiredCount}`} />
              <MetricCard label="対象者" value={`${summary.recipientCount}`} />
              <MetricCard label="通知" value={`${summary.enabledNotifications}`} />
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <Card>
                <CardHeader><CardTitle className="text-lg">公開前チェック</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {checklist.map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                      <span>{item.label}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${item.ok ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{item.ok ? "OK" : "要確認"}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">公開後の状態</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-lg bg-slate-50 p-3">公開範囲: {getVisibilityLabel(item.visibility)}</div>
                  <div className="rounded-lg bg-slate-50 p-3">回答期限: {formatDeadline(item.deadline)}</div>
                  <div className="rounded-lg bg-slate-50 p-3">回答リンク: {getRespondentUrl(item)}</div>
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-700">公開後に質問を変更する場合は新しい版として保存します。</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <DialogFooter>
          {item && <Button variant="outline" onClick={() => onOpenNotifications(item)}>通知設定</Button>}
          {item && <Button variant="outline" onClick={() => onOpenPublish(item)}>公開設定</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>クローズ</Button>
          {item && <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onPublish(item)}>公開</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogPage({ onBack }) {
  const [filter, setFilter] = useState("all");
  const logs = getAuditLogs();
  const actions = ["all", ...Array.from(new Set(logs.map((log) => log.action)))];
  const filteredLogs = filter === "all" ? logs : logs.filter((log) => log.action === filter);

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>管理トップ</button>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">監査ログ</h2>
          <p className="text-sm text-slate-500">公開、JSONインポート、通知送信などの操作履歴を確認します。</p>
        </div>
      </div>
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => <Button key={action} variant={filter === action ? "default" : "outline"} size="sm" className={filter === action ? "bg-purple-600 hover:bg-purple-700" : ""} onClick={() => setFilter(action)}>{action === "all" ? "すべて" : action}</Button>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b text-xs text-slate-500"><tr><th className="px-3 py-2">日時</th><th className="px-3 py-2">操作ユーザー</th><th className="px-3 py-2">操作</th><th className="px-3 py-2">対象</th><th className="px-3 py-2">詳細</th></tr></thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={`${log.time}-${log.action}`} className="border-b">
                    <td className="px-3 py-3 text-slate-500">{log.time}</td>
                    <td className="px-3 py-3 font-medium text-slate-900">{log.actor}</td>
                    <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{log.action}</span></td>
                    <td className="px-3 py-3 text-slate-700">{log.target}</td>
                    <td className="px-3 py-3 text-slate-600">{log.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export function StateSwitchPage({ onBack }) {
  const [scenarioId, setScenarioId] = useState(stateScenarios[0].id);
  const scenario = stateScenarios.find((candidate) => candidate.id === scenarioId) ?? stateScenarios[0];

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">
      <div>
        <button type="button" className="text-sm text-purple-700 hover:underline" onClick={onBack}>管理トップ</button>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">状態切替パネル</h2>
        <p className="text-sm text-slate-500">画面仕様書用に、空状態・権限エラー・期限切れなどを切り替えて確認します。</p>
      </div>
      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card>
          <CardHeader><CardTitle className="text-lg">表示する状態</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {stateScenarios.map((candidate) => (
              <button key={candidate.id} type="button" onClick={() => setScenarioId(candidate.id)} className={`w-full rounded-lg border p-3 text-left transition ${scenarioId === candidate.id ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                <div className="font-medium text-slate-900">{candidate.title}</div>
                <div className="mt-1 text-xs text-slate-500">{candidate.description}</div>
              </button>
            ))}
          </CardContent>
        </Card>
        <StateScenarioPreview scenario={scenario} />
      </section>
    </main>
  );
}

export function StateScenarioPreview({ scenario }) {
  if (scenario.id === "emptyResponses") return <EmptyResponsesScenario />;
  if (scenario.id === "deadlineExpired") return <StateMessage title="回答期限を過ぎています" tone="warning" message="公開期限を過ぎているため、このフォームには回答できません。必要な場合はフォーム管理者へお問い合わせください。" />;
  if (scenario.id === "noPermission") return <StateMessage title="権限がありません" tone="danger" message="このフォームは組織内限定です。別のアカウントでログインしている場合は、許可されたアカウントで再度アクセスしてください。" />;
  if (scenario.id === "alreadyAnswered") return <StateMessage title="回答済みです" tone="success" message="このフォームは1人1回のみ回答できます。回答内容を修正したい場合はフォーム管理者へ連絡してください。" />;
  if (scenario.id === "jsonError") return <StateMessage title="JSONを反映できません" tone="danger" message="questions[2].type が不正です。shortText, paragraph, radio, checkbox, select のいずれかを指定してください。" />;
  return <StateMessage title="CSVを取り込めません" tone="danger" message="必須列「メールアドレス」が見つかりません。CSVテンプレートを確認してから再度取り込んでください。" />;
}

export function EmptyResponsesScenario() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">回答はまだありません</CardTitle>
        <p className="text-sm text-slate-500">公開済みフォームに回答が1件も届いていない状態です。</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <MetricCard label="総回答数" value="0件" />
          <MetricCard label="未回答者" value="18名" />
          <MetricCard label="次回通知" value="明日 09:00" />
        </div>
        <div className="rounded-lg border border-dashed bg-slate-50 p-8 text-center">
          <div className="font-medium text-slate-900">回答一覧に表示するデータがありません</div>
          <p className="mt-2 text-sm text-slate-500">回答依頼を送信するか、未回答者へリマインドを送信してください。</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline">通知設定を確認</Button>
            <Button className="bg-purple-600 hover:bg-purple-700">リマインド送信</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StateMessage({ title, message, tone }) {
  const toneClass = tone === "success" ? "border-green-500 bg-green-50 text-green-700" : tone === "warning" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-red-500 bg-red-50 text-red-700";
  return (
    <Card className={`border-l-4 ${toneClass}`}>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6">{message}</p>
        <div className="rounded-lg bg-white/70 p-4 text-sm text-slate-600">画面遷移図では、この状態から「管理トップへ戻る」「再試行」「管理者へ問い合わせ」などの導線を検討します。</div>
      </CardContent>
    </Card>
  );
}

export function VersionHistoryDialog({ item, onOpenChange, onPreview, onCreateVersion }) {
  const versions = getVersionsForItem(item);
  const currentVersion = versions[0];
  const previousVersion = versions[1];

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto" style={{ width: "92vw", maxWidth: "1100px" }}>
        <DialogHeader>
          <DialogTitle>版管理</DialogTitle>
          <DialogDescription>公開版、下書き版、過去版を比較するためのモック画面です。</DialogDescription>
        </DialogHeader>
        {item && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{item.title}</div>
              <p className="mt-1 text-sm text-slate-500">現在の状態: {item.status} / 最終更新: {item.updatedAt}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.version} className="rounded-lg border bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold text-slate-900">{version.version}</div>
                      <span className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(version.status)}`}>{version.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{version.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>更新者: {version.editor}</span>
                      <span>更新: {version.updatedAt}</span>
                      <span>質問: {version.questions}</span>
                      <span>回答: {version.responses}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                <div className="font-medium text-slate-900">版比較</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <VersionCompareColumn title="現在" version={currentVersion} />
                  <VersionCompareColumn title="ひとつ前" version={previousVersion} />
                </div>
                <div className="rounded-md bg-white p-3 text-sm text-slate-600">
                  公開後に質問を増やす場合は、新しい版として公開し、回答一覧では回答時点の版を保持する想定です。
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {item && <Button variant="outline" onClick={() => onPreview(item)}>現在版プレビュー</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>クローズ</Button>
          {item && <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => onCreateVersion(item)}>新版下書き作成</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VersionCompareColumn({ title, version }) {
  return (
    <div className="rounded-lg bg-white p-4 text-sm">
      <div className="text-xs font-medium text-slate-500">{title}</div>
      {version ? (
        <div className="mt-2 space-y-2">
          <div className="font-semibold text-slate-900">{version.version}</div>
          <div>{version.summary}</div>
          <div className="text-slate-500">質問 {version.questions} / 回答 {version.responses}</div>
        </div>
      ) : <div className="mt-2 text-slate-400">比較対象なし</div>}
    </div>
  );
}

export function PublishControlDialog({ item, onOpenChange, onSaveSettings, onPublish }) {
  const itemSettings = item ? createDefaultSettings(createFormFromActionItem(item).settings) : createDefaultSettings();
  const initialAudienceTargets = Array.isArray(itemSettings.audienceTargets) && itemSettings.audienceTargets.length > 0
    ? itemSettings.audienceTargets
    : audienceTargetOptions.slice(0, 3).map((option) => option.id);
  const [publishedItem, setPublishedItem] = useState(null);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [audienceDropdownOpen, setAudienceDropdownOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState(() => ({
    visibility: itemSettings.visibility,
    audienceTargets: initialAudienceTargets,
    deadline: toDeadlineInputValue(itemSettings.deadline),
    acceptingResponses: itemSettings.acceptingResponses,
    limitOneResponse: itemSettings.limitOneResponse,
    allowEditAfterSubmit: itemSettings.allowEditAfterSubmit,
  }));
  const filteredAudienceOptions = audienceTargetOptions.filter((option) => option.id === "scope-link" || option.label.toLowerCase().includes(audienceSearch.toLowerCase()));
  const toggleAudienceTarget = (targetId) => {
    setSettingsDraft((current) => {
      const exists = current.audienceTargets.includes(targetId);
      const nextTargets = exists
        ? current.audienceTargets.filter((id) => id !== targetId)
        : [...current.audienceTargets, targetId];
      return { ...current, audienceTargets: nextTargets.length > 0 ? nextTargets : current.audienceTargets };
    });
  };
  const publishedAudienceLabel = publishedItem
    ? getAudienceLabel(createDefaultSettings(createFormFromActionItem(publishedItem).settings).audienceTargets)
    : "";
  const publishedShareUrl = publishedItem ? getRespondentUrl(publishedItem) : "";
  const publishItem = () => {
    const result = onPublish?.(item, settingsDraft);
    if (result) setPublishedItem(result);
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-7xl overflow-y-auto" style={{ width: "98vw", maxWidth: "1280px" }}>
        <DialogHeader>
          <DialogTitle>{publishedItem ? "公開しました" : "公開設定・権限"}</DialogTitle>
          <DialogDescription>{publishedItem ? "回答者に渡すリンクと公開情報を確認できます。" : "公開前に共有設定を確認できます。"}</DialogDescription>
        </DialogHeader>
        {publishedItem ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{publishedItem.title}</div>
              <p className="mt-1 text-sm text-slate-500">公開先: {publishedAudienceLabel} / 期限: {formatDeadline(publishedItem.deadline ?? toDeadlineInputValue(publishedItem.due))}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">回答リンク</label>
              <Input readOnly value={publishedShareUrl} />
            </div>
          </div>
        ) : item && (
          <div className="space-y-5">
            <div className="grid gap-4">
              <div className="space-y-4">
                <div className="rounded-lg border bg-white p-4">
                  <div className="font-medium text-slate-900">共有設定入力</div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs text-slate-500">公開範囲</label>
                      <div className="relative">
                        <button
                          type="button"
                          className="flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm"
                          onClick={() => setAudienceDropdownOpen((open) => !open)}
                        >
                          <span className="truncate">{getAudienceLabel(settingsDraft.audienceTargets)}</span>
                          <span className="text-slate-400">▼</span>
                        </button>
                        {audienceDropdownOpen && (
                          <div className="absolute z-50 mt-2 w-full rounded-md border bg-white p-3 shadow-lg">
                            <Input value={audienceSearch} onChange={(event) => setAudienceSearch(event.target.value)} placeholder="組織名・氏名で検索" />
                            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                              {filteredAudienceOptions.map((option) => (
                                <label key={option.id} className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-slate-50">
                                  <span className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={settingsDraft.audienceTargets.includes(option.id)}
                                      onChange={() => toggleAudienceTarget(option.id)}
                                    />
                                    <span>{option.label}</span>
                                  </span>
                                  <span className="text-xs text-slate-400">{option.type}</span>
                                </label>
                              ))}
                              {filteredAudienceOptions.length === 0 && <p className="px-2 py-3 text-xs text-slate-500">候補が見つかりません。</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs text-slate-500">回答期限</label>
                      <Input type="datetime-local" value={settingsDraft.deadline} onChange={(event) => setSettingsDraft((current) => ({ ...current, deadline: event.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                      <input type="checkbox" checked={settingsDraft.acceptingResponses} onChange={(event) => setSettingsDraft((current) => ({ ...current, acceptingResponses: event.target.checked }))} />
                      回答を受け付ける
                    </label>
                    <label className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                      <input type="checkbox" checked={settingsDraft.limitOneResponse} onChange={(event) => setSettingsDraft((current) => ({ ...current, limitOneResponse: event.target.checked }))} />
                      1人1回回答
                    </label>
                    <label className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-xs text-slate-700 sm:col-span-2">
                      <input type="checkbox" checked={settingsDraft.allowEditAfterSubmit} onChange={(event) => setSettingsDraft((current) => ({ ...current, allowEditAfterSubmit: event.target.checked }))} />
                      回答後の編集を許可
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          {publishedItem && <Button variant="outline" onClick={() => navigator.clipboard?.writeText(publishedShareUrl)}>コピー</Button>}
          {publishedItem && <a className="inline-flex h-9 items-center justify-center rounded-md bg-purple-600 px-3 text-sm font-medium text-white transition hover:bg-purple-700" href={publishedShareUrl} target="_blank" rel="noreferrer">回答画面の表示</a>}
          {!publishedItem && item && <Button className="bg-purple-600 hover:bg-purple-700" onClick={publishItem}>公開を実行</Button>}
          {!publishedItem && item && <Button variant="outline" onClick={() => { onSaveSettings?.(item, settingsDraft); onOpenChange(false); }}>下書きを維持</Button>}
          <Button variant="outline" onClick={() => onOpenChange(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
