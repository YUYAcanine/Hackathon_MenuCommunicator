import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("API key is not found");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const { phrases, detectedLanguage } = await request.json(); // 言語判定結果を受け取る
        if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
            return NextResponse.json({ error: "翻訳する文章が必要です" }, { status: 400 });
        }
        if (!detectedLanguage) {
            return NextResponse.json({ error: "言語判定結果が必要です" }, { status: 400 });
        }

        // 言語判定結果を翻訳先の言語にマッピング
        const languageMap: { [key: string]: string } = {
            "Japanese": "日本語",
            "Spanish": "スペイン語",
            "French": "フランス語",
            "German": "ドイツ語",
            "Korean": "韓国語",
            "Vietnamese": "ベトナム語",
            "Thai": "タイ語",
            "English": "英語",
            "Chinese": "中国語"
        };
        const menuLanguage = languageMap[detectedLanguage] || "日本語"; // デフォルトは日本語

        // 翻訳プロンプト
        const prompt = `
            以下の日本語の文章を自然な${menuLanguage}に翻訳し、その発音をカタカナで記述してください。
            出力は **必ず** JSON 形式で提供してください。

            日本語の文章:
            ${phrases.map((phrase, index) => `${index + 1}. ${phrase}`).join("\n")}

            出力形式（JSON）:
            \`\`\`json
            [
                { "translation": "${menuLanguage}の翻訳1", "pronunciation": "カタカナの発音1" },
                { "translation": "${menuLanguage}の翻訳2", "pronunciation": "カタカナの発音2" }
            ]
            \`\`\`
            JSON 形式を正確に守ってください。
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent(prompt);
        const textResponse = await result.response.text();

        let translatedPhrases;
        try {
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                throw new Error("JSON形式のデータが見つかりませんでした");
            }
            translatedPhrases = JSON.parse(jsonMatch[1]);
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            return NextResponse.json({ error: "翻訳データの解析に失敗しました" }, { status: 500 });
        }

        return NextResponse.json({ detectedLanguage, translatedPhrases });
    } catch (error) {
        console.error("Error generating translation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
