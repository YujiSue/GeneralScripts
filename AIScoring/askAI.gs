function askGemini(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。setApiKey()を先に実行してください。');
  }
  // GeminiのエンドポイントURL
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;
  // APIに送信するデータ（ペイロード）
  const requestBody = {
    "contents": [{
      "parts": [{
        "text": prompt
      }]
    }],
    /* 医学部の問題の場合、意図せず回答内容がセーフティにひっかかる可能性がある。
    　（遺伝など→人種差別、組織・解剖・生理学など→性的コンテンツ、毒・細菌など→有害情報）
    テストしてみて、不適切な回答を含むというエラーが返ってくる場合は、下記の設定でセーフティを解除する
    "safetySettings": [
      { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
      { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" }
    ]
    */
  };
  //
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(requestBody),
    'muteHttpExceptions': true // エラー時に例外をスローせず、レスポンスを返す
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseBody = response.getContentText();
    
    if (responseCode === 200) {
      const jsonResponse = JSON.parse(responseBody);
      // レスポンスの構造を安全に辿り、テキスト部分を抽出
      if (jsonResponse.candidates && jsonResponse.candidates.length > 0 &&
        jsonResponse.candidates[0].content && jsonResponse.candidates[0].content.parts &&
        jsonResponse.candidates[0].content.parts.length > 0) {
          return jsonResponse.candidates[0].content.parts[0].text.trim();
      } else {
        // 回答が含まれていない場合（セーフティ設定によるブロックなど）
        return "エラー: Geminiからの有効な回答がありません。不適切な回答を含んでいた可能性があります。";
      }
    } else {
      return `エラー: APIから問題が報告されました (コード: ${responseCode})。内容: ${responseBody}`;
    }
  } catch (e) {
    return "API呼び出しエラー: " + e.toString();
  }
}
