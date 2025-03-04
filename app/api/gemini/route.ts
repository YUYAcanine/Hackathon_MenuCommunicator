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
            入力画像はメニュー表です．このメニュー表を解析し，各メニューについての以下の6つの情報を記述してください．
            正確な情報を記述してください．フォーマットに従って必ず6つの情報を記述してください．
            情報が不足，欠落することは許されません．

            ・料理名（原文）
            料理名を原文のまま記述してください．
            ・料理名（日本語）
            固有名詞はカタカナにし，自然な翻訳にしてください．
            ・料理の説明
            料理の概要を記述してください．日本人にも理解できるように詳細な説明を150文字程度で記述してください．
            ・価格
            料理の価格を通貨記号付きで記述してください (例：$40.5)．料理ごとに価格が記述されておらず，まとめて記述されている場合はメニュー表の情報から推測してください．
            ・辛さ情報
            辛さのレベルを予想して記述してください．辛さのレベルは、0から5の数字で表現してください．
            ・アレルギー情報
            アレルギー特定原材料8品目と，それに準ずるもの20品目のうち，使用されている可能性があるものを記述してください．


            下記のJSONスキーマを参考に正確に記述してください．originalMenuNameは原文のメニュー名，translatedMenuNameはメニュー名の日本語訳，descriptionはメニューの概要，priceはメニューの価格です．
            {
                originalMenuName: string,
                translatedMenuName: string,
                description: string,
                price: string
                spicyLevel: number,
                allergyInfo: string[]
            }
            
            例:
            {
                originalMenuName: "taco",
                translatedMenuName: "タコス",
                description: "タコスは、メキシコ発祥の伝統的な料理で、トウモロコシや小麦の薄い生地（トルティーヤ）に、肉、野菜、チーズ、サルサなどを包んで食べる。具材は牛肉、鶏肉、魚、豆など多様で、辛さや味付けも地域によって異なる。",
                price: "$40.5"
                spicyLevel: 3,
                allergyInfo: ["たまご", "乳", バナナ]
            }`;

        // モデルを取得
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
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
