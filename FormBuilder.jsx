import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { FaBell, FaChevronDown, FaEye, FaHouse, FaPen, FaRightFromBracket, FaShareNodes, FaUser } from "react-icons/fa6";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { actionItems, maxJsonImportLength, templates as baseTemplates } from "./data/mockData";
import { roleOptions } from "./data/roleOptions";
import { LoginEmailPage, LoginPasswordPage } from "./components/auth/AuthPages";
import {
  createBlankForm,
  createDefaultSettings,
  createFormFromActionItem,
  createFormFromTemplate,
  createQuestion,
  createQuestionDefaults,
  appendAuditLog,
  appendVersionHistory,
  archiveCreatedForm,
  deleteCreatedForm,
  duplicateCreatedForm,
  getBlockingPublishIssues,
  getRespondentFormFromHash,
  getStoredCreatedForms,
  getStoredLoginEmail,
  getNotificationRulesForItem,
  getPublishChecklistForForm,
  getRecipientsForItem,
  normalizeBranch,
  normalizeForm,
  resetDemoStorage,
  upsertCreatedForm,
  toAuthoringForm,
  validateAuthoringForm,
} from "./utils/formBuilderUtils";

const HomePage = lazy(() => import("./components/home/HomePage").then((module) => ({ default: module.HomePage })));
const EditPage = lazy(() => import("./components/editor/EditPage").then((module) => ({ default: module.EditPage })));
const JsonAuthoringDialog = lazy(() => import("./components/json/JsonAuthoringDialog").then((module) => ({ default: module.JsonAuthoringDialog })));
const PreviewPage = lazy(() => import("./components/respondent/RespondentPages").then((module) => ({ default: module.PreviewPage })));
const RespondentFormPage = lazy(() => import("./components/respondent/RespondentPages").then((module) => ({ default: module.RespondentFormPage })));
const AuditLogPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.AuditLogPage })));
const FormSettingsDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.FormSettingsDialog })));
const NotificationSettingsDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.NotificationSettingsDialog })));
const PrePublishReviewDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.PrePublishReviewDialog })));
const PublishControlDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.PublishControlDialog })));
const RecipientManagementPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.RecipientManagementPage })));
const ResponseDashboardPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.ResponseDashboardPage })));
const ShareLinkDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.ShareLinkDialog })));
const StateSwitchPage = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.StateSwitchPage })));
const VersionHistoryDialog = lazy(() => import("./components/management/ManagementPages").then((module) => ({ default: module.VersionHistoryDialog })));

function LoadingPanel() {
  return <div className="mx-auto max-w-6xl p-6 text-sm text-slate-500">画面を読み込んでいます...</div>;
}

function HeaderAccountMenu({ currentUserId, currentUserName, onLogout }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="アカウントメニュー"
        aria-expanded={open}
        className="inline-flex min-h-10 items-center gap-2 rounded-md border bg-white px-3 py-2 text-left text-xs text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        onClick={() => setOpen((current) => !current)}>
        <FaUser className="text-purple-600" />
        <span className="hidden md:block">
          <span className="block">ID: <span className="font-medium text-slate-800">{currentUserId}</span></span>
          <span className="block">ユーザー名: <span className="font-medium text-slate-800">{currentUserName}</span></span>
        </span>
        <span className="font-medium text-slate-800 md:hidden">{currentUserName}</span>
        <FaChevronDown className="text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-40 rounded-md bg-white p-1 text-sm text-slate-700 shadow-lg ring-1 ring-slate-200">
          <button type="button" className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" onClick={() => { setOpen(false); onLogout(); }}>
            <FaRightFromBracket />ログアウト
          </button>
        </div>
      )}
    </div>
  );
}

function HeaderNotificationButton({ unansweredCount, draftCount, onOpenUnanswered, onOpenDrafts }) {
  const [open, setOpen] = useState(false);
  const totalCount = unansweredCount + draftCount;

  return (
    <div className="relative">
      <Button
        aria-label="通知情報"
        title="通知情報"
        variant="outline"
        size="icon-sm"
        className="relative"
        onClick={() => setOpen((current) => !current)}>
        <FaBell />
        {totalCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-semibold leading-4 text-white">{totalCount}</span>}
        <span className="sr-only">通知</span>
      </Button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 rounded-md border bg-white p-3 text-sm text-slate-700 shadow-lg">
          <div className="font-medium text-slate-900">通知サマリー</div>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
              onClick={() => { setOpen(false); onOpenUnanswered?.(); }}
            >
              <span>未回答アンケート</span>
              <span className="font-semibold text-slate-900">{unansweredCount}件</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100"
              onClick={() => { setOpen(false); onOpenDrafts?.(); }}
            >
              <span>下書きアンケート</span>
              <span className="font-semibold text-slate-900">{draftCount}件</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderPublishButton({ status, canPublish, onOpenPublish, onUnpublish }) {
  const [open, setOpen] = useState(false);
  const isPublished = status === "公開中";

  if (!isPublished) {
    return (
      <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700" disabled={!canPublish} onClick={onOpenPublish}>
        <FaShareNodes />フォームを公開
      </Button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="公開状態メニュー"
        aria-expanded={open}
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md bg-green-600 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:pointer-events-none disabled:opacity-50"
        disabled={!canPublish}
        onClick={() => setOpen((current) => !current)}>
        公開中
        <FaChevronDown className="text-green-100" />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-44 rounded-md bg-white p-1 text-sm text-slate-700 shadow-lg ring-1 ring-slate-200">
          <button type="button" className="flex w-full items-center rounded-sm px-3 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400" onClick={() => { setOpen(false); onUnpublish(); }}>
            非公開に変更
          </button>
        </div>
      )}
    </div>
  );
}

export default function FormBuilder() {
  const respondentForm = getRespondentFormFromHash();
  const [screen, setScreen] = useState("loginEmail");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [homeTab, setHomeTab] = useState("actions");
  const [templateItems, setTemplateItems] = useState(baseTemplates);
  const [hoveredTemplateId, setHoveredTemplateId] = useState(baseTemplates[0].id);
  const [form, setForm] = useState(createBlankForm);
  const [managedForms, setManagedForms] = useState(getStoredCreatedForms);
  const [activeFormId, setActiveFormId] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [userRole, setUserRole] = useState("owner");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [responseItem, setResponseItem] = useState(null);
  const [versionItem, setVersionItem] = useState(null);
  const [publishItem, setPublishItem] = useState(null);
  const [recipientItem, setRecipientItem] = useState(null);
  const [notificationItem, setNotificationItem] = useState(null);
  const [reviewItem, setReviewItem] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [jsonTab, setJsonTab] = useState("json");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const hoveredTemplate = templateItems.find((template) => template.id === hoveredTemplateId) ?? templateItems[0];
  const prettyJson = useMemo(() => JSON.stringify(toAuthoringForm(form), null, 2), [form]);
  const activeManagedForm = managedForms.find((item) => item.id === activeFormId);
  const currentRole = roleOptions.find((role) => role.value === userRole) ?? roleOptions[0];
  const getPublishIssueNotice = (issues) => (issues.length > 1 ? `公開前チェック未完了: ${issues[0].label} ほか${issues.length - 1}件` : `公開前チェック未完了: ${issues[0].label}`);
  const publishChecklistForCurrentForm = useMemo(() => getPublishChecklistForForm(
    form,
    activeManagedForm ? getRecipientsForItem(activeManagedForm) : [],
    activeManagedForm ? getNotificationRulesForItem(activeManagedForm) : [],
  ), [activeManagedForm, form]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const currentUserId = email || getStoredLoginEmail() || "esqid001";
  const currentUserName = "〇〇さん";
  const unansweredActionCount = actionItems.filter((item) => item.status === "未回答").length;
  const draftFormCount = managedForms.filter((item) => item.status === "下書き").length;

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty || screen !== "edit" || !currentRole.canEdit) return undefined;
    const timer = window.setTimeout(() => {
      const { item, items } = upsertCreatedForm(managedForms, form, activeFormId, "自動保存");
      setManagedForms(items);
      setActiveFormId(item.id);
      setIsDirty(false);
      setSaveNotice("自動保存しました。");
    }, 15000);
    return () => window.clearTimeout(timer);
  }, [activeFormId, currentRole.canEdit, form, isDirty, managedForms, screen]);

  const submitEmail = (event) => { event.preventDefault(); setScreen("loginPassword"); };
  const submitPassword = (event) => {
    event.preventDefault();
    localStorage.setItem("form-builder-demo-email", email || "esqid001");
    setScreen("home");
  };
  const confirmDiscardIfDirty = () => !isDirty || window.confirm("未保存の変更があります。保存せずに移動しますか？");
  const goHome = () => {
    if (screen === "edit" && !confirmDiscardIfDirty()) return;
    setScreen("home");
  };
  const openHomeTabFromNotification = (targetTab) => {
    if (screen === "edit" && !confirmDiscardIfDirty()) return;
    setHomeTab(targetTab);
    setScreen("home");
    window.setTimeout(() => {
      document.getElementById("home-tab-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };
  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    if (!confirmDiscardIfDirty()) return;
    setPassword("");
    setScreen("loginEmail");
  };
  const logout = () => setLogoutDialogOpen(true);

  const markFormChanged = (updater) => {
    if (!currentRole.canEdit) {
      setSaveNotice("閲覧者権限では編集できません。");
      return;
    }
    setForm(updater);
    setIsDirty(true);
    setSaveNotice("");
  };

  const saveCurrentForm = (status = "下書き") => {
    if (!currentRole.canEdit) { setSaveNotice("閲覧者権限では保存できません。"); return activeManagedForm; }
    const { item, items } = upsertCreatedForm(managedForms, form, activeFormId, status);
    setManagedForms(items);
    setActiveFormId(item.id);
    setIsDirty(false);
    setSaveNotice(status === "公開中" ? "公開版として保存しました。" : status === "非公開" ? "非公開のまま保存しました。" : "下書きを保存しました。");
    appendAuditLog({ actor: email || "login@example.com", action: status === "公開中" ? "フォーム公開" : status === "非公開" ? "非公開保存" : "下書き保存", target: item.title, detail: `${item.status}として保存` });
    if (status !== "自動保存") appendVersionHistory(item, form, status, email || "login@example.com", status === "公開中" ? "公開版として保存" : status === "非公開" ? "非公開のまま保存" : "下書き保存");
    return item;
  };

  const publishCurrentForm = (force = false) => {
    if (!currentRole.canPublish) { setSaveNotice("この権限では公開できません。"); return null; }
    const issues = getBlockingPublishIssues(publishChecklistForCurrentForm);
    if (!force && issues.length > 0) {
      setSaveNotice(getPublishIssueNotice(issues));
      return null;
    }
    return saveCurrentForm("公開中");
  };

  const publishManagedItem = (item, force = false) => {
    if (!currentRole.canPublish) { setSaveNotice("この権限では公開できません。"); return null; }
    const itemForm = createFormFromActionItem(item);
    const checklist = getPublishChecklistForForm(itemForm, getRecipientsForItem(item), getNotificationRulesForItem(item));
    const issues = getBlockingPublishIssues(checklist);
    if (!force && issues.length > 0) {
      setSaveNotice(getPublishIssueNotice(issues));
      return null;
    }
    const result = upsertCreatedForm(managedForms, itemForm, item.id, "公開中");
    setManagedForms(result.items);
    setActiveFormId(result.item.id);
    setIsDirty(false);
    setSaveNotice("公開版として保存しました。");
    appendAuditLog({ actor: email || "login@example.com", action: "フォーム公開", target: result.item.title, detail: "公開前チェックを確認して公開" });
    appendVersionHistory(result.item, itemForm, "公開中", email || "login@example.com", "公開前チェックを確認して公開");
    return result.item;
  };

  const toggleManagedPublishState = (item) => {
    if (!currentRole.canPublish) {
      setSaveNotice("この権限では公開状態を変更できません。");
      return null;
    }
    const currentForm = createFormFromActionItem(item);
    const isPublished = item.status === "公開中";
    const nextStatus = isPublished ? "終了" : "公開中";
    const nextForm = normalizeForm({
      ...currentForm,
      settings: createDefaultSettings({
        ...currentForm.settings,
        acceptingResponses: !isPublished,
      }),
    });
    const result = upsertCreatedForm(managedForms, nextForm, item.id, nextStatus);
    setManagedForms(result.items);
    if (activeFormId === item.id) {
      setForm(nextForm);
      setIsDirty(false);
    }
    setSaveNotice(isPublished ? "アンケートを終了しました。" : "アンケートを再公開しました。");
    appendAuditLog({ actor: email || "login@example.com", action: isPublished ? "公開終了" : "再公開", target: result.item.title, detail: isPublished ? "公開中から終了へ変更" : "終了から公開中へ変更" });
    appendVersionHistory(result.item, nextForm, nextStatus, email || "login@example.com", isPublished ? "公開終了" : "再公開");
    return result.item;
  };

  const toggleManagedVisibilityState = (item) => {
    if (!currentRole.canPublish) {
      setSaveNotice("この権限では公開状態を変更できません。");
      return null;
    }
    const currentForm = createFormFromActionItem(item);
    const isPublished = item.status === "公開中";
    const nextStatus = isPublished ? "終了" : "公開中";
    const nextForm = normalizeForm({
      ...currentForm,
      settings: createDefaultSettings({
        ...currentForm.settings,
        visibility: isPublished ? "private" : (currentForm.settings?.visibility === "private" ? "organization" : currentForm.settings?.visibility),
        acceptingResponses: !isPublished,
      }),
    });
    const result = upsertCreatedForm(managedForms, nextForm, item.id, nextStatus);
    setManagedForms(result.items);
    if (activeFormId === item.id) {
      setForm(nextForm);
      setIsDirty(false);
    }
    setSaveNotice(isPublished ? "アンケートを終了しました。" : "アンケートを公開しました。");
    appendAuditLog({ actor: email || "login@example.com", action: isPublished ? "公開終了" : "再公開", target: result.item.title, detail: isPublished ? "公開中から終了へ変更" : "終了から公開中へ変更" });
    appendVersionHistory(result.item, nextForm, nextStatus, email || "login@example.com", isPublished ? "終了にする" : "公開する");
    return result.item;
  };

  const unpublishCurrentForm = () => {
    if (!activeManagedForm) {
      setSaveNotice("非公開に変更するフォームがありません。");
      return;
    }
    if (!currentRole.canPublish) {
      setSaveNotice("この権限では公開状態を変更できません。");
      return;
    }
    const nextForm = normalizeForm({
      ...form,
      settings: createDefaultSettings({
        ...form.settings,
        visibility: "private",
        acceptingResponses: false,
      }),
    });
    const result = upsertCreatedForm(managedForms, nextForm, activeManagedForm.id, "終了");
    setManagedForms(result.items);
    setActiveFormId(result.item.id);
    setForm(nextForm);
    setIsDirty(false);
    setSaveNotice("フォームを終了しました。");
    appendAuditLog({ actor: email || "login@example.com", action: "公開終了", target: result.item.title, detail: "終了へ変更" });
    appendVersionHistory(result.item, nextForm, "終了", email || "login@example.com", "終了へ変更");
  };

  const openPublishSettingsFromEdit = () => {
    if (!currentRole.canEdit) {
      setSaveNotice("閲覧者権限では共有設定を変更できません。");
      return null;
    }
    if (activeManagedForm && !isDirty) {
      setPublishItem(activeManagedForm);
      return;
    }
    const item = saveCurrentForm(activeManagedForm?.status === "公開中" ? "公開中" : "下書き");
    if (item) setPublishItem(item);
  };

  const savePublishSettings = (item, patch) => {
    if (!item || !currentRole.canEdit) {
      setSaveNotice("閲覧者権限では共有設定を変更できません。");
      return null;
    }
    const currentForm = createFormFromActionItem(item);
    const nextForm = normalizeForm({
      ...currentForm,
      settings: createDefaultSettings({
        ...currentForm.settings,
        visibility: patch.visibility,
        audienceTargets: patch.audienceTargets,
        collaboratorIds: patch.collaboratorIds ?? currentForm.settings?.collaboratorIds,
        deadline: patch.deadline,
        acceptingResponses: patch.acceptingResponses,
        limitOneResponse: patch.limitOneResponse,
        allowEditAfterSubmit: patch.allowEditAfterSubmit,
      }),
    });
    const status = item.status === "公開中" ? "公開中" : "下書き";
    const result = upsertCreatedForm(managedForms, nextForm, item.id, status);
    setManagedForms(result.items);
    setPublishItem(result.item);
    if (activeFormId === item.id) {
      setForm(nextForm);
      setIsDirty(false);
    }
    setSaveNotice("共有設定を保存しました。");
    appendAuditLog({ actor: email || "login@example.com", action: "共有設定更新", target: result.item.title, detail: `公開範囲:${result.item.visibility} / 期限:${result.item.deadline || "期限なし"}` });
    return result.item;
  };

  const resetDemo = () => {
    if (!window.confirm("保存済みフォーム、回答、監査ログ、通知設定、版履歴を初期化しますか？")) return;
    resetDemoStorage();
    setManagedForms(getStoredCreatedForms());
    setActiveFormId(null);
    setIsDirty(false);
    setSaveNotice("デモデータを初期化しました。");
    setScreen("home");
  };

  const duplicateManagedForm = (item) => setManagedForms(duplicateCreatedForm(managedForms, item));
  const duplicateTemplate = (template) => {
    const templateId = `local-template-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const duplicatedTemplate = {
      ...template,
      id: templateId,
      title: `${template.title}（コピー）`,
      questions: template.questions.map((question) => ({
        ...question,
        options: Array.isArray(question.options) ? [...question.options] : [],
      })),
    };
    setTemplateItems((current) => [duplicatedTemplate, ...current]);
    setHoveredTemplateId(templateId);
    setSaveNotice("テンプレートを複製しました。");
  };
  const deleteTemplate = (template) => {
    if (templateItems.length <= 1) {
      setSaveNotice("テンプレートは1件以上必要です。");
      return;
    }
    if (!window.confirm(`${template.title} を削除しますか？`)) return;
    const nextTemplates = templateItems.filter((item) => item.id !== template.id);
    setTemplateItems(nextTemplates);
    if (hoveredTemplateId === template.id) setHoveredTemplateId(nextTemplates[0].id);
    setSaveNotice("テンプレートを削除しました。");
  };
  const addTemplateFromManagedForm = (item) => {
    const sourceForm = createFormFromActionItem(item);
    const templateId = `local-template-${Date.now()}`;
    const template = {
      id: templateId,
      title: item.title,
      description: `${item.title} から作成したテンプレートです。`,
      icon: FaPen,
      tag: "追加",
      questions: sourceForm.questions.map((question) => ({
        type: question.type,
        title: question.title,
        description: question.description,
        required: Boolean(question.required),
        options: Array.isArray(question.options) ? question.options : [],
      })),
    };
    setTemplateItems((current) => [template, ...current]);
    setHoveredTemplateId(templateId);
    setSaveNotice("テンプレートに追加しました。");
    appendAuditLog({ actor: email || "login@example.com", action: "テンプレート追加", target: item.title, detail: "作成済みアンケートからテンプレートを追加" });
  };
  const archiveManagedForm = (item) => setManagedForms(archiveCreatedForm(managedForms, item));
  const deleteManagedForm = (item) => {
    if (!window.confirm(`${item.title} を削除しますか？`)) return;
    setManagedForms(deleteCreatedForm(managedForms, item));
  };

  const startBlank = () => { setForm(createBlankForm()); setActiveFormId(null); setIsDirty(true); setSaveNotice(""); setScreen("edit"); };
  const startFromTemplate = (template) => { setForm(createFormFromTemplate(template)); setActiveFormId(null); setIsDirty(true); setSaveNotice(""); setScreen("edit"); };
  const openResponseDashboard = (item) => { setResponseItem(item); setScreen("responses"); };
  const openRecipientManagement = (item) => { setRecipientItem(item); setScreen("recipients"); };
  const openCreatedForm = (item, next = "edit") => {
    setForm(createFormFromActionItem(item));
    setActiveFormId(item.id);
    setIsDirty(false);
    setSaveNotice("");
    setScreen(next);
  };

  const updateFormSettings = (patch) => markFormChanged((current) => ({
    ...current,
    settings: createDefaultSettings({ ...current.settings, ...patch }),
  }));

  const updateQuestion = (qid, patch) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id === qid ? { ...q, ...patch } : q) }));
  const addQuestion = () => markFormChanged((current) => ({
    ...current,
    questions: [...current.questions, { ...createQuestion(), sectionId: current.sections?.[0]?.id ?? "section-1" }],
  }));
  const deleteQuestion = (qid) => markFormChanged((current) => ({ ...current, questions: current.questions.filter((q) => q.id !== qid) }));
  const updateOption = (qid, index, value) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.map((option, i) => i === index ? value : option) }) }));
  const addOption = (qid) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: [...q.options, `選択肢${q.options.length + 1}`] }) }));
  const deleteOption = (qid, index) => markFormChanged((current) => ({ ...current, questions: current.questions.map((q) => q.id !== qid ? q : { ...q, options: q.options.filter((_, i) => i !== index) }) }));
  const changeType = (qid, type) => {
    markFormChanged((current) => ({
      ...current,
      questions: current.questions.map((question) => question.id !== qid ? question : {
        ...createQuestionDefaults(type),
        id: question.id,
        sectionId: question.sectionId,
        type,
        title: question.title,
        description: question.description,
        required: question.required,
        branch: normalizeBranch(),
      }),
    }));
  };
  const duplicateQuestion = (qid) => markFormChanged((current) => {
    const index = current.questions.findIndex((question) => question.id === qid);
    if (index < 0) return current;
    const original = current.questions[index];
    const copy = { ...original, id: crypto?.randomUUID?.() ?? `copy-${Date.now()}`, title: `${original.title} のコピー` };
    return { ...current, questions: [...current.questions.slice(0, index + 1), copy, ...current.questions.slice(index + 1)] };
  });
  const moveQuestion = (qid, direction) => markFormChanged((current) => {
    const index = current.questions.findIndex((question) => question.id === qid);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= current.questions.length) return current;
    return { ...current, questions: arrayMove(current.questions, index, nextIndex) };
  });

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    markFormChanged((current) => {
      const oldIndex = current.questions.findIndex((q) => q.id === active.id);
      const newIndex = current.questions.findIndex((q) => q.id === over.id);
      return { ...current, questions: arrayMove(current.questions, oldIndex, newIndex) };
    });
  };

  const openJson = () => { setJsonText(prettyJson); setJsonError(""); setJsonTab("json"); setJsonOpen(true); };
  const openAiJson = () => { setJsonError(""); setJsonTab("ai"); setJsonOpen(true); };
  const importJson = () => {
    try {
      if (jsonText.length > maxJsonImportLength) throw new Error("JSONが大きすぎます。200KB以内にしてください。");
      const parsedJson = JSON.parse(jsonText);
      const validationErrors = validateAuthoringForm(parsedJson);
      if (validationErrors.length > 0) throw new Error(validationErrors.join("\n"));
      const normalizedJsonForm = normalizeForm(parsedJson);
      appendAuditLog({ actor: email || "login@example.com", action: "JSONインポート", target: normalizedJsonForm.title, detail: `${normalizedJsonForm.questions.length}問を反映` });
      setForm(normalizedJsonForm); setActiveFormId(null); setIsDirty(true); setJsonOpen(false); setScreen("edit");
    }
    catch (error) { setJsonError(error.message); }
  };
  const copyJson = async () => navigator.clipboard?.writeText(jsonText || prettyJson);

  if (respondentForm) {
    return (
      <div className="min-h-screen bg-slate-100">
        <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
            <div className="text-left">
              <h1 className="text-lg font-bold text-slate-900">フォーム回答</h1>
              <p className="text-xs text-slate-500">ログイン中のユーザー情報</p>
            </div>
            <HeaderAccountMenu currentUserId={currentUserId} currentUserName={currentUserName} onLogout={logout} />
          </div>
        </header>
        <Suspense fallback={<LoadingPanel />}><RespondentFormPage form={respondentForm} respondentEmail={currentUserId} showHeader={false} /></Suspense>
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ログアウトしますか？</DialogTitle>
              <DialogDescription>現在のセッションを終了して、ログイン画面に戻ります。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>キャンセル</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={confirmLogout}>ログアウト</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (screen === "loginEmail") return <LoginEmailPage email={email} setEmail={setEmail} onSubmit={submitEmail} />;
  if (screen === "loginPassword") return <LoginPasswordPage email={email} password={password} setPassword={setPassword} onSubmit={submitPassword} onBack={() => setScreen("loginEmail")} />;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button type="button" onClick={goHome} className="flex items-center gap-3 rounded-md border bg-white px-3 py-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600" aria-hidden="true"><FaHouse /></span>
            <span>
              <h1 className="text-lg font-bold text-slate-900">フォーム管理</h1>
              <p className="text-xs text-slate-500">Googleフォーム風ビルダー v0.6</p>
            </span>
          </button>
          <div className="flex items-center justify-end gap-2">
            {screen === "edit" && <Button variant="outline" size="sm" className="inline-flex gap-2" aria-label="プレビュー" onClick={() => setScreen("preview")}><FaEye /><span className="hidden sm:inline">プレビュー</span></Button>}
            {screen === "preview" && <Button variant="outline" size="sm" className="inline-flex gap-2" aria-label="編集画面" onClick={() => setScreen("edit")}><FaPen /><span className="hidden sm:inline">編集画面</span></Button>}
            {screen === "edit" && <HeaderPublishButton status={activeManagedForm?.status} canPublish={currentRole.canEdit && currentRole.canPublish} onOpenPublish={openPublishSettingsFromEdit} onUnpublish={unpublishCurrentForm} />}
            <div className="flex items-center gap-2 border-l pl-2">
              <HeaderAccountMenu currentUserId={currentUserId} currentUserName={currentUserName} onLogout={logout} />
              <HeaderNotificationButton unansweredCount={unansweredActionCount} draftCount={draftFormCount} onOpenUnanswered={() => openHomeTabFromNotification("actions")} onOpenDrafts={() => openHomeTabFromNotification("created")} />
            </div>
          </div>
        </div>
      </header>

      <Suspense fallback={<LoadingPanel />}>
        {screen === "home" && (
          <HomePage
            templates={templateItems}
            hoveredTemplate={hoveredTemplate}
            hoveredTemplateId={hoveredTemplateId}
            setHoveredTemplateId={setHoveredTemplateId}
            onStartBlank={startBlank}
            onStartAi={openAiJson}
            onStartTemplate={startFromTemplate}
            onDuplicateTemplate={duplicateTemplate}
            onDeleteTemplate={deleteTemplate}
            homeTab={homeTab}
            setHomeTab={setHomeTab}
            actionItems={actionItems}
            createdForms={managedForms}
            onOpenCreated={openCreatedForm}
            onShareCreated={setShareItem}
            onOpenResponses={openResponseDashboard}
            onOpenVersions={setVersionItem}
            onOpenPublish={setPublishItem}
            onTogglePublishState={toggleManagedPublishState}
            onToggleVisibility={toggleManagedVisibilityState}
            onOpenRecipients={openRecipientManagement}
            onOpenNotifications={setNotificationItem}
            onOpenReview={setReviewItem}
            onDuplicate={duplicateManagedForm}
            onAddTemplate={addTemplateFromManagedForm}
            onArchive={archiveManagedForm}
            onDelete={deleteManagedForm}
            currentRole={currentRole}
          />
        )}
        {screen === "edit" && <EditPage form={form} setForm={markFormChanged} isDirty={isDirty} saveNotice={saveNotice} sensors={sensors} onDragEnd={onDragEnd} updateQuestion={updateQuestion} addQuestion={addQuestion} deleteQuestion={deleteQuestion} duplicateQuestion={duplicateQuestion} moveQuestion={moveQuestion} changeType={changeType} updateOption={updateOption} addOption={addOption} deleteOption={deleteOption} />}
        {screen === "preview" && <PreviewPage form={form} />}
        {screen === "responses" && <ResponseDashboardPage item={responseItem ?? managedForms[0]} onBack={() => setScreen("home")} />}
        {screen === "recipients" && <RecipientManagementPage item={recipientItem ?? managedForms[0]} onBack={() => setScreen("home")} onOpenNotifications={setNotificationItem} />}
        {screen === "audit" && <AuditLogPage onBack={() => setScreen("home")} />}
        {screen === "states" && <StateSwitchPage onBack={() => setScreen("home")} />}

        {settingsOpen && (
          <FormSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            settings={form.settings ?? createDefaultSettings()}
            onChange={updateFormSettings}
          />
        )}

        {shareItem && <ShareLinkDialog item={shareItem} onOpenChange={(open) => !open && setShareItem(null)} />}

        {versionItem && <VersionHistoryDialog item={versionItem} onOpenChange={(open) => !open && setVersionItem(null)} onPreview={(item) => openCreatedForm(item, "preview")} onCreateVersion={(item) => { const draftForm = createFormFromActionItem(item); appendVersionHistory(item, draftForm, "下書き", email || "login@example.com", "新しい下書き版を作成"); openCreatedForm(item, "edit"); setVersionItem(null); setSaveNotice("新しい版の下書きを開きました。"); }} />}
        {publishItem && <PublishControlDialog key={publishItem.id} item={publishItem} onOpenChange={(open) => !open && setPublishItem(null)} onSaveSettings={savePublishSettings} onPublish={(item, settingsDraft) => { const savedItem = savePublishSettings(item, settingsDraft) ?? item; return publishManagedItem(savedItem, true); }} />}
        {notificationItem && <NotificationSettingsDialog item={notificationItem} onOpenChange={(open) => !open && setNotificationItem(null)} />}
        {reviewItem && <PrePublishReviewDialog item={reviewItem} onOpenChange={(open) => !open && setReviewItem(null)} onOpenPublish={(item) => { setReviewItem(null); setPublishItem(item); }} onOpenNotifications={(item) => { setReviewItem(null); setNotificationItem(item); }} onPublish={(item) => { const published = publishManagedItem(item); if (published) setReviewItem(null); }} />}

        {jsonOpen && (
          <JsonAuthoringDialog
            open={jsonOpen}
            onOpenChange={setJsonOpen}
            jsonTab={jsonTab}
            setJsonTab={setJsonTab}
            jsonText={jsonText}
            setJsonText={setJsonText}
            jsonError={jsonError}
            setJsonError={setJsonError}
            prettyJson={prettyJson}
            copyJson={copyJson}
            importJson={importJson}
            currentForm={form}
          />
        )}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ログアウトしますか？</DialogTitle>
              <DialogDescription>現在のセッションを終了して、ログイン画面に戻ります。</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>キャンセル</Button>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={confirmLogout}>ログアウト</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Suspense>

    </div>
  );
}
