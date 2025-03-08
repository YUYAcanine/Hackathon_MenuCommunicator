import { NextRequest, NextResponse } from "next/server";

// 環境変数から必要なAPIキーとエンジンIDを取得
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

export async function POST(req: NextRequest) {
  try {
    // リクエストボディからクエリ（検索キーワード）を取得
    const { query } = await req.json();
    
    if (!query) {
      return NextResponse.json(
        { error: "検索クエリが必要です" },
        { status: 400 }
      );
    }
    
    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      return NextResponse.json(
        { error: "APIキーまたはエンジンIDが設定されていません" },
        { status: 500 }
      );
    }

    // Google Custom Search APIへのリクエストURLを構築
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&searchType=image&num=1&e=-facebook.com&e=-x.com`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // 画像検索結果がない場合
    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { error: "画像が見つかりませんでした", query },
        { status: 404 }
      );
    }
    
    // 最初の検索結果の画像URLを返す
    const imageUrl = data.items[0].link;
    
    return NextResponse.json({ imageUrl, query });
  } catch (error) {
    console.error("Google Search API error:", error);
    return NextResponse.json(
      { error: "画像検索中にエラーが発生しました" },
      { status: 500 }
    );
  }
}