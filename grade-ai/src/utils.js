// ローカルストレージ用のユーティリティ
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const getFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to get from localStorage:', error);
    return null;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

// 学習ログの管理
export const LearningLog = {
  add: (log) => {
    const logs = getFromLocalStorage('learningLogs') || [];
    logs.push({ ...log, timestamp: new Date().toISOString() });
    saveToLocalStorage('learningLogs', logs);
  },

  getAll: () => {
    return getFromLocalStorage('learningLogs') || [];
  },

  getBySubject: (subject) => {
    const logs = getAll();
    return logs.filter(log => log.subject === subject);
  },

  clear: () => {
    removeFromLocalStorage('learningLogs');
  }
};

// 弱点データベースの管理
export const WeaknessDB = {
  add: (weakness) => {
    const weaknesses = getFromLocalStorage('weaknesses') || [];
    const existingIndex = weaknesses.findIndex(
      w => w.subject === weakness.subject && w.topic === weakness.topic
    );
    
    if (existingIndex >= 0) {
      weaknesses[existingIndex].count += 1;
      weaknesses[existingIndex].lastOccurred = new Date().toISOString();
    } else {
      weaknesses.push({ ...weakness, count: 1, createdAt: new Date().toISOString() });
    }
    
    saveToLocalStorage('weaknesses', weaknesses);
  },

  getAll: () => {
    return getFromLocalStorage('weaknesses') || [];
  },

  getBySubject: (subject) => {
    const weaknesses = getAll();
    return weaknesses.filter(w => w.subject === subject);
  },

  clear: () => {
    removeFromLocalStorage('weaknesses');
  }
};

// 点数予測の計算
export const calculatePrediction = (currentScore, understanding, daysUntilTest) => {
  // 単純な線形モデル：理解度向上率 = 0.8、毎日 3 点上昇
  const dailyImprovement = 3;
  const maxScore = 100;
  
  const potentialScore = Math.min(
    maxScore,
    currentScore + (dailyImprovement * daysUntilTest)
  );
  
  const understandingFactor = understanding / 100;
  const predictedScore = Math.round(
    currentScore + (potentialScore - currentScore) * understandingFactor
  );
  
  const topScoreLine = 92; // 学年 1 位のライン（目安）
  
  return {
    current: currentScore,
    predicted: predictedScore,
    target: topScoreLine,
    gap: topScoreLine - predictedScore,
    achievable: predictedScore >= topScoreLine
  };
};
