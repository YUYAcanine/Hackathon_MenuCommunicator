import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("API key is not found");

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let translatedLanguage = "Japan"; // デフォルト値
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

        if (images.length === 0) {
            return NextResponse.json({ error: "少なくとも1つの画像が必要です" }, { status: 400 });
        }

        const languageMap: { [key: string]: string } = {
            "Japan": "日本語",
            "Spain": "スペイン語",
            "France": "フランス語",
            "Germany": "ドイツ語",
            "Korea": "韓国語",
            "Vietnam": "ベトナム語",
            "Thailand": "タイ語",
            "English": "英語",
            "China": "中国語"
        };
        const targetLanguage = languageMap[translatedLanguage] || "日本語"; // デフォルトは日本語

        console.log("Target Language:", targetLanguage); // デバッグYUYA

        const imageParts = await Promise.all(
            images.map(async (image) => {
                const arrayBuffer = await image.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                return {
                    inlineData: { data: buffer.toString("base64"), mimeType: image.type },
                };
            })
        );

        const prompt = `
            入力画像はメニュー表です．このメニュー表を解析し，各メニューについての以下の6つの情報を記述してください．
            正確な情報を記述してください．フォーマットに従って必ず6つの情報を記述してください．
            情報が不足，欠落することは許されません．全て${targetLanguage}での回答をお願いします。
            料理名以外の場所では${targetLanguage}以外の言語を使っての説明を禁止します。

            ・料理名（原文）
            料理名を原文のまま記述してください．
            ・料理名（${targetLanguage}）
            固有名詞はカタカナにし，自然な翻訳にしてください．
            ・料理の説明（${targetLanguage}）
            料理の概要を記述してください．日本人にも理解できるように詳細な説明を150文字程度で記述してください．
            ・価格
            料理の価格を通貨記号付きで記述してください (例：$40.5)．
            ・辛さ情報
            辛さのレベルを予想して記述してください．0から5の数字で表現してください．
            ・アレルギー情報（${targetLanguage}）
            使用されている可能性があるアレルギー原材料を記述してください．

            JSON形式で出力してください:
            {
                originalMenuName: string,
                translatedMenuName: string,
                description: string,
                price: string,
                spicyLevel: number,
                allergyInfo: string[]
            }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
        });

        const responseText = result.response.text();

        return NextResponse.json({ response: responseText });
    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
