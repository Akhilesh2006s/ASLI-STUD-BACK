import AIService from '../services/ai-service.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Video from '../models/Video.js';
import Assessment from '../models/Assessment.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import ExamResult from '../models/ExamResult.js';

// Get comprehensive AI analytics with detailed exam analysis
export const getDetailedAIAnalytics = async (req, res) => {
  try {
    // Fetch all data for comprehensive analysis
    const [admins, students, teachers, videos, assessments, exams, examResults, questions] = await Promise.all([
      User.find({ role: 'admin' }).select('-password'),
      User.find({ role: 'student' }).select('-password'),
      Teacher.find(),
      Video.find(),
      Assessment.find(),
      Exam.find(),
      ExamResult.find().populate('userId', 'fullName email').populate('examId', 'title subject'),
      Question.find()
    ]);

    // Detailed exam analysis per admin
    const adminExamAnalysis = await Promise.all(
      admins.map(async (admin) => {
        const adminExams = await Exam.find({ adminId: admin._id }).populate('questions');
        const adminResults = await ExamResult.find({ adminId: admin._id })
          .populate('userId', 'fullName email')
          .populate('examId', 'title subject');

        // Calculate exam difficulty for this admin
        const examDifficulty = calculateExamDifficulty(adminExams, adminResults);
        
        // Get top scorers for this admin
        const topScorers = getTopScorers(adminResults, 10);
        
        // Performance distribution analysis
        const performanceDistribution = getPerformanceDistribution(adminResults);
        
        // Question difficulty analysis
        const questionAnalysis = await analyzeQuestionDifficulty(adminExams, adminResults);
        
        // Student performance trends
        const performanceTrends = analyzePerformanceTrends(adminResults);
        
        // Subject-wise analysis
        const subjectAnalysis = analyzeSubjectPerformance(adminResults);

        return {
          adminId: admin._id,
          adminName: admin.fullName,
          adminEmail: admin.email,
          examDifficulty,
          topScorers,
          performanceDistribution,
          questionAnalysis,
          performanceTrends,
          subjectAnalysis,
          totalStudents: adminResults.length,
          totalExams: adminExams.length,
          averageScore: adminResults.length > 0 ? 
            adminResults.reduce((sum, result) => sum + result.percentage, 0) / adminResults.length : 0
        };
      })
    );

    // Global analytics
    const globalAnalytics = {
      totalAdmins: admins.length,
      totalStudents: students.length,
      totalExams: exams.length,
      totalExamResults: examResults.length,
      overallAverageScore: examResults.length > 0 ? 
        examResults.reduce((sum, result) => sum + result.percentage, 0) / examResults.length : 0,
      topPerformers: getTopScorers(examResults, 20),
      performanceDistribution: getPerformanceDistribution(examResults),
      subjectWiseAnalysis: analyzeSubjectPerformance(examResults),
      difficultyAnalysis: analyzeOverallDifficulty(exams, examResults),
      trendsAnalysis: analyzeOverallTrends(examResults)
    };

    // AI-powered insights
    const aiInsights = await generateAIInsights(adminExamAnalysis, globalAnalytics);

    res.json({
      success: true,
      data: {
        adminAnalytics: adminExamAnalysis,
        globalAnalytics,
        aiInsights,
        metadata: {
          analysisTimestamp: new Date().toISOString(),
          totalDataPoints: examResults.length,
          analysisVersion: '2.0'
        }
      }
    });
  } catch (error) {
    console.error('Detailed AI Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate detailed AI analytics',
      error: error.message 
    });
  }
};

// Calculate exam difficulty based on actual performance
function calculateExamDifficulty(exams, results) {
  const difficultyAnalysis = exams.map(exam => {
    const examResults = results.filter(result => 
      result.examId && result.examId._id.toString() === exam._id.toString()
    );
    
    if (examResults.length === 0) {
      return {
        examId: exam._id,
        examTitle: exam.title,
        difficulty: 'Unknown',
        difficultyScore: 0,
        totalAttempts: 0,
        averageScore: 0,
        passRate: 0
      };
    }

    const averageScore = examResults.reduce((sum, result) => sum + result.percentage, 0) / examResults.length;
    const passRate = (examResults.filter(result => result.percentage >= 50).length / examResults.length) * 100;
    
    let difficulty = 'Easy';
    let difficultyScore = 0;
    
    if (averageScore < 40) {
      difficulty = 'Very Hard';
      difficultyScore = 5;
    } else if (averageScore < 60) {
      difficulty = 'Hard';
      difficultyScore = 4;
    } else if (averageScore < 75) {
      difficulty = 'Medium';
      difficultyScore = 3;
    } else if (averageScore < 85) {
      difficulty = 'Easy';
      difficultyScore = 2;
    } else {
      difficulty = 'Very Easy';
      difficultyScore = 1;
    }

    return {
      examId: exam._id,
      examTitle: exam.title,
      difficulty,
      difficultyScore,
      totalAttempts: examResults.length,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      highestScore: Math.max(...examResults.map(r => r.percentage)),
      lowestScore: Math.min(...examResults.map(r => r.percentage)),
      questionCount: exam.questions ? exam.questions.length : 0
    };
  });

  return {
    exams: difficultyAnalysis,
    overallDifficulty: difficultyAnalysis.length > 0 ? 
      difficultyAnalysis.reduce((sum, exam) => sum + exam.difficultyScore, 0) / difficultyAnalysis.length : 0,
    hardestExam: difficultyAnalysis.reduce((max, exam) => 
      exam.difficultyScore > max.difficultyScore ? exam : max, difficultyAnalysis[0] || {}),
    easiestExam: difficultyAnalysis.reduce((min, exam) => 
      exam.difficultyScore < min.difficultyScore ? exam : min, difficultyAnalysis[0] || {})
  };
}

// Get top scorers with detailed analysis
function getTopScorers(results, limit = 10) {
  const studentPerformance = {};
  
  results.forEach(result => {
    const studentId = result.userId._id.toString();
    if (!studentPerformance[studentId]) {
      studentPerformance[studentId] = {
        studentId: studentId,
        studentName: result.userId.fullName,
        studentEmail: result.userId.email,
        totalExams: 0,
        totalScore: 0,
        highestScore: 0,
        averageScore: 0,
        examHistory: []
      };
    }
    
    studentPerformance[studentId].totalExams += 1;
    studentPerformance[studentId].totalScore += result.percentage;
    studentPerformance[studentId].highestScore = Math.max(
      studentPerformance[studentId].highestScore, 
      result.percentage
    );
    studentPerformance[studentId].examHistory.push({
      examTitle: result.examTitle,
      score: result.percentage,
      completedAt: result.completedAt
    });
  });

  // Calculate average scores
  Object.values(studentPerformance).forEach(student => {
    student.averageScore = Math.round((student.totalScore / student.totalExams) * 100) / 100;
  });

  return Object.values(studentPerformance)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, limit);
}

// Performance distribution analysis
function getPerformanceDistribution(results) {
  const distribution = {
    excellent: { range: '90-100%', count: 0, percentage: 0 },
    good: { range: '80-89%', count: 0, percentage: 0 },
    average: { range: '70-79%', count: 0, percentage: 0 },
    belowAverage: { range: '60-69%', count: 0, percentage: 0 },
    poor: { range: '50-59%', count: 0, percentage: 0 },
    veryPoor: { range: '0-49%', count: 0, percentage: 0 }
  };

  results.forEach(result => {
    const score = result.percentage;
    if (score >= 90) distribution.excellent.count++;
    else if (score >= 80) distribution.good.count++;
    else if (score >= 70) distribution.average.count++;
    else if (score >= 60) distribution.belowAverage.count++;
    else if (score >= 50) distribution.poor.count++;
    else distribution.veryPoor.count++;
  });

  const total = results.length;
  Object.values(distribution).forEach(category => {
    category.percentage = total > 0 ? Math.round((category.count / total) * 100 * 100) / 100 : 0;
  });

  return distribution;
}

// Analyze question difficulty
async function analyzeQuestionDifficulty(exams, results) {
  const questionAnalysis = [];
  
  for (const exam of exams) {
    if (!exam.questions || exam.questions.length === 0) continue;
    
    const examResults = results.filter(result => 
      result.examId && result.examId._id.toString() === exam._id.toString()
    );
    
    for (const questionId of exam.questions) {
      const question = await Question.findById(questionId);
      if (!question) continue;
      
      let correctAnswers = 0;
      let totalAttempts = 0;
      
      examResults.forEach(result => {
        if (result.answers && result.answers.has(questionId.toString())) {
          totalAttempts++;
          const studentAnswer = result.answers.get(questionId.toString());
          if (studentAnswer === question.correctAnswer) {
            correctAnswers++;
          }
        }
      });
      
      const difficultyRate = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;
      
      questionAnalysis.push({
        questionId: question._id,
        questionText: question.questionText.substring(0, 100) + '...',
        questionType: question.questionType,
        subject: question.subject,
        difficultyRate: Math.round(difficultyRate * 100) / 100,
        correctAnswers,
        totalAttempts,
        examTitle: exam.title,
        marks: question.marks
      });
    }
  }
  
  return questionAnalysis.sort((a, b) => a.difficultyRate - b.difficultyRate);
}

// Analyze performance trends over time
function analyzePerformanceTrends(results) {
  const monthlyData = {};
  
  results.forEach(result => {
    const month = new Date(result.completedAt).toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        totalExams: 0,
        totalScore: 0,
        averageScore: 0,
        examCount: 0
      };
    }
    
    monthlyData[month].totalExams += 1;
    monthlyData[month].totalScore += result.percentage;
    monthlyData[month].examCount += 1;
  });
  
  Object.values(monthlyData).forEach(month => {
    month.averageScore = Math.round((month.totalScore / month.totalExams) * 100) / 100;
  });
  
  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
}

// Analyze subject-wise performance
function analyzeSubjectPerformance(results) {
  const subjectData = {};
  
  results.forEach(result => {
    const subject = result.examId?.subject || 'Unknown';
    if (!subjectData[subject]) {
      subjectData[subject] = {
        subject,
        totalExams: 0,
        totalScore: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 100,
        examCount: 0
      };
    }
    
    subjectData[subject].totalExams += 1;
    subjectData[subject].totalScore += result.percentage;
    subjectData[subject].highestScore = Math.max(subjectData[subject].highestScore, result.percentage);
    subjectData[subject].lowestScore = Math.min(subjectData[subject].lowestScore, result.percentage);
    subjectData[subject].examCount += 1;
  });
  
  Object.values(subjectData).forEach(subject => {
    subject.averageScore = Math.round((subject.totalScore / subject.totalExams) * 100) / 100;
  });
  
  return Object.values(subjectData).sort((a, b) => b.averageScore - a.averageScore);
}

// Analyze overall difficulty
function analyzeOverallDifficulty(exams, results) {
  const difficultyStats = {
    veryHard: 0,
    hard: 0,
    medium: 0,
    easy: 0,
    veryEasy: 0
  };
  
  exams.forEach(exam => {
    const examResults = results.filter(result => 
      result.examId && result.examId._id.toString() === exam._id.toString()
    );
    
    if (examResults.length > 0) {
      const averageScore = examResults.reduce((sum, result) => sum + result.percentage, 0) / examResults.length;
      
      if (averageScore < 40) difficultyStats.veryHard++;
      else if (averageScore < 60) difficultyStats.hard++;
      else if (averageScore < 75) difficultyStats.medium++;
      else if (averageScore < 85) difficultyStats.easy++;
      else difficultyStats.veryEasy++;
    }
  });
  
  return difficultyStats;
}

// Analyze overall trends
function analyzeOverallTrends(results) {
  const trends = {
    improving: 0,
    declining: 0,
    stable: 0,
    totalStudents: 0
  };
  
  const studentTrends = {};
  
  results.forEach(result => {
    const studentId = result.userId._id.toString();
    if (!studentTrends[studentId]) {
      studentTrends[studentId] = [];
    }
    studentTrends[studentId].push({
      score: result.percentage,
      date: new Date(result.completedAt)
    });
  });
  
  Object.values(studentTrends).forEach(studentScores => {
    if (studentScores.length >= 2) {
      studentScores.sort((a, b) => a.date - b.date);
      const firstHalf = studentScores.slice(0, Math.ceil(studentScores.length / 2));
      const secondHalf = studentScores.slice(Math.ceil(studentScores.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, score) => sum + score.score, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, score) => sum + score.score, 0) / secondHalf.length;
      
      const difference = secondAvg - firstAvg;
      if (difference > 5) trends.improving++;
      else if (difference < -5) trends.declining++;
      else trends.stable++;
      
      trends.totalStudents++;
    }
  });
  
  return trends;
}

// Generate AI-powered insights
async function generateAIInsights(adminAnalytics, globalAnalytics) {
  const insights = [];
  
  // Admin performance insights
  adminAnalytics.forEach(admin => {
    if (admin.averageScore < 60) {
      insights.push({
        type: 'alert',
        title: 'Low Performance Alert',
        description: `${admin.adminName}'s students are performing below average (${admin.averageScore}%)`,
        confidence: 95,
        impact: 'high',
        category: 'Performance',
        data: { adminId: admin.adminId, averageScore: admin.averageScore }
      });
    }
    
    if (admin.examDifficulty.overallDifficulty > 4) {
      insights.push({
        type: 'recommendation',
        title: 'Exam Difficulty Adjustment',
        description: `${admin.adminName}'s exams are too difficult. Consider reducing difficulty.`,
        confidence: 88,
        impact: 'medium',
        category: 'Content',
        data: { adminId: admin.adminId, difficulty: admin.examDifficulty.overallDifficulty }
      });
    }
  });
  
  // Global insights
  if (globalAnalytics.overallAverageScore < 70) {
    insights.push({
      type: 'alert',
      title: 'Platform Performance Concern',
      description: `Overall platform average score is ${globalAnalytics.overallAverageScore}%. Consider reviewing content quality.`,
      confidence: 92,
      impact: 'high',
      category: 'Performance',
      data: { overallScore: globalAnalytics.overallAverageScore }
    });
  }
  
  return insights;
}

// Get admin-specific detailed analytics
export const getAdminDetailedAnalytics = async (req, res) => {
  try {
    const { adminId } = req.params;
    
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    
    const [exams, results, questions] = await Promise.all([
      Exam.find({ adminId }).populate('questions'),
      ExamResult.find({ adminId })
        .populate('userId', 'fullName email')
        .populate('examId', 'title subject'),
      Question.find({ adminId })
    ]);
    
    const detailedAnalysis = {
      admin: {
        id: admin._id,
        name: admin.fullName,
        email: admin.email
      },
      examDifficulty: calculateExamDifficulty(exams, results),
      topScorers: getTopScorers(results, 15),
      performanceDistribution: getPerformanceDistribution(results),
      questionAnalysis: await analyzeQuestionDifficulty(exams, results),
      performanceTrends: analyzePerformanceTrends(results),
      subjectAnalysis: analyzeSubjectPerformance(results),
      summary: {
        totalStudents: results.length,
        totalExams: exams.length,
        totalQuestions: questions.length,
        averageScore: results.length > 0 ? 
          results.reduce((sum, result) => sum + result.percentage, 0) / results.length : 0,
        passRate: results.length > 0 ? 
          (results.filter(r => r.percentage >= 50).length / results.length) * 100 : 0
      }
    };
    
    res.json({
      success: true,
      data: detailedAnalysis
    });
  } catch (error) {
    console.error('Admin detailed analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate admin detailed analytics' 
    });
  }
};

export default {
  getDetailedAIAnalytics,
  getAdminDetailedAnalytics
};






