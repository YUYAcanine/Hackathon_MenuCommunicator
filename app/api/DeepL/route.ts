import { NextResponse } from "next/server";

const apiKey = process.env.DEEPL_API_KEY;
const apiUrl = "https://api-free.deepl.com/v2/translate";

if (!apiKey) {
    console.error("DeepL API key is not found. Check your .env.local file.");
}

const languageMap: { [key: string]: string } = {
    "Japan": "JA",
    "Spain": "ES",
    "France": "FR",
    "Germany": "DE",
    "Korea": "KO"
};

export async function POST(request: Request) {
    try {
        const { phrases, selectedCountry } = await request.json();
        if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
            return NextResponse.json({ error: "翻訳する文章が必要です" }, { status: 400 });
        }

        const targetLang = languageMap[selectedCountry] || "ES"; // デフォルトはスペイン語

        const translatedPhrases = await Promise.all(
            phrases.map(async (text) => {
                try {
                    const response = await fetch(apiUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Authorization": `DeepL-Auth-Key ${apiKey}`
                        },
                        body: new URLSearchParams({
                            text,
                            target_lang: targetLang
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`DeepL API Error (${response.status}):`, errorText);
                        return { translation: "翻訳エラー", pronunciation: "" };
                    }

                    const data = await response.json();
                    return {
                        translation: data.translations?.[0]?.text || "翻訳エラー",
                        pronunciation: "(発音データなし)" // DeepLは発音を提供しない
                    };
                } catch (error) {
                    console.error("翻訳エラー", error);
                    return { translation: "翻訳エラー", pronunciation: "" };
                }
            })
        );

        return NextResponse.json({ translatedPhrases });
    } catch (error) {
        console.error("Error generating translation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "予期しないエラーが発生しました" },
            { status: 500 }
        );
    }
}
