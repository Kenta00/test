import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GEMINI;
const MODEL_PREFERENCE = [
  process.env.GEMINI_MODEL,
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
].filter(Boolean);

function buildSystemPrompt() {
  return [
    "You generate a Google Forms-like form authoring JSON object.",
    "Return only valid JSON. Do not wrap the result in markdown fences.",
    "The root object must contain version, title, description, settings, sections, and questions.",
    "sections must be an array of objects with title and description.",
    "questions must be an array of objects with section, type, title, description, required, and optional placeholder, example, validation, options, allowOther, randomizeOptions, fileTypes, maxFiles, branch.",
    "Use only these question types: shortText, radio, checkbox, file.",
    "For radio and checkbox, include options as a non-empty array of strings.",
    "For file, include fileTypes and maxFiles.",
    "branch, if present, must use enabled, option, and targetSection.",
    "targetSection must be one of the section titles, or '送信完了'.",
    "Do not include ids, sectionId, or any internal identifiers.",
    "When a current form is provided, edit that form according to the latest request and preserve everything the user did not ask to change.",
    "Use concise, natural Japanese unless the user explicitly requests another language.",
  ].join("\n");
}

function buildUserPrompt(prompt, currentForm) {
  if (!currentForm) return `Create a new form from this request:\n${prompt}`;
  return [
    "Update the current form using the latest request.",
    `Latest request: ${prompt}`,
    "Current form:",
    JSON.stringify(currentForm),
  ].join("\n\n");
}

function buildDiagnosisSystemPrompt() {
  return [
    "You are a UX expert reviewing a Google Forms-like form before publication.",
    "Return only valid JSON with summary, score, and issues.",
    "score must be an integer from 0 to 100.",
    "issues must be an array with severity, title, detail, and suggestion.",
    "severity must be high, medium, or low.",
    "Check ambiguity, answer burden, excessive required fields, overlapping or missing options, privacy-sensitive data, question order, and accessibility.",
    "Do not invent facts outside the supplied form. Respond in concise Japanese.",
  ].join("\n");
}

function extractJsonText(text) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) return trimmed.slice(firstBrace, lastBrace + 1);
  return trimmed;
}

async function getSupportedModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(API_KEY)}`);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error?.message || `Gemini model list failed with status ${response.status}.`;
    throw new Error(message);
  }

  return Array.isArray(data?.models)
    ? data.models
      .map((model) => ({
        name: typeof model?.name === "string" ? model.name.replace(/^models\//, "") : "",
        methods: Array.isArray(model?.supportedGenerationMethods) ? model.supportedGenerationMethods : [],
      }))
      .filter((model) => model.name)
    : [];
}

async function pickModel() {
  const supportedModels = await getSupportedModels();
  const supportedNames = new Set(
    supportedModels.filter((model) => model.methods.includes("generateContent")).map((model) => model.name),
  );

  for (const candidate of MODEL_PREFERENCE) {
    if (supportedNames.has(candidate)) return candidate;
  }

  return supportedModels.find((model) => model.methods.includes("generateContent"))?.name || "";
}

async function callGemini(model, prompt, systemPrompt = buildSystemPrompt()) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(API_KEY)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
      },
    }),
  });

  const data = await response.json().catch(() => null);
  return { response, data };
}

export async function POST(request) {
  if (!API_KEY) {
    return NextResponse.json({ error: "Gemini API key is not configured. Set GEMINI_API_KEY or GEMINI in .env." }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required." }, { status: 400 });
  }
  if (prompt.length > 4000) {
    return NextResponse.json({ error: "prompt must be 4000 characters or fewer." }, { status: 400 });
  }
  const currentForm = body?.currentForm && typeof body.currentForm === "object" ? body.currentForm : null;
  const isDiagnosis = body?.mode === "diagnose";
  if (isDiagnosis && !currentForm) {
    return NextResponse.json({ error: "currentForm is required for diagnosis." }, { status: 400 });
  }
  const generationPrompt = isDiagnosis
    ? `Review this form before publication:\n\n${JSON.stringify(currentForm)}`
    : buildUserPrompt(prompt, currentForm);
  const systemPrompt = isDiagnosis ? buildDiagnosisSystemPrompt() : buildSystemPrompt();

  let selectedModel = "";
  try {
    selectedModel = await pickModel();
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  if (!selectedModel) {
    return NextResponse.json({ error: "No Gemini model with generateContent support was found for this API key." }, { status: 502 });
  }

  let response;
  let data;
  try {
    ({ response, data } = await callGemini(selectedModel, generationPrompt, systemPrompt));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  if (!response.ok) {
    const alternateCandidates = MODEL_PREFERENCE.filter((candidate) => candidate !== selectedModel);
    for (const candidate of alternateCandidates) {
      ({ response, data } = await callGemini(candidate, generationPrompt, systemPrompt));
      if (response.ok) {
        selectedModel = candidate;
        break;
      }
    }

    if (!response.ok) {
      const message = data?.error?.message || `Gemini request failed with status ${response.status}.`;
      return NextResponse.json({ error: message, model: selectedModel }, { status: 502 });
    }
  }

  const candidateText = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text ?? "").join("") || "";
  const jsonText = extractJsonText(candidateText);

  let form;
  try {
    form = JSON.parse(jsonText);
  } catch {
    return NextResponse.json({ error: "Gemini response was not valid JSON.", raw: candidateText, model: selectedModel }, { status: 502 });
  }

  if (isDiagnosis) {
    const issues = Array.isArray(form?.issues) ? form.issues.filter((issue) => issue && typeof issue === "object") : [];
    return NextResponse.json({
      diagnosis: {
        summary: typeof form?.summary === "string" ? form.summary : "診断が完了しました。",
        score: Math.max(0, Math.min(100, Math.round(Number(form?.score) || 0))),
        issues: issues.map((issue) => ({
          severity: ["high", "medium", "low"].includes(issue.severity) ? issue.severity : "medium",
          title: typeof issue.title === "string" ? issue.title : "確認項目",
          detail: typeof issue.detail === "string" ? issue.detail : "",
          suggestion: typeof issue.suggestion === "string" ? issue.suggestion : "",
        })).slice(0, 10),
      },
      model: selectedModel,
    });
  }

  return NextResponse.json({ form, model: selectedModel });
}
