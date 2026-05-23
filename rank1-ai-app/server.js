import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(join(__dirname, 'public')));

// Initialize SQLite Database
const dbPath = join(__dirname, 'rank1.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    grade_level TEXT,
    target_rank INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT,
    current_score REAL,
    target_score REAL,
    last_test_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS study_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    subject_id TEXT,
    date DATE,
    study_time_minutes INTEGER,
    topics_covered TEXT,
    problems_solved INTEGER,
    accuracy_rate REAL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS weaknesses (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    subject_id TEXT,
    topic TEXT,
    error_count INTEGER DEFAULT 0,
    last_reviewed DATE,
    mastery_level REAL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS study_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    subject_id TEXT,
    date DATE,
    tasks TEXT,
    completed BOOLEAN DEFAULT 0,
    actual_study_time INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );

  CREATE TABLE IF NOT EXISTS problems (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    subject_id TEXT,
    question TEXT,
    answer TEXT,
    explanation TEXT,
    difficulty_level INTEGER,
    topic TEXT,
    is_correct BOOLEAN,
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
  );
`);

// AI Engine Simulation (In production, connect to actual AI API)
class Rank1AIEngine {
  analyzeSubject(subject, range, currentScore, pastScores) {
    const analysisMap = {
      '数学': {
        keyPoints: ['関数', '図形', '確率', '方程式', '不等式'],
        frequentTopics: ['二次関数の最大最小', '相似な図形', '場合の数'],
        tips: '計算ミスを減らすため、検算を習慣化する'
      },
      '英語': {
        keyPoints: ['文法', '長文読解', 'リスニング', '英作文'],
        frequentTopics: ['関係代名詞', '不定詞と動名詞', '受動態'],
        tips: '毎日15分の音読で語感を養う'
      },
      '国語': {
        keyPoints: ['現代文読解', '古文', '漢文', '文法'],
        frequentTopics: ['接続詞の使い方', '助動詞の活用', '句形'],
        tips: '問題文を先に読み、本文を読む際に意識する'
      },
      '理科': {
        keyPoints: ['物理', '化学', '生物', '地学'],
        frequentTopics: ['電流と電圧', '化学変化', '光合成', '天体'],
        tips: '実験の手順と結果の関係を整理する'
      },
      '社会': {
        keyPoints: ['歴史', '地理', '公民'],
        frequentTopics: ['戦国時代', '地形と気候', '憲法'],
        tips: '年号と出来事をセットで覚える'
      }
    };

    const baseAnalysis = analysisMap[subject] || {
      keyPoints: ['基本事項の理解', '応用問題への対応'],
      frequentTopics: ['頻出単元の復習'],
      tips: '教科書の例題を完全に理解する'
    };

    return {
      keyPoints: baseAnalysis.keyPoints,
      frequentTopics: baseAnalysis.frequentTopics,
      tips: baseAnalysis.tips,
      rangeAnalysis: `${range}の中から特に${baseAnalysis.frequentTopics.slice(0, 2).join('、')}が狙われやすい`,
      scoreGap: this.calculateScoreGap(currentScore, subject),
      priorityOrder: this.getPriorityOrder(subject, currentScore)
    };
  }

  calculateScoreGap(currentScore, subject) {
    const targetScores = { '数学': 85, '英語': 80, '国語': 75, '理科': 80, '社会': 78 };
    const target = targetScores[subject] || 80;
    return { current: currentScore || 60, target, gap: target - (currentScore || 60) };
  }

  getPriorityOrder(subject, currentScore) {
    if (currentScore < 50) return ['基礎固め', '教科書例題', '過去問'];
    if (currentScore < 70) return ['標準問題', '苦手分野集中', '時間配分練習'];
    return ['応用問題', '時間短縮', 'ミス防止'];
  }

  estimateWeaknesses(subject, pastScores, studyLogs) {
    const commonWeaknesses = {
      '数学': ['計算ミス', '公式の適用ミス', '図形の補助線'],
      '英語': ['時制の一致', '関係代名詞', '長文の速読'],
      '国語': ['古文単語', '漢文句形', '選択肢の絞り込み'],
      '理科': ['単位変換', '実験条件の理解', 'グラフ読み取り'],
      '社会': ['年号暗記', '地名の位置', '用語の区別']
    };

    return commonWeaknesses[subject]?.slice(0, 3) || ['基本事項の理解不足'];
  }

  generateStudyPlan(subject, range, weakness, availableTime) {
    const plans = {
      '数学': [
        `① ${weakness[0] || '計算'} の強化ドリル（15分）`,
        `② ${range.split(',')[0] || '関数'} の標準問題 5問（25分）`,
        `③ 間違えた問題の解説を読み込む（10分）`,
        `④ 明日の予習：次の範囲の教科書を読む（5分）`
      ],
      '英語': [
        `① 英単語テスト範囲 20語暗記（10分）`,
        `② ${weakness[0] || '文法'} の問題集 1ページ（20分）`,
        `③ 長文読解 1題を時間を計って解く（15分）`,
        `④ 音読：今日解いた長文を3回（5分）`
      ],
      '国語': [
        `① 古文単語 10個暗記（10分）`,
        `② ${range.split(',')[0] || '現代文'} の問題 1題（25分）`,
        `③ 間違えの分析：なぜその選択肢を選んだか（10分）`,
        `④ 漢文句形の例文暗記 5つ（5分）`
      ],
      '理科': [
        `① 用語確認：${range.split(',')[0] || '電流'} の重要用語 15個（10分）`,
        `② 計算問題 5問（20分）`,
        `③ 実験の問題 2題（15分）`,
        `④ まとめノート作成（5分）`
      ],
      '社会': [
        `① 年号暗記カード 20枚（10分）`,
        `② ${range.split(',')[0] || '歴史'} の一問一答 30問（20分）`,
        `③ 地図帳で場所確認（10分）`,
        `④ 公民の用語整理（5分）`
      ]
    };

    return plans[subject] || [
      '① 教科書の該当範囲を読む（15分）',
      '② 基本問題を解く（20分）',
      '③ 間違えた問題を確認（10分）',
      '④ まとめ（5分）'
    ];
  }

  generateProblems(subject, range, weakness, count = 5) {
    const problemTemplates = {
      '数学': [
        { q: `二次関数 y = x² - 4x + 3 の頂点の座標を求めよ。`, a: '(2, -1)', topic: '二次関数' },
        { q: `連立方程式を解け：2x + 3y = 7, x - y = 1`, a: 'x=2, y=1', topic: '連立方程式' },
        { q: `確率：サイコロを2回投げたとき、目の和が7になる確率は？`, a: '1/6', topic: '確率' },
        { q: `三角形の面積を求めよ。底辺6cm、高さ4cm`, a: '12cm²', topic: '図形' },
        { q: `因数分解せよ：x² + 5x + 6`, a: '(x+2)(x+3)', topic: '因数分解' }
      ],
      '英語': [
        { q: `This is the book ( ) I bought yesterday. ①who ②which ③when`, a: '②which', topic: '関係代名詞' },
        { q: `She ( ) to school by bus every day. ①go ②goes ③going`, a: '②goes', topic: '三単現' },
        { q: `「私は昨日勉強しました」を英語に`, a: 'I studied yesterday.', topic: '過去形' },
        { q: `He is interested ( ) science. ①in ②on ③at`, a: '①in', topic: '前置詞' },
        { q: `「もっと早く走らなければならない」を英語に`, a: 'I must run faster.', topic: '助動詞' }
      ],
      '国語': [
        { q: `「〜ず」の識別：未然形＋？`, a: 'ず', topic: '古文文法' },
        { q: `漢文「学而時習之」の書き下し文`, a: '学びて時にこれを習う', topic: '漢文' },
        { q: `「しかし」「だが」「でも」は何を表すか`, a: '逆接', topic: '接続詞' },
        { q: `枕詞「あしひきの」がかかるのは？①山 ②水 ③月`, a: '①山', topic: '古文' },
        { q: `「心なし」の意味：①気持ちがない ②なんとなく ③心配り`, a: '②なんとなく', topic: '古文単語' }
      ],
      '理科': [
        { q: `オームの法則：V = ? × R`, a: 'I (電流)', topic: '電流' },
        { q: `光合成の化学反応式を書け`, a: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', topic: '光合成' },
        { q: `鉄 + 硫黄 → ?`, a: '硫化鉄', topic: '化学変化' },
        { q: `月の満ち欠けの周期は約何日か`, a: '29.5日', topic: '天体' },
        { q: `消化酵素アミラーゼはどこで分泌されるか`, a: '唾液腺・膵臓', topic: '生物' }
      ],
      '社会': [
        { q: `織田信長が本能寺の変で討たれた年は？`, a: '1582年', topic: '歴史' },
        { q: `日本の首都東京がある地方は？`, a: '関東地方', topic: '地理' },
        { q: `日本国憲法の三大原則を書け`, a: '国民主権、基本的人権の尊重、平和主義', topic: '公民' },
        { q: `徳川家康が江戸幕府を開いた年は？`, a: '1603年', topic: '歴史' },
        { q: `世界で最も広い大洋は？`, a: '太平洋', topic: '地理' }
      ]
    };

    const templates = problemTemplates[subject] || problemTemplates['数学'];
    const selected = templates.sort(() => Math.random() - 0.5).slice(0, count);
    
    return selected.map(p => ({
      id: uuidv4(),
      question: p.q,
      answer: p.a,
      explanation: `この問題は${p.topic}の基本概念を問うものです。`,
      topic: p.topic,
      difficulty: 2
    }));
  }

  predictScore(currentScore, studyHours, accuracyRate, daysUntilTest) {
    const improvement = Math.min(studyHours * 0.5 * accuracyRate, 20);
    const predicted = Math.min(currentScore + improvement, 95);
    const rank1Line = this.getRank1Line(predicted);
    
    return {
      current: currentScore,
      predicted: Math.round(predicted),
      rank1Line: rank1Line,
      gap: rank1Line - predicted,
      canReachRank1: predicted >= rank1Line,
      requiredDailyStudy: Math.max(0, Math.ceil((rank1Line - currentScore) / daysUntilTest / 0.5))
    };
  }

  getRank1Line(predictedScore) {
    // 学年1位ラインは通常90-95点程度
    return Math.max(85, Math.min(95, predictedScore + 5));
  }

  getNextAction(subject, plan, prediction) {
    if (!prediction.canReachRank1) {
      return `⚠️ 学年1位まであと${Math.round(prediction.gap)}点不足。今日${prediction.requiredDailyStudy}時間の追加学習が必要です。`;
    }
    return `✅ 好調です！まずは計画の「${plan[0]}」から始めましょう。`;
  }
}

const aiEngine = new Rank1AIEngine();

// API Routes

// Get or create user
app.post('/api/user', (req, res) => {
  try {
    const { name, gradeLevel } = req.body;
    let userId = req.body.userId;

    if (!userId) {
      userId = uuidv4();
      const stmt = db.prepare('INSERT INTO users (id, name, grade_level) VALUES (?, ?, ?)');
      stmt.run(userId, name || 'ユーザー', gradeLevel || '中学3年生');
    }

    res.json({ userId, name, gradeLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add or update subject
app.post('/api/subject', (req, res) => {
  try {
    const { userId, name, currentScore, targetScore, lastTestDate } = req.body;
    const subjectId = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO subjects (id, user_id, name, current_score, target_score, last_test_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(subjectId, userId, name, currentScore || 60, targetScore || 85, lastTestDate || new Date().toISOString().split('T')[0]);
    
    res.json({ subjectId, name, currentScore, targetScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Main endpoint: Get comprehensive study strategy
app.post('/api/study-strategy', (req, res) => {
  try {
    const { 
      userId, 
      subjectId, 
      subject, 
      range, 
      currentScore, 
      pastScores = [], 
      studyLogs = [],
      daysUntilTest = 7 
    } = req.body;

    // Analyze subject
    const analysis = aiEngine.analyzeSubject(subject, range, currentScore, pastScores);
    
    // Estimate weaknesses
    const weakness = aiEngine.estimateWeaknesses(subject, pastScores, studyLogs);
    
    // Generate study plan
    const studyPlan = aiEngine.generateStudyPlan(subject, range, weakness, 60);
    
    // Generate problems
    const problems = aiEngine.generateProblems(subject, range, weakness, 5);
    
    // Predict score
    const avgStudyTime = studyLogs.length > 0 ? studyLogs.reduce((sum, log) => sum + log.studyTimeMinutes, 0) / studyLogs.length : 30;
    const avgAccuracy = studyLogs.length > 0 ? studyLogs.reduce((sum, log) => sum + (log.accuracyRate || 0.6), 0) / studyLogs.length : 0.6;
    const prediction = aiEngine.predictScore(currentScore || 60, avgStudyTime / 60, avgAccuracy, daysUntilTest);
    
    // Determine next action
    const nextAction = aiEngine.getNextAction(subject, studyPlan, prediction);

    // Save to database if userId provided
    if (userId && subjectId) {
      // Save problems
      const problemStmt = db.prepare(`
        INSERT INTO problems (id, user_id, subject_id, question, answer, explanation, difficulty_level, topic)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      problems.forEach(p => {
        problemStmt.run(p.id, userId, subjectId, p.question, p.answer, p.explanation, p.difficulty, p.topic);
      });

      // Save study plan
      const planId = uuidv4();
      const planStmt = db.prepare(`
        INSERT INTO study_plans (id, user_id, subject_id, date, tasks, completed)
        VALUES (?, ?, ?, ?, ?, 0)
      `);
      planStmt.run(planId, userId, subjectId, new Date().toISOString().split('T')[0], JSON.stringify(studyPlan));
    }

    const response = {
      subject,
      range,
      analysis: {
        keyPoints: analysis.keyPoints,
        frequentTopics: analysis.frequentTopics,
        tips: analysis.tips,
        rangeAnalysis: analysis.rangeAnalysis,
        scoreGap: analysis.scoreGap,
        priorityOrder: analysis.priorityOrder
      },
      weakness,
      study_plan: studyPlan,
      problems: problems.map(p => ({
        question: p.question,
        answer: p.answer,
        explanation: p.explanation,
        topic: p.topic
      })),
      prediction,
      next_action: nextAction,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Log study session
app.post('/api/study-log', (req, res) => {
  try {
    const { userId, subjectId, studyTimeMinutes, topicsCovered, problemsSolved, accuracyRate, notes } = req.body;
    const logId = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO study_logs (id, user_id, subject_id, date, study_time_minutes, topics_covered, problems_solved, accuracy_rate, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      logId, 
      userId, 
      subjectId, 
      new Date().toISOString().split('T')[0],
      studyTimeMinutes, 
      JSON.stringify(topicsCovered), 
      problemsSolved, 
      accuracyRate, 
      notes
    );
    
    // Update weaknesses based on accuracy
    if (accuracyRate < 0.6 && topicsCovered.length > 0) {
      const weaknessId = uuidv4();
      const weaknessStmt = db.prepare(`
        INSERT INTO weaknesses (id, user_id, subject_id, topic, error_count, last_reviewed, mastery_level)
        VALUES (?, ?, ?, ?, 1, ?, ?)
      `);
      topicsCovered.forEach(topic => {
        weaknessStmt.run(weaknessId + '_' + topic, userId, subjectId, topic, new Date().toISOString().split('T')[0], accuracyRate);
      });
    }
    
    res.json({ success: true, logId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user progress
app.get('/api/progress/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    const subjects = db.prepare('SELECT * FROM subjects WHERE user_id = ?').all(userId);
    const studyLogs = db.prepare('SELECT * FROM study_logs WHERE user_id = ? ORDER BY date DESC LIMIT 30').all(userId);
    const weaknesses = db.prepare('SELECT * FROM weaknesses WHERE user_id = ? ORDER BY error_count DESC').all(userId);
    
    res.json({
      subjects,
      recentLogs: studyLogs,
      weaknesses: weaknesses.slice(0, 10),
      totalStudyTime: studyLogs.reduce((sum, log) => sum + log.study_time_minutes, 0),
      averageAccuracy: studyLogs.length > 0 
        ? studyLogs.reduce((sum, log) => sum + (log.accuracy_rate || 0), 0) / studyLogs.length 
        : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🎯 学年1位製造AI サーバー起動中...`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`💾 データベース: ${dbPath}`);
});
