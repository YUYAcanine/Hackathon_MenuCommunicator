//route.ts/gemini

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("API key is not found");

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let translatedLanguage = "Japan"; // デフォルト値abc
        let images: File[] = [];

        if (contentType.includes("application/json")) {
            const body = await request.json();
            translatedLanguage = body.translatedLanguage || "Japan";
        } else if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            translatedLanguage = formData.get("translatedLanguage") as string || "Japan";
            images = formData.getAll("images") as File[];
        } else {
            return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
        }

        if (!contentType.includes("multipart/form-data")) {
            return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
        }

        if (images.length === 0) {
            return NextResponse.json({ error: "少なくとも1つの画像が必要です" }, { status: 400 });
        }

        const imageParts = await Promise.all(
            images.map(async (image) => {
                const arrayBuffer = await image.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                return {
                    inlineData: { data: buffer.toString("base64"), mimeType: image.type },
                };
            })
        );

        // 言語判定用プロンプト
        const detectLanguagePrompt = `
            以下のメニューの言語を判定してください。
            言語名のみを **純粋な JSON 形式** で出力してください。他の説明文は不要です。
            出力形式:
            {"detectedLanguage": "言語名"}
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const languageResult = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: detectLanguagePrompt }, ...imageParts] }]
        });

        const languageResponseText = languageResult.response.text();
        console.log("Raw Language Response:", languageResponseText); // デバッグ用

        let detectedLanguage = "Unknown";

        try {
            // JSONの開始部分と終了部分を抽出する正規表現
            const match = languageResponseText.match(/```json\n([\s\S]*?)\n```/);
            const jsonString = match ? match[1] : languageResponseText; // JSON部分のみ抽出

            detectedLanguage = JSON.parse(jsonString).detectedLanguage || "Unknown";
        } catch (e) {
            console.error("Failed to parse language detection response:", e);
        }

        console.log("Detected Language before mapping:", detectedLanguage);

        // 翻訳言語マッピング
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

        detectedLanguage = detectedLanguage.trim(); // 余分なスペース削除
        const userLanguage = languageMap[translatedLanguage] || "日本語"; // デフォルトは日本語abc

        console.log("Mapped TranslatedLanguage:", userLanguage);
        console.log("TranslatedLanguage:", translatedLanguage);

        const menuAnalysisPrompt = `
            入力画像はメニュー表です．このメニュー表を解析し，各メニューについての以下の6つの情報を記述してください．
            正確な情報を記述してください．フォーマットに従って必ず6つの情報を記述してください．
            情報が不足，欠落することは許されません．全て${userLanguage}での回答をお願いします。
            料理名以外の場所では${userLanguage}以外の言語を使っての説明を禁止します。

            ・料理名（原文）
            料理名を原文のまま記述してください．
            ・料理名（${userLanguage}）
            固有名詞はカタカナにし，自然な翻訳にしてください．
            ・料理の説明（${userLanguage}）
            料理の概要を記述してください．日本人にも理解できるように詳細な説明を150文字程度で記述してください．
            ・価格
            料理の価格を通貨記号付きで記述してください (例：$40.5)．
            ・辛さ情報
            辛さのレベルを予想して記述してください．0から5の数字で表現してください．
            ・アレルギー情報（${userLanguage}）
            使用されている可能性があるアレルギー原材料を以下のフォーマットで記述してください．
            { id: "egg", name: "卵" },
            { id: "milk", name: "乳" },
            { id: "wheat", name: "小麦" },
            { id: "buckwheat", name: "そば" }

            JSON形式で出力してください:
            {
                originalMenuName: string,
                translatedMenuName: string,
                description: string,
                price: string,
                spicyLevel: number,
                allergyInfo: string[]
        `;

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: menuAnalysisPrompt }, ...imageParts] }]
        });
        

        const responseText = result.response.text();
        console.log("Raw Menu Analysis Response:", responseText); // ここを追加
        console.log("Final API Response:", { 
            detectedLanguage, 
            userLanguage,  
            menuData: responseText 
        });
        

        return NextResponse.json({ 
            detectedLanguage, // 言語判定結果を追加
            userLanguage,  // マッピングされたターゲット言語を追加
            menuData: responseText 
        });

    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred." },
            { status: 500 }
        
        );
    }
}
