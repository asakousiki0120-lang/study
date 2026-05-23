import { useState } from 'react'
import './App.css'

const SAMPLE_OUTPUT = {
  "subject": "数学",
  "range": "二次関数、図形の相似、平方根",
  "analysis": "二次関数の最大値・最小値問題が頻出（配点比率約 30%）。図形の相似条件と線分比の計算が重要（約 25%）。平方根の有理化と近似値計算は基礎問題として必ず出題（約 20%）。過去問分析から、応用問題は二次関数と図形の融合問題が出やすい傾向。",
  "weakness": "現在の理解度 60% から推測：二次関数の場合分けが必要な最大値・最小値問題で失点している可能性大。図形の相似における補助線の引き方が苦手な傾向。平方根の有理化は計算ミスによる失点が見込まれる。",
  "study_plan": "【午前 30 分】二次関数の最大値・最小値の問題を 5 問（軸の場合分けに焦点）。【午後 40 分】図形の相似で補助線を引く典型問題を 3 問。【夜 20 分】平方根の有理化を 10 問でスピード向上。間違えた問題は即時解説を読み、類似問題を 1 問追加。",
  "problems": [
    "y = -x² + 4x + 1 (0 ≤ x ≤ a) の最大値を求めよ（a は定数）",
    "△ABC において、AB=6, BC=8, AC=10 である。∠B の二等分線と AC の交点を D とするとき、AD:DC を求めよ。",
    "√18 + √50 - √32 を計算せよ。",
    "y = x² - 2ax + a² + 1 (0 ≤ x ≤ 3) の最小値を求めよ（a は定数）",
    "底辺の長さが相似比の 2 乗に比例することを利用して、面積比から線分比を求める問題を解け"
  ],
  "prediction": "現在の実力：72 点/100 点。学年 1 位ライン：92 点/100 点。上記計画を 3 日間実施で 85 点到達予測。1 週間継続で 93 点到達可能。",
  "next_action": "今すぐ二次関数の最大値・最小値の問題を 1 問解く。制限時間 5 分で解答し、間違えた場合は解法パターンをノートにまとめる。"
}

function App() {
  const [subject, setSubject] = useState('')
  const [range, setRange] = useState('')
  const [understanding, setUnderstanding] = useState('60')
  const [pastScore, setPastScore] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // シミュレーション：実際には API を呼び出す
    setTimeout(() => {
      setResult(SAMPLE_OUTPUT)
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🎓 学年 1 位製造 AI</h1>
        <p>最短で学年 1 位を取るための最適化学習プラン</p>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-group">
            <label>教科名</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required>
              <option value="">選択してください</option>
              <option value="数学">数学</option>
              <option value="英語">英語</option>
              <option value="国語">国語</option>
              <option value="理科">理科</option>
              <option value="社会">社会</option>
            </select>
          </div>

          <div className="form-group">
            <label>テスト範囲</label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="例：二次関数、図形の相似"
              required
            />
          </div>

          <div className="form-group">
            <label>現在の理解度 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={understanding}
              onChange={(e) => setUnderstanding(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>過去の点数 (任意)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={pastScore}
              onChange={(e) => setPastScore(e.target.value)}
              placeholder="例：75"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '分析中...' : '学習プランを生成'}
          </button>
        </form>

        {result && (
          <div className="result">
            <section className="result-section">
              <h2>📊 分析結果</h2>
              <div className="card">
                <h3>{result.subject} - {result.range}</h3>
                <p>{result.analysis}</p>
              </div>
            </section>

            <section className="result-section">
              <h2>🎯 弱点分析</h2>
              <div className="card warning">
                <p>{result.weakness}</p>
              </div>
            </section>

            <section className="result-section">
              <h2>📅 今日やるべきこと</h2>
              <div className="card success">
                <p>{result.study_plan}</p>
              </div>
            </section>

            <section className="result-section">
              <h2>📝 自動生成問題</h2>
              <div className="problems">
                {result.problems.map((problem, index) => (
                  <div key={index} className="card problem">
                    <span className="problem-number">問{index + 1}</span>
                    <p>{problem}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="result-section">
              <h2>🔮 点数予測</h2>
              <div className="card info">
                <p>{result.prediction}</p>
              </div>
            </section>

            <section className="result-section">
              <h2>🚀 次のアクション</h2>
              <div className="card action">
                <p className="next-action">{result.next_action}</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
