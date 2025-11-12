function scoring() {
  // 回答内容の評価
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  // 基本情報の取得
  const infoSheet = spreadsheet.getSheetByName('info');
  const qn = infoSheet.getRange(3, 2).getValue();
  const nmax = infoSheet.getRange(4, 2).getValue();
  // 
  const answerSheet = spreadsheet.getSheetByName('フォームの回答 1');
  //
  const ansID = 2;
  const ansIdx = 3;
  const ansState = qn + 3;
  const evalState = qn + 2;
  //
  let targets = [];
  //
  try {
    // 結果の記録先
    const scoreSheet = spreadsheet.getSheetByName('score');
    const lastScore = scoreSheet.getLastRow();
    // 評価基準
    const evalSheet = spreadsheet.getSheetByName('answer');
    let prompts = [];
    for (let q = 0; q < qn; q++) {
      prompts.push(`${evalSheet.getRange(1,1).getValue()}\n${evalSheet.getRange(1,q+2).getValue()}`);
    }
    //
    const nrow = answerSheet.getLastRow();
    let count = 0;
    let row = 2;
    let answers = [];
    for (let q = 0; q < qn; q++) answers.push([]);
    //
    while(count < nmax && row <= nrow) {
      const status = answerSheet.getRange(row, ansState).getValue();
      if (status === '済' || status === '採点中') row++;
      else {
        targets.push(row);
        answerSheet.getRange(row, ansState).setValue('採点中');
        const values = answerSheet.getRange(row, ansIdx, 1, qn).getValues();
        for (let q = 0; q < qn; q++) {
          answers[q].push(values[0][q]);
        }
        row++;
        count++;
      }
    }
    // 採点対象がなければ終了
    if (count == 0) return;
    //　採点
    let results = []
    for (let q = 0; q < qn; q++) {
      const prompt = `${prompts[q]}\n学生からの回答\n${JSON.stringify(answers[q])}`;
      //
      //console.log(prompt);
      let res = askGemini(prompt);
      //console.log(res);
      res = res.replace("```json", "");
      res = res.replace("```", "");
      //
      results.push(JSON.parse(res));
    }
    //　採点結果の反映
    for (let r = 0; r < count; r++) {
      // メールアドレス
      scoreSheet.getRange(targets[r],1).setValue(answerSheet.getRange(targets[r], ansID).getValue());
      // 評価の記録
      for (let q = 0; q < qn; q++) {
        scoreSheet.getRange(targets[r],q + 2).setValue(JSON.stringify(results[q][r]));
      }
      // 状態更新
      answerSheet.getRange(targets[r], ansState).setValue('済');
      scoreSheet.getRange(targets[r], evalState).setValue('未');
    }
  } catch (error) {
    console.error('ステータスの書き込み中にエラーが発生しました: ' + error.toString());
    for(row in targets) {
      answerSheet.getRange(row, ansState).setValue('');
    }
  }
}
