import Board from '../models/Board.js';
import Subject from '../models/Subject.js';
import Content from '../models/Content.js';
import Exam from '../models/Exam.js';
import ExamResult from '../models/ExamResult.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';

// Initialize boards if they don't exist
export const initializeBoards = async () => {
  try {
    const boards = [
      { code: 'CBSE_AP', name: 'CBSE Andhra Pradesh', description: 'CBSE Board - Andhra Pradesh' },
      { code: 'CBSE_TS', name: 'CBSE Telangana State', description: 'CBSE Board - Telangana State' },
      { code: 'STATE_AP', name: 'State Andhra Pradesh', description: 'State Board - Andhra Pradesh' },
      { code: 'STATE_TS', name: 'State Telangana State', description: 'State Board - Telangana State' }
    ];

    for (const boardData of boards) {
      await Board.findOneAndUpdate(
        { code: boardData.code },
        boardData,
        { upsert: true, new: true }
      );
    }

    console.log('Boards initialized successfully');
  } catch (error) {
    console.error('Error initializing boards:', error);
  }
};

// Get all boards
export const getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find({ isActive: true }).sort({ code: 1 });
    res.json({ success: true, data: boards });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch boards' });
  }
};

// Get board-specific dashboard data
export const getBoardDashboard = async (req, res) => {
  try {
    const { boardCode } = req.params;
    
    console.log('📊 Fetching board dashboard for:', boardCode);
    
    if (!['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'].includes(boardCode)) {
      return res.status(400).json({ success: false, message: 'Invalid board code' });
    }

    // First, get all admins with this board
    const adminsWithBoard = await User.find({ role: 'admin', board: boardCode }).select('_id');
    const adminIds = adminsWithBoard.map(admin => admin._id);

    // Students inherit board from their assigned admin, so find students assigned to admins with this board
    // Also include students who have board directly assigned
    const [
      board,
      students,
      teachers,
      admins,
      subjects,
      contents,
      exams,
      examResults
    ] = await Promise.all([
      Board.findOne({ code: boardCode }),
      User.countDocuments({ 
        role: 'student',
        $or: [
          { board: boardCode },
          { assignedAdmin: { $in: adminIds } }
        ]
      }),
      // Get teachers assigned to admins with this board
      adminIds.length > 0 
        ? Teacher.countDocuments({ adminId: { $in: adminIds } })
        : Promise.resolve(0),
      User.countDocuments({ role: 'admin', board: boardCode }),
      Subject.countDocuments({ board: boardCode, isActive: true }),
      Content.countDocuments({ board: boardCode, isActive: true }),
      Exam.countDocuments({ board: boardCode, isActive: true }),
      ExamResult.countDocuments({ board: boardCode })
    ]);

    // Get top 10 performers
    const topPerformers = await ExamResult.find({ board: boardCode })
      .populate('userId', 'fullName email')
      .sort({ percentage: -1 })
      .limit(10)
      .select('userId percentage obtainedMarks totalMarks examTitle completedAt');

    // Calculate average score
    const results = await ExamResult.find({ board: boardCode });
    const averageScore = results.length > 0
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
      : 0;

    // Get detailed school information
    const adminsList = await User.find({ role: 'admin', board: boardCode }).sort({ schoolName: 1 });
    const schoolParticipation = await Promise.all(
      adminsList.map(async (admin) => {
        const results = await ExamResult.countDocuments({ adminId: admin._id, board: boardCode });
        // Students assigned to this admin (they inherit the board from admin)
        const students = await User.countDocuments({ assignedAdmin: admin._id, role: 'student' });
        // Teachers assigned to this admin
        const teachers = await Teacher.countDocuments({ adminId: admin._id });
        // Get student list
        const studentList = await User.find({ assignedAdmin: admin._id, role: 'student' })
          .select('fullName email classNumber')
          .sort({ fullName: 1 })
          .limit(50); // Limit to first 50 for display
        
        // Calculate average score for this school
        const schoolResults = await ExamResult.find({ adminId: admin._id, board: boardCode });
        const avgScore = schoolResults.length > 0
          ? (schoolResults.reduce((sum, r) => sum + r.percentage, 0) / schoolResults.length).toFixed(2)
          : '0.00';

        return {
          schoolName: admin.schoolName || admin.fullName,
          adminName: admin.fullName,
          adminEmail: admin.email,
          adminId: admin._id.toString(),
          students: students,
          teachers: teachers,
          examAttempts: results,
          participationRate: students > 0 ? ((results / students) * 100).toFixed(1) : '0.0',
          averageScore: avgScore,
          studentList: studentList.map(s => ({
            name: s.fullName,
            email: s.email,
            classNumber: s.classNumber
          }))
        };
      })
    );

    console.log('📊 Board Dashboard Stats:', {
      boardCode,
      students,
      teachers,
      admins,
      subjects,
      contents,
      exams,
      examResults,
      averageScore: averageScore.toFixed(2)
    });

    res.json({
      success: true,
      data: {
        board,
        stats: {
          students,
          teachers,
          admins,
          subjects,
          contents,
          exams,
          examResults,
          averageScore: averageScore.toFixed(2)
        },
        topPerformers: topPerformers.map(r => ({
          studentName: r.userId?.fullName || 'Unknown',
          studentEmail: r.userId?.email || '',
          percentage: r.percentage,
          marks: `${r.obtainedMarks}/${r.totalMarks}`,
          examTitle: r.examTitle,
          completedAt: r.completedAt
        })),
        schoolParticipation
      }
    });
  } catch (error) {
    console.error('Get board dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch board dashboard' });
  }
};

// Create Subject (Super Admin only)
export const createSubject = async (req, res) => {
  try {
    console.log('📚 Create subject request received');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { name, board, description, code } = req.body;

    console.log('📚 Creating subject:', { name, board, description, code });

    if (!name || !board) {
      return res.status(400).json({ success: false, message: 'Name and board are required' });
    }

    const boardUpper = board.toUpperCase();
    if (!['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'].includes(boardUpper)) {
      return res.status(400).json({ success: false, message: `Invalid board code: ${board}. Must be one of: CBSE_AP, CBSE_TS, STATE_AP, STATE_TS` });
    }

    // Check if subject already exists for this board
    const existingSubject = await Subject.findOne({ name: name.trim(), board: boardUpper });
    if (existingSubject) {
      return res.status(400).json({ success: false, message: 'Subject already exists for this board' });
    }

    // The createdBy field in Subject model is a String with enum 'super-admin'
    // So we must use 'super-admin' as the value
    // Handle empty strings - convert to undefined
    const subjectData = {
      name: name.trim(),
      board: boardUpper,
      createdBy: 'super-admin' // Required by schema enum
    };

    // Only add optional fields if they have values
    if (code && code.trim()) {
      subjectData.code = code.trim();
    }
    if (description && description.trim()) {
      subjectData.description = description.trim();
    }

    const subject = new Subject(subjectData);

    await subject.save();

    console.log('✅ Subject created successfully:', subject.name, 'for board', boardUpper);

    res.json({ success: true, data: subject, message: 'Subject created successfully' });
  } catch (error) {
    console.error('❌ Create subject error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to create subject', error: error.message });
  }
};

// Get subjects by board
export const getSubjectsByBoard = async (req, res) => {
  try {
    const { board } = req.params;

    console.log('📚 Fetching subjects for board:', board);

    if (!board) {
      return res.status(400).json({ success: false, message: 'Board parameter is required' });
    }

    const boardUpper = board.toUpperCase();
    if (!['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'].includes(boardUpper)) {
      return res.status(400).json({ success: false, message: `Invalid board code: ${board}. Must be one of: CBSE_AP, CBSE_TS, STATE_AP, STATE_TS` });
    }

    const subjects = await Subject.find({ board: boardUpper, isActive: true }).sort({ name: 1 });

    console.log(`✅ Found ${subjects.length} subjects for board ${boardUpper}`);

    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('❌ Get subjects by board error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, message: 'Failed to fetch subjects', error: error.message });
  }
};

// Delete Subject (Super Admin only)
export const deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Soft delete - set isActive to false instead of deleting
    subject.isActive = false;
    await subject.save();

    res.json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete subject' });
  }
};

// Upload Content (Super Admin only - Asli Prep Exclusive)
export const uploadContent = async (req, res) => {
  try {
    const { title, description, type, board, subject, topic, fileUrl, thumbnailUrl, duration, size } = req.body;

    console.log('📦 Uploading content:', { title, type, board, subject });

    if (!title || !type || !board || !subject || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Missing required fields: title, type, board, subject, and fileUrl are required' });
    }

    if (!['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'].includes(board)) {
      return res.status(400).json({ success: false, message: 'Invalid board code' });
    }

    if (!['video', 'pdf', 'ppt', 'note', 'other'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid content type' });
    }

    // Verify subject exists and belongs to the board
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    if (subjectDoc.board !== board.toUpperCase()) {
      return res.status(400).json({ success: false, message: 'Subject does not belong to the selected board' });
    }

    const content = new Content({
      title: title.trim(),
      description: description?.trim() || undefined,
      type,
      board: board.toUpperCase(),
      subject,
      topic: topic?.trim() || undefined,
      fileUrl,
      thumbnailUrl: thumbnailUrl?.trim() || undefined,
      duration: duration || 0,
      size: size || 0,
      isExclusive: true,
      createdBy: 'super-admin'
    });

    await content.save();

    console.log('✅ Content uploaded successfully:', {
      id: content._id,
      title: content.title,
      board: content.board,
      type: content.type,
      subject: content.subject
    });

    res.json({ success: true, data: content, message: 'Content uploaded successfully' });
  } catch (error) {
    console.error('Upload content error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload content' });
  }
};

// Get Content by Board
export const getContentByBoard = async (req, res) => {
  try {
    const { board } = req.params;
    const { subject, type, topic } = req.query;

    if (!['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'].includes(board)) {
      return res.status(400).json({ success: false, message: 'Invalid board code' });
    }

    const query = { board, isActive: true, isExclusive: true };

    if (subject) query.subject = subject;
    if (type) query.type = type;
    if (topic) query.topic = { $regex: topic, $options: 'i' };

    const contents = await Content.find(query)
      .populate('subject', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: contents });
  } catch (error) {
    console.error('Get content by board error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch content' });
  }
};

// Delete Content (Super Admin only)
export const deleteContent = async (req, res) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    content.isActive = false;
    await content.save();

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete content' });
  }
};

// Initialize boards on server start (call this in index.js)
// Note: initializeBoards is already exported above

// Get Board Analytics (for comparison charts) - All boards comparison
export const getBoardAnalytics = async (req, res) => {
  try {
    const boards = ['CBSE_AP', 'CBSE_TS', 'STATE_AP', 'STATE_TS'];

    const analytics = await Promise.all(
      boards.map(async (boardCode) => {
        const results = await ExamResult.find({ board: boardCode });
        const students = await User.countDocuments({ role: 'student', board: boardCode });
        const exams = await Exam.countDocuments({ board: boardCode, isActive: true });

        const averageScore = results.length > 0
          ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length
          : 0;

        const participationRate = students > 0 && exams > 0
          ? ((results.length / (students * exams)) * 100).toFixed(1)
          : '0.0';

        return {
          board: boardCode,
          boardName: boardCode === 'CBSE_AP' ? 'CBSE AP' :
                    boardCode === 'CBSE_TS' ? 'CBSE TS' :
                    boardCode === 'STATE_AP' ? 'State AP' :
                    'State TS',
          students,
          exams,
          totalAttempts: results.length,
          averageScore: averageScore.toFixed(2),
          participationRate
        };
      })
    );

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get board analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

