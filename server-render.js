import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(join(__dirname, 'public')));

// Initialize PostgreSQL Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Connected to PostgreSQL successfully');
    release();
  }
});

// Create tables
async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        grade_level TEXT,
        target_rank INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        name TEXT,
        current_score REAL,
        target_score REAL,
        last_test_date DATE
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS study_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        subject_id TEXT REFERENCES subjects(id),
        date DATE,
        study_time_minutes INTEGER,
        topics_covered TEXT,
        problems_solved INTEGER,
        accuracy_rate REAL,
        notes TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS weaknesses (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        subject_id TEXT REFERENCES subjects(id),
        topic TEXT,
        error_count INTEGER DEFAULT 0,
        last_reviewed DATE,
        mastery_level REAL DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS study_plans (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        subject_id TEXT REFERENCES subjects(id),
        date DATE,
        tasks TEXT,
        completed BOOLEAN DEFAULT false,
        actual_study_time INTEGER
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS problems (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        subject_id TEXT REFERENCES subjects(id),
        question TEXT,
        answer TEXT,
        explanation TEXT,
        difficulty_level INTEGER,
        topic TEXT,
        is_correct BOOLEAN,
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.release();
  }
}

// Initialize database on startup
createTables();

// AI Engine Simulation (In production, connect to actual AI API)
const AIEngine = {
  analyzeSubject: async (subject, range, currentScore) => {
    return {
      keyPoints: [
        '頻出単語・熟語のマスター',
        '文法事項の完全理解',
        '長文読解のスピード向上',
        '過去問演習による傾向把握'
      ],
      frequency: ['文法問題', '長文読解', 'リスニング'],
      difficulty: currentScore < 50 ? '基礎中心' : currentScore < 70 ? '標準 + 応用' : '応用中心'
    };
  },

  estimateWeakness: async (subject, logs, problems) => {
    const weakTopics = [];
    
    if (problems && problems.length > 0) {
      const errorByTopic = {};
      problems.forEach(p => {
        if (!p.is_correct) {
          errorByTopic[p.topic] = (errorByTopic[p.topic] || 0) + 1;
        }
      });
      
      Object.entries(errorByTopic)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .forEach(([topic, count]) => {
          weakTopics.push({ topic, errorCount: count });
        });
    }
    
    return weakTopics.length > 0 
      ? weakTopics 
      : [{ topic: '全般的な復習が必要', errorCount: 0 }];
  },

  generateStudyPlan: async (subject, range, weakness, daysUntilTest) => {
    const tasks = [];
    
    // 弱点優先の計画
    if (weakness && weakness.length > 0) {
      weakness.slice(0, 2).forEach(w => {
        tasks.push({
          topic: w.topic,
          time: 40,
          priority: 'high',
          type: '弱点克服'
        });
      });
    }
    
    // 頻出分野
    tasks.push({
      topic: '頻出問題演習',
      time: 30,
      priority: 'medium',
      type: '問題演習'
    });
    
    // 復習
    tasks.push({
      topic: '错题復習',
      time: 20,
      priority: 'high',
      type: '復習'
    });
    
    return tasks;
  },

  generateProblems: async (subject, range, weakness, count = 5) => {
    const problems = [];
    
    const problemTemplates = {
      math: [
        { q: '2 次方程式 x² - 5x + 6 = 0 を解け。', a: 'x = 2, 3', topic: '2 次方程式' },
        { q: '関数 y = 2x² のグラフの頂点の座標を求めよ。', a: '(0, 0)', topic: '2 次関数' },
        { q: 'sin30°の値を求めよ。', a: '1/2', topic: '三角比' }
      ],
      english: [
        { q: '「私は昨日図書館へ行きました」を英訳せよ。', a: 'I went to the library yesterday.', topic: '過去形' },
        { q: 'This book is ( ) interesting that I want to read it again. ( ) に適語を入れよ。', a: 'so', topic: '比較' },
        { q: 'accept と receive の違いを説明せよ。', a: 'accept=受け入れる（意志）、receive=受け取る（事実）', topic: '語彙' }
      ],
      japanese: [
        { q: '「春はあけぼの」で始まる文章は何か。', a: '枕草子', topic: '古文' },
        { q: '次の漢文を書き下せ：学而時習之', a: '学びて時にこれを習う', topic: '漢文' },
        { q: '「もののあはれ」とは何か。', a: '平安時代の美的理念。物の美しさや悲しみに感じる情緒。', topic: '文学史' }
      ],
      science: [
        { q: '光合成の化学反応式を書け。', a: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', topic: '生物' },
        { q: 'オームの法則の式を書け。', a: 'V = IR', topic: '物理' },
        { q: '塩酸の化学式を書け。', a: 'HCl', topic: '化学' }
      ],
      social_studies: [
        { q: '明治維新は何年か。', a: '1868 年', topic: '歴史' },
        { q: '日本国憲法の三大原則を答えよ。', a: '国民主権、基本的人権の尊重、平和主義', topic: '公民' },
        { q: '日本の最高峰の山は何か。', a: '富士山（3776m）', topic: '地理' }
      ]
    };
    
    const subjectKey = subject.toLowerCase();
    let templates = problemTemplates[subjectKey] || problemTemplates.math;
    
    // 弱点分野から優先的に出題
    if (weakness && weakness.length > 0) {
      const weakTopic = weakness[0].topic;
      // 弱点に関連する問題を優先（簡易実装）
    }
    
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      problems.push({
        id: uuidv4(),
        question: template.q,
        answer: template.a,
        explanation: 'この問題は頻出です。確実にマスターしましょう。',
        difficulty: 3,
        topic: template.topic
      });
    }
    
    return problems;
  },

  predictScore: async (currentScore, studyTime, accuracyRate, daysUntilTest) => {
    const improvement = Math.min(
      20,
      (studyTime / 60) * 2 + (accuracyRate / 100) * 10 + Math.max(0, daysUntilTest)
    );
    
    const predictedScore = Math.min(100, currentScore + improvement);
    const targetScore = 90; // 学年 1 位ライン
    
    return {
      current: currentScore,
      predicted: Math.round(predictedScore),
      target: targetScore,
      gap: Math.max(0, targetScore - predictedScore),
      confidence: studyTime > 120 ? 'high' : studyTime > 60 ? 'medium' : 'low'
    };
  },

  optimizeNextAction: async (subject, weakness, plan) => {
    if (weakness && weakness.length > 0) {
      return {
        action: `弱点「${weakness[0].topic}」を集中対策`,
        duration: 40,
        method: '問題演習→解説確認→類似問題',
        priority: 'highest'
      };
    }
    
    return {
      action: '頻出問題の演習',
      duration: 30,
      method: '制限時間を設けて実戦形式で',
      priority: 'high'
    };
  }
};

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'postgresql' });
});

// Create user
app.post('/api/users', async (req, res) => {
  const { name, gradeLevel } = req.body;
  const id = uuidv4();
  
  try {
    await pool.query(
      'INSERT INTO users (id, name, grade_level) VALUES ($1, $2, $3)',
      [id, name, gradeLevel]
    );
    res.json({ id, name, gradeLevel });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user data
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add subject
app.post('/api/subjects', async (req, res) => {
  const { userId, name, currentScore, targetScore } = req.body;
  const id = uuidv4();
  
  try {
    await pool.query(
      'INSERT INTO subjects (id, user_id, name, current_score, target_score) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, name, currentScore, targetScore || 90]
    );
    res.json({ id, userId, name, currentScore, targetScore: targetScore || 90 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get AI analysis
app.post('/api/analyze', async (req, res) => {
  const { subject, range, currentScore, userId } = req.body;
  
  try {
    const analysis = await AIEngine.analyzeSubject(subject, range, currentScore);
    res.json({
      subject,
      range,
      analysis: `重要ポイント：${analysis.keyPoints.join(', ')}`,
      frequency: analysis.frequency,
      difficulty: analysis.difficulty
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weakness estimation
app.post('/api/weakness', async (req, res) => {
  const { subject, userId } = req.body;
  
  try {
    const problemsResult = await pool.query(
      'SELECT * FROM problems WHERE user_id = $1 AND subject_id IN (SELECT id FROM subjects WHERE user_id = $1 AND name = $2)',
      [userId, subject]
    );
    
    const weakness = await AIEngine.estimateWeakness(subject, [], problemsResult.rows);
    res.json({ subject, weakness });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate study plan
app.post('/api/study-plan', async (req, res) => {
  const { subject, range, weakness, daysUntilTest, userId } = req.body;
  
  try {
    const plan = await AIEngine.generateStudyPlan(subject, range, weakness, daysUntilTest);
    res.json({
      subject,
      date: new Date().toISOString().split('T')[0],
      plan,
      totalMinutes: plan.reduce((sum, t) => sum + t.time, 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate problems
app.post('/api/problems/generate', async (req, res) => {
  const { subject, range, weakness, count = 5, userId } = req.body;
  
  try {
    const problems = await AIEngine.generateProblems(subject, range, weakness, count);
    res.json({ subject, problems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit problem answer
app.post('/api/problems/submit', async (req, res) => {
  const { userId, subjectId, problemId, answer, isCorrect } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO problems (id, user_id, subject_id, question, answer, is_correct) VALUES ($1, $2, $3, $4, $5, $6)',
      [uuidv4(), userId, subjectId, '', answer, isCorrect]
    );
    
    // Update weakness if incorrect
    if (!isCorrect) {
      // Weakness update logic here
    }
    
    res.json({ success: true, isCorrect });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get score prediction
app.post('/api/predict', async (req, res) => {
  const { currentScore, studyTime, accuracyRate, daysUntilTest } = req.body;
  
  try {
    const prediction = await AIEngine.predictScore(currentScore, studyTime, accuracyRate, daysUntilTest);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get next action
app.post('/api/next-action', async (req, res) => {
  const { subject, weakness, plan } = req.body;
  
  try {
    const action = await AIEngine.optimizeNextAction(subject, weakness, plan);
    res.json(action);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log study session
app.post('/api/study-log', async (req, res) => {
  const { userId, subjectId, studyTime, topicsCovered, problemsSolved, accuracyRate } = req.body;
  const id = uuidv4();
  const date = new Date().toISOString().split('T')[0];
  
  try {
    await pool.query(
      'INSERT INTO study_logs (id, user_id, subject_id, date, study_time_minutes, topics_covered, problems_solved, accuracy_rate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, userId, subjectId, date, studyTime, topicsCovered, problemsSolved, accuracyRate]
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get study progress
app.get('/api/progress/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const logs = await pool.query(
      'SELECT * FROM study_logs WHERE user_id = $1 ORDER BY date DESC LIMIT 7',
      [userId]
    );
    
    const subjects = await pool.query(
      'SELECT * FROM subjects WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      recentLogs: logs.rows,
      subjects: subjects.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
