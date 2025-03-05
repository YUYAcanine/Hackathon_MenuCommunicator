import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("API key is not found");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        
        
        const { phrases, selectedCountry } = await request.json(); // 日本語の注文フレーズと選択された国を受け取る
        if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
            return NextResponse.json({ error: "翻訳する文章が必要です" }, { status: 400 });
        }

        // 国に対応する言語を決定
        const languageMap: { [key: string]: string } = {
            "Japan": "日本語",
            "Spain": "スペイン語",
            "France": "フランス語",
            "Germany": "ドイツ語",
            "Korea": "韓国語",
            "Vietnam": "ベトナム語",
            "Thailand": "タイ語",
            "English": "英語",
            "Chinese": "中国語"
          };
        const targetLanguage = languageMap[selectedCountry] || "日本語"; // デフォルトは日本語

        // 翻訳プロンプト（カタカナの発音を追加）
        const prompt = `
            以下の日本語の文章を自然な${targetLanguage}に翻訳し、その発音をカタカナで記述してください。
            出力は **必ず** JSON 形式で提供してください。

            日本語の文章:
            ${phrases.map((phrase, index) => `${index + 1}. ${phrase}`).join("\n")}

            出力形式（JSON）:
            \`\`\`json
            [
                { "translation": "${targetLanguage}の翻訳1", "pronunciation": "カタカナの発音1" },
                { "translation": "${targetLanguage}の翻訳2", "pronunciation": "カタカナの発音2" }
            ]
            \`\`\`
            JSON 形式を正確に守ってください。
        `;

        // Gemini API モデルを取得
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Gemini API に翻訳リクエストを送信
        const result = await model.generateContent(prompt);
        const textResponse = await result.response.text();

        let translatedPhrases;
        try {
            // JSON 形式の部分のみを抽出
            const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                throw new Error("JSON形式のデータが見つかりませんでした");
            }
            translatedPhrases = JSON.parse(jsonMatch[1]);
        } catch (parseError) {
            console.error("JSON parsing error:", parseError);
            return NextResponse.json({ error: "翻訳データの解析に失敗しました" }, { status: 500 });
        }

        return NextResponse.json({ translatedPhrases });
    } catch (error) {
        console.error("Error generating translation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
