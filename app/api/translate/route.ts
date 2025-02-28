import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("API key is not found");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const { phrases } = await request.json(); // 日本語の注文フレーズを受け取る
        if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
            return NextResponse.json({ error: "翻訳する文章が必要です" }, { status: 400 });
        }

        // 翻訳プロンプト（カタカナの発音を追加）
        const prompt = `
            以下の日本語の文章を自然なスペイン語に翻訳し、その発音をカタカナで記述してください：
            
            ${phrases.map((phrase, index) => `${index + 1}. ${phrase}`).join("\n")}

            出力は、JSON配列で以下のようにしてください：
            [
                { "translation": "スペイン語の翻訳1", "pronunciation": "カタカナの発音1" },
                { "translation": "スペイン語の翻訳2", "pronunciation": "カタカナの発音2" }
            ]
        `;

        // Gemini API モデルを取得
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Gemini API に翻訳リクエストを送信
        const result = await model.generateContent(prompt);
        const textResponse = await result.response.text();

        // JSON形式の翻訳結果を抽出
        const translatedPhrases = JSON.parse(textResponse.match(/\[([\s\S]*?)\]/)?.[0] || "[]");

        return NextResponse.json({ translatedPhrases });
    } catch (error) {
        console.error("Error generating translation:", error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred." },
            { status: 500 }
        );
    }
}

