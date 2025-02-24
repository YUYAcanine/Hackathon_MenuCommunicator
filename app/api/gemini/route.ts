import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("API key is not found");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
    console.log('Request:', request);
    try {
        const { input } = await request.json();
        const prompt = `"${input}"について100文字程度で解説してください`;

        // モデルを取得
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });

        // プロンプトを生成AIに送信
        const result = await model.generateContent(prompt);
        console.log('Result:', result);

        // 結果をレスポンスとして返却
        return NextResponse.json({
            response: result.response.text(),
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error generating content:", error.message);

            return NextResponse.json(
            {
                error: error.message || "An unexpected error occurred.",
            },
            { status: 500 }
            );
        } else {
            console.error("Unknown error:", error);

            return NextResponse.json(
            {
                error: "An unexpected error occurred.",
            },
            { status: 500 }
            );
        }
    }
}
