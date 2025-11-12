function sendMail() {
  // 評価の返却
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    // 基本情報の取得
    const infoSheet = spreadsheet.getSheetByName('info');
    const subject = `${infoSheet.getRange(1,2).getValue()} 小テスト採点結果の返却`;
    // Cc生成
    const options = {'cc': infoSheet.getRange(2,2).getValue()};    
    // 結果の記録先
    const scoreSheet = spreadsheet.getSheetByName('score');
    const nrow = scoreSheet.getLastRow();
    // 
    const qn = infoSheet.getRange(3,2).getValue();
    const stateCol = qn + 2;
    const mailTo = 0;
    const qStart = 1;
    //
    for(let r = 1; r < nrow; r++) {
      // ステータスチェック
      const state = scoreSheet.getRange(r + 1, stateCol).getValue();
      // 返信済ならスキップ
      if (state != '未') continue;
      // 行データの取得
      const values = scoreSheet.getRange(r + 1, 1, 1, qn + 2).getValues();
      // メールアドレス取得
      const to = values[0][mailTo];
      // メール本文
      let body = "";
      body += "============================================================\n\n";
      for (let q = 0; q < qn; q++) {
        const evaluated = JSON.parse(values[0][qStart+q]);
        body += `【Q${q+1}】\n評点：${evaluated['score']}\n${evaluated['note']}\n\n`;
      }
      //
      body += "============================================================\n\n";
      //
      GmailApp.sendEmail(to, subject, body, options);
      scoreSheet.getRange(r + 1, stateCol).setValue('済');
    }   
  } catch (error) {
    console.error('[Error] ' + error.toString());
  }
}
