import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY が設定されていません");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/** JSON 文字列を安全に取り出すヘルパー（```json ...``` / [ ... ] / Fallback） */
const extractJson = (raw: string): string | null => {
  let s = raw.match(/```json\s*([\s\S]*?)\s*```/)?.[1];
  if (!s && raw.trim().startsWith("[")) s = raw.trim();
  if (!s) {
    const first = raw.indexOf("[");
    const last = raw.lastIndexOf("]");
    if (first !== -1 && last !== -1 && last > first) s = raw.slice(first, last + 1);
  }
  return s ?? null;
};

export async function POST(req: Request) {
  /* ---------- 画像取得 ---------- */
  const formData = await req.formData();
  const images = formData.getAll("images") as File[];
  const translatedLanguage = (formData.get("translatedLanguage") as string) ?? "日本語";

  if (images.length === 0) {
    return NextResponse.json({ error: "画像がありません" }, { status: 400 });
  }

  /* ---------- Base64 化 ---------- */
  const parts = await Promise.all(
    images.map(async (f) => {
      const buf = Buffer.from(await f.arrayBuffer());
      return { inlineData: { data: buf.toString("base64"), mimeType: f.type || "image/jpeg" } };
    })
  );

  /* ---------- ① 言語判定 ---------- */
  const detectPrompt = `
以下の画像は飲食メニューです。このメニューが書かれている言語を 1 語で日本語で答え、
必ず **\`\`\`json** ブロックで次の形式だけを出力してください。

\`\`\`json
{ "detectedLanguage": "韓国語" }
\`\`\`
`;

  const detectRes = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: detectPrompt }, ...parts] }],
  });
  const detectRaw = detectRes.response.text();
  let detectedLanguage = "Unknown";

  try {
    const jsonStr = extractJson(detectRaw);
    if (jsonStr) detectedLanguage = JSON.parse(jsonStr).detectedLanguage ?? "Unknown";
  } catch {
    /* noop → Unknown のまま */
  }

  /* ---------- ② 料理名 + 価格抽出 ---------- */
  const menuPrompt = `
以下の画像から料理名（原文）と価格だけを JSON 配列で抽出してください。
価格は通貨記号込みでそのまま記載してください。 **必ず \`\`\`json** で囲んでください。

例:
\`\`\`json
[
  { "name": "Tonkotsu Ramen", "price": "¥980" },
  { "name": "Gyoza (6pcs)", "price": "¥480" }
]
\`\`\`
`;

  const menuRes = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: menuPrompt }, ...parts] }],
  });
  const menuRaw = menuRes.response.text();
  const menuJsonStr = extractJson(menuRaw);

  try {
    const menuList = menuJsonStr ? JSON.parse(menuJsonStr) : [];
    return NextResponse.json({
      detectedLanguage,
      translatedLanguage, // クライアントが指定した表示言語
      menuList,
    });
  } catch {
    return NextResponse.json(
      { error: "メニュー JSON 解析に失敗しました", raw: menuRaw },
      { status: 500 }
    );
  }
}
