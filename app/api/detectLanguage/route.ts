import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("API key is missing");

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let images: File[] = [];

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            images = formData.getAll("images") as File[];
        } else {
            return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
        }

        if (images.length === 0) {
            return NextResponse.json({ error: "少なくとも1つの画像が必要です" }, { status: 400 });
        }

        // 画像を Base64 にエンコード
        const imageParts = await Promise.all(
            images.map(async (image) => {
                const arrayBuffer = await image.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                return {
                    inlineData: { data: buffer.toString("base64"), mimeType: image.type },
                };
            })
        );

        // 言語検出用プロンプト
        const prompt = `
            あなたのタスクは、提供された画像の言語を特定することです。
            画像内のテキストの言語を一つだけ特定し、JSON 形式で返してください。

            出力フォーマット:
            {
                "detectedLanguage": "言語名"
            }
        `;

        // Gemini API へリクエスト送信
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }, ...imageParts] }]
        });
        
        const responseText = result.response.text();
        
        // 🔥 JSONコードブロックを抽出してからパース
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
            console.error("JSON の抽出に失敗:", responseText);
            return NextResponse.json({ error: "JSON extraction failed" }, { status: 500 });
        }
        
        const jsonString = jsonMatch[1]; // 抽出したJSON部分
        const parsedData = JSON.parse(jsonString); // ここでエラーがなくなる
        
        const detectedLanguage = parsedData?.detectedLanguage || "Unknown";
        
        return NextResponse.json({ detectedLanguage });
    } catch (error) {
        console.error("Error detecting language:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unexpected error occurred." },
            { status: 500 }
        );
    }
}
