import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY が設定されていません");

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

export async function POST(req: Request) {
  const body = await req.json();
  const menuItems = body.menuItems as { name: string; price: string }[];
  const translatedLanguage = body.translatedLanguage as string ?? "日本語";

  if (!menuItems?.length) {
    return NextResponse.json({ error: "menuItems が空です" }, { status: 400 });
  }

  const joined = menuItems
    .map((m, i) => `${i + 1}. ${m.name} - ${m.price}`)
    .join("\n");

  const prompt = `
以下のリストは料理名と価格のみです。各料理について次の情報を ${translatedLanguage} で補完し、JSON 配列で出力してください。
・originalMenuName
・translatedMenuName
・description（150文字程度）
・price（そのまま）
・spicyLevel（0〜5）
・allergyInfo（例: [{ "id":"egg","name":"卵" }]）

リスト:
${joined}
`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const jsonString = raw.match(/```json\n([\s\S]*?)\n```/)?.[1] || raw;

  try {
    const detailedMenus = JSON.parse(jsonString);
    return NextResponse.json({ detailedMenus });
  } catch (e) {
    return NextResponse.json(
      { error: "詳細 JSON の解析に失敗しました", raw },
      { status: 500 }
    );
  }
}
