import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 画像をbase64に変換するヘルパー関数
function bufferToGenerativePart(buffer: Buffer, mimeType: string) {
    return {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType
      },
    };
  }

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    throw new Error("API key is not found");
}

const genAI = new GoogleGenerativeAI(apiKey);


export async function POST(request: Request) {
    console.log('Request:', request);
    try {
        const formData = await request.formData();
        const images = formData.getAll('images') as File[];

        if (images.length === 0) {
            return NextResponse.json({ error: '少なくとも1つの画像が必要です' }, { status: 400 });
        }

        // 画像をBufferに変換
        const imageParts = await Promise.all(
            images.map(async (image) => {
                const arrayBuffer = await image.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return bufferToGenerativePart(buffer, image.type);
            })
        );
        
        const prompt = `
            入力画像はメニュー表です．このメニュー表を解析し，各メニューについての情報を記述してください．
            ・料理名（原文）
            料理名を原文のまま記述してください．
            ・料理名（日本語）
            固有名詞はカタカナにし，自然な翻訳にしてください．
            ・料理の説明
            料理の概要を記述してください．日本人にも理解できるように詳細な説明を100文字程度で記述してください．
            ・価格
            料理の価格を記述してください．料理ごとに価格が記述されていない場合はメニュー表の情報から推測してください．

            下記のJSONスキーマを参考に正確に記述してください．originalMenuNameは原文のメニュー名，translatedMenuNameはメニュー名の日本語訳，descriptionはメニューの概要，priceはメニューの価格です．
            {
                originalMenuName: string,
                translatedMenuName: string,
                description: string,
                price: string
            }`;

        // モデルを取得
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
        });

        // プロンプトを生成AIに送信
        const result = await model.generateContent([prompt, ...imageParts]);
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
