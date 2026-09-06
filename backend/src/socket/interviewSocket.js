const Interview = require('../models/Interview');
const {
  evaluateAnswer,
  synthesizeFinalReport,
} = require('../services/interviewEvaluator.service');
const logger = require('../utils/logger');

/**
 * Register all Real-Time Mock Interview WebSocket handlers
 * @param {import('socket.io').Server} io
 */
const registerInterviewSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    logger.info(`[Socket.IO] Client connected: ${socket.id} (User ID: ${socket.userId})`);

    /**
     * 1. Join Authenticated Interview Room
     */
    socket.on('joinInterview', async ({ interviewId }, callback) => {
      try {
        if (!interviewId) {
          socket.emit('error', { message: 'interviewId is required to join room.', code: 'INVALID_ID' });
          return;
        }

        const interview = await Interview.findById(interviewId);
        if (!interview) {
          socket.emit('error', { message: 'Interview session not found.', code: 'NOT_FOUND' });
          return;
        }

        // Multi-tenant room isolation guardrail
        if (interview.userId.toString() !== socket.userId) {
          logger.warn(`[Socket Security] User ${socket.userId} denied access to interview ${interviewId} (Owner: ${interview.userId})`);
          socket.emit('error', {
            message: 'Unauthorized: You do not have permission to access this interview room.',
            code: 'UNAUTHORIZED',
          });
          return;
        }

        const roomName = `interview:${interviewId}`;
        socket.join(roomName);
        logger.info(`[Socket.IO] Socket ${socket.id} (User: ${socket.userId}) joined room: ${roomName}`);

        const currentQIndex = interview.currentQuestionIndex || 0;
        const currentQ = interview.questions ? interview.questions[currentQIndex] : null;

        const responsePayload = {
          success: true,
          interviewId,
          status: interview.status,
          currentQuestionIndex: currentQIndex,
          totalQuestions: interview.questions?.length || 0,
          currentQuestion: currentQ,
          overallScore: interview.overallScore || 0,
          scores: interview.scores || {},
          feedback: interview.feedback || null,
        };

        socket.emit('joinedRoom', responsePayload);
        if (typeof callback === 'function') callback(responsePayload);
      } catch (err) {
        logger.error(`[Socket joinInterview Error]: ${err.message}`);
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 2. Start Mock Interview
     */
    socket.on('startInterview', async ({ interviewId }, callback) => {
      try {
        if (!interviewId) {
          socket.emit('error', { message: 'interviewId is required.', code: 'INVALID_ID' });
          return;
        }

        const interview = await Interview.findOne({ _id: interviewId, userId: socket.userId });
        if (!interview) {
          socket.emit('error', { message: 'Unauthorized or interview not found.', code: 'UNAUTHORIZED' });
          return;
        }

        if (interview.status === 'completed') {
          socket.emit('error', { message: 'Interview has already been completed.', code: 'ALREADY_COMPLETED' });
          return;
        }

        if (interview.status === 'pending') {
          interview.status = 'in-progress';
          interview.startedAt = interview.startedAt || new Date();
          interview.currentQuestionIndex = 0;
          await interview.save();
        }

        const roomName = `interview:${interviewId}`;
        const firstQuestion = interview.questions ? interview.questions[interview.currentQuestionIndex || 0] : null;

        const payload = {
          interviewId,
          status: interview.status,
          questionIndex: interview.currentQuestionIndex || 0,
          totalQuestions: interview.questions?.length || 0,
          question: firstQuestion,
          startedAt: interview.startedAt,
        };

        io.to(roomName).emit('interviewStarted', payload);
        if (typeof callback === 'function') callback({ success: true, ...payload });
      } catch (err) {
        logger.error(`[Socket startInterview Error]: ${err.message}`);
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 3. Submit Answer (with AI Thinking & Streaming Chunks)
     */
    socket.on('submitAnswer', async ({ interviewId, questionId, userAnswer }, callback) => {
      try {
        if (!interviewId || !userAnswer) {
          socket.emit('error', { message: 'interviewId and userAnswer are required.', code: 'INVALID_PAYLOAD' });
          return;
        }

        const interview = await Interview.findOne({ _id: interviewId, userId: socket.userId });
        if (!interview) {
          socket.emit('error', { message: 'Unauthorized or interview not found.', code: 'UNAUTHORIZED' });
          return;
        }

        if (interview.status !== 'in-progress') {
          socket.emit('error', {
            message: `Cannot submit answer when interview status is "${interview.status}".`,
            code: 'INVALID_STATUS',
          });
          return;
        }

        const roomName = `interview:${interviewId}`;

        // 1. Emit AI Thinking State
        io.to(roomName).emit('aiThinking', {
          isThinking: true,
          message: 'AI Interviewer evaluating response accuracy, architecture, and edge cases...',
        });

        // 2. Identify target question
        let targetQuestion = null;
        let questionIndex = 0;

        if (questionId !== undefined && questionId !== null) {
          const foundIdx = interview.questions.findIndex(
            (q) => String(q.questionId) === String(questionId) || String(q._id) === String(questionId)
          );
          if (foundIdx !== -1) {
            questionIndex = foundIdx;
            targetQuestion = interview.questions[foundIdx];
          }
        }

        if (!targetQuestion) {
          questionIndex = interview.currentQuestionIndex || 0;
          targetQuestion = interview.questions[questionIndex];
        }

        if (!targetQuestion) {
          socket.emit('error', { message: 'Target question not found in session.', code: 'QUESTION_NOT_FOUND' });
          return;
        }

        // 3. Execute Answer Evaluation
        const evaluation = await evaluateAnswer({
          question: targetQuestion.question,
          category: targetQuestion.category,
          difficulty: targetQuestion.difficulty,
          userAnswer: userAnswer.trim(),
          expectedKeywords: targetQuestion.expectedKeywords || [],
        });

        // 4. Stream AI Response Chunks (for real-time coaching feedback text)
        const feedbackWords = (evaluation.feedback || 'Good technical explanation.').split(' ');
        let streamedText = '';

        for (let i = 0; i < feedbackWords.length; i++) {
          const word = feedbackWords[i] + ' ';
          streamedText += word;
          io.to(roomName).emit('aiResponseChunk', {
            chunk: word,
            textSoFar: streamedText,
            isComplete: i === feedbackWords.length - 1,
            field: 'feedback',
          });
        }

        // 5. Update Database Record
        const existingAnsIdx = interview.answers.findIndex(
          (a) => a.questionId === targetQuestion.questionId
        );

        const answerRecord = {
          questionId: targetQuestion.questionId,
          userAnswer: userAnswer.trim(),
          technicalAccuracy: evaluation.technicalAccuracy,
          completeness: evaluation.completeness,
          problemSolving: evaluation.problemSolving,
          communication: evaluation.communication,
          clarity: evaluation.clarity,
          overall: evaluation.overall,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          missingConcepts: evaluation.missingConcepts,
          feedback: evaluation.feedback,
          submittedAt: new Date(),
        };

        if (existingAnsIdx >= 0) {
          interview.answers[existingAnsIdx] = answerRecord;
        } else {
          interview.answers.push(answerRecord);
        }

        // Recalculate cumulative scores
        const answersCount = interview.answers.length;
        const totalAccuracy = interview.answers.reduce((acc, a) => acc + (a.technicalAccuracy || 0), 0);
        const totalCompleteness = interview.answers.reduce((acc, a) => acc + (a.completeness || 0), 0);
        const totalProblemSolving = interview.answers.reduce((acc, a) => acc + (a.problemSolving || 0), 0);
        const totalCommunication = interview.answers.reduce((acc, a) => acc + (a.communication || 0), 0);
        const totalClarity = interview.answers.reduce((acc, a) => acc + (a.clarity || 0), 0);
        const totalOverall = interview.answers.reduce((acc, a) => acc + (a.overall || 0), 0);

        interview.scores = {
          technicalAccuracy: Math.round(totalAccuracy / answersCount),
          completeness: Math.round(totalCompleteness / answersCount),
          problemSolving: Math.round(totalProblemSolving / answersCount),
          communication: Math.round(totalCommunication / answersCount),
          clarity: Math.round(totalClarity / answersCount),
          overall: Math.round(totalOverall / answersCount),
        };
        interview.overallScore = interview.scores.overall;

        const isLastQuestion = questionIndex + 1 >= interview.questions.length;
        const nextIndex = questionIndex + 1;
        interview.currentQuestionIndex = nextIndex;

        // 6. Emit answerEvaluated & scoreUpdated
        io.to(roomName).emit('answerEvaluated', {
          evaluation,
          currentQuestionIndex: nextIndex,
          isLastQuestion,
          cumulativeScores: interview.scores,
          overallScore: interview.overallScore,
        });

        io.to(roomName).emit('scoreUpdated', {
          overallScore: interview.overallScore,
          scores: interview.scores,
        });

        // 7. Check if interview is completed
        if (isLastQuestion) {
          interview.status = 'completed';
          interview.completedAt = new Date();

          const questionsAndAnswers = interview.questions.map((q) => {
            const ans = interview.answers.find((a) => a.questionId === q.questionId) || {};
            return {
              question: q.question,
              category: q.category,
              difficulty: q.difficulty,
              userAnswer: ans.userAnswer || 'No answer submitted',
              overallScore: ans.overall || 0,
              technicalAccuracy: ans.technicalAccuracy || 0,
              strengths: ans.strengths || [],
              weaknesses: ans.weaknesses || [],
              missingConcepts: ans.missingConcepts || [],
            };
          });

          const finalReport = await synthesizeFinalReport({
            targetRole: interview.targetRole,
            difficulty: interview.difficulty,
            type: interview.type,
            questionsAndAnswers,
          });

          interview.feedback = finalReport;
          interview.overallScore = finalReport.overallScore || interview.overallScore;
          await interview.save();

          io.to(roomName).emit('interviewCompleted', {
            finalReport,
            overallScore: interview.overallScore,
            scores: interview.scores,
            status: 'completed',
            completedAt: interview.completedAt,
          });
        } else {
          await interview.save();
          // Emit questionReady for next question
          const nextQuestion = interview.questions[nextIndex];
          io.to(roomName).emit('questionReady', {
            question: nextQuestion,
            questionIndex: nextIndex,
            totalQuestions: interview.questions.length,
          });
        }

        if (typeof callback === 'function') {
          callback({
            success: true,
            evaluation,
            isLastQuestion,
            overallScore: interview.overallScore,
          });
        }
      } catch (err) {
        logger.error(`[Socket submitAnswer Error]: ${err.message}`);
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 3b. Submit Spoken Voice Answer (with Speech Delivery Signals & Streaming)
     */
    socket.on('submitVoiceAnswer', async ({ interviewId, questionId, transcript, durationSeconds }, callback) => {
      try {
        if (!interviewId || !transcript) {
          socket.emit('error', { message: 'interviewId and transcript are required.', code: 'INVALID_PAYLOAD' });
          return;
        }

        const interview = await Interview.findOne({ _id: interviewId, userId: socket.userId });
        if (!interview) {
          socket.emit('error', { message: 'Unauthorized or interview not found.', code: 'UNAUTHORIZED' });
          return;
        }

        if (interview.status !== 'in-progress') {
          socket.emit('error', {
            message: `Cannot submit voice answer when interview status is "${interview.status}".`,
            code: 'INVALID_STATUS',
          });
          return;
        }

        const roomName = `interview:${interviewId}`;

        // Emit thinking state
        io.to(roomName).emit('aiThinking', {
          isThinking: true,
          message: 'AI Interviewer analyzing technical reasoning and communication pacing...',
        });

        // Locate question
        let targetQuestion = null;
        let questionIndex = 0;

        if (questionId !== undefined && questionId !== null) {
          const foundIdx = interview.questions.findIndex(
            (q) => String(q.questionId) === String(questionId) || String(q._id) === String(questionId)
          );
          if (foundIdx !== -1) {
            questionIndex = foundIdx;
            targetQuestion = interview.questions[foundIdx];
          }
        }

        if (!targetQuestion) {
          questionIndex = interview.currentQuestionIndex || 0;
          targetQuestion = interview.questions[questionIndex];
        }

        if (!targetQuestion) {
          socket.emit('error', { message: 'Target question not found.', code: 'QUESTION_NOT_FOUND' });
          return;
        }

        const { processVoiceAnswer } = require('../services/voiceInterview.service');

        const evaluation = await processVoiceAnswer({
          question: targetQuestion.question,
          category: targetQuestion.category,
          difficulty: targetQuestion.difficulty,
          transcript: transcript.trim(),
          durationSeconds: Number(durationSeconds) || 0,
          expectedKeywords: targetQuestion.expectedKeywords || [],
        });

        // Stream coaching feedback chunks
        const feedbackWords = (evaluation.feedback || 'Good verbal response.').split(' ');
        let streamedText = '';

        for (let i = 0; i < feedbackWords.length; i++) {
          const word = feedbackWords[i] + ' ';
          streamedText += word;
          io.to(roomName).emit('aiResponseChunk', {
            chunk: word,
            textSoFar: streamedText,
            isComplete: i === feedbackWords.length - 1,
            field: 'feedback',
          });
        }

        // Save answer
        const existingAnsIdx = interview.answers.findIndex(
          (a) => a.questionId === targetQuestion.questionId
        );

        const answerRecord = {
          questionId: targetQuestion.questionId,
          userAnswer: transcript.trim(),
          technicalAccuracy: evaluation.technicalAccuracy,
          completeness: evaluation.completeness,
          problemSolving: evaluation.problemSolving,
          communication: evaluation.communication,
          clarity: evaluation.clarity,
          overall: evaluation.overall,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          missingConcepts: evaluation.missingConcepts,
          feedback: evaluation.feedback,
          submittedAt: new Date(),
        };

        if (existingAnsIdx >= 0) {
          interview.answers[existingAnsIdx] = answerRecord;
        } else {
          interview.answers.push(answerRecord);
        }

        // Recalculate cumulative scores
        const answersCount = interview.answers.length;
        const totalAccuracy = interview.answers.reduce((acc, a) => acc + (a.technicalAccuracy || 0), 0);
        const totalCompleteness = interview.answers.reduce((acc, a) => acc + (a.completeness || 0), 0);
        const totalProblemSolving = interview.answers.reduce((acc, a) => acc + (a.problemSolving || 0), 0);
        const totalCommunication = interview.answers.reduce((acc, a) => acc + (a.communication || 0), 0);
        const totalClarity = interview.answers.reduce((acc, a) => acc + (a.clarity || 0), 0);
        const totalOverall = interview.answers.reduce((acc, a) => acc + (a.overall || 0), 0);

        interview.scores = {
          technicalAccuracy: Math.round(totalAccuracy / answersCount),
          completeness: Math.round(totalCompleteness / answersCount),
          problemSolving: Math.round(totalProblemSolving / answersCount),
          communication: Math.round(totalCommunication / answersCount),
          clarity: Math.round(totalClarity / answersCount),
          overall: Math.round(totalOverall / answersCount),
        };
        interview.overallScore = interview.scores.overall;

        const isLastQuestion = questionIndex + 1 >= interview.questions.length;
        const nextIndex = questionIndex + 1;
        interview.currentQuestionIndex = nextIndex;

        // Emit evaluation and score updates
        io.to(roomName).emit('answerEvaluated', {
          evaluation,
          voiceSignals: evaluation.voiceSignals,
          currentQuestionIndex: nextIndex,
          isLastQuestion,
          cumulativeScores: interview.scores,
          overallScore: interview.overallScore,
        });

        io.to(roomName).emit('scoreUpdated', {
          overallScore: interview.overallScore,
          scores: interview.scores,
        });

        if (isLastQuestion) {
          interview.status = 'completed';
          interview.completedAt = new Date();

          const questionsAndAnswers = interview.questions.map((q) => {
            const ans = interview.answers.find((a) => a.questionId === q.questionId) || {};
            return {
              question: q.question,
              category: q.category,
              difficulty: q.difficulty,
              userAnswer: ans.userAnswer || 'No answer submitted',
              overallScore: ans.overall || 0,
              technicalAccuracy: ans.technicalAccuracy || 0,
              strengths: ans.strengths || [],
              weaknesses: ans.weaknesses || [],
              missingConcepts: ans.missingConcepts || [],
            };
          });

          const finalReport = await synthesizeFinalReport({
            targetRole: interview.targetRole,
            difficulty: interview.difficulty,
            type: interview.type,
            questionsAndAnswers,
          });

          interview.feedback = finalReport;
          interview.overallScore = finalReport.overallScore || interview.overallScore;
          await interview.save();

          io.to(roomName).emit('interviewCompleted', {
            finalReport,
            overallScore: interview.overallScore,
            scores: interview.scores,
            status: 'completed',
            completedAt: interview.completedAt,
          });
        } else {
          await interview.save();
          const nextQuestion = interview.questions[nextIndex];
          io.to(roomName).emit('questionReady', {
            question: nextQuestion,
            questionIndex: nextIndex,
            totalQuestions: interview.questions.length,
          });
        }

        if (typeof callback === 'function') {
          callback({
            success: true,
            evaluation,
            voiceSignals: evaluation.voiceSignals,
            isLastQuestion,
            overallScore: interview.overallScore,
          });
        }
      } catch (err) {
        logger.error(`[Socket submitVoiceAnswer Error]: ${err.message}`);
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 4. Pause Interview
     */
    socket.on('pauseInterview', async ({ interviewId, elapsedSeconds }) => {
      try {
        const interview = await Interview.findOne({ _id: interviewId, userId: socket.userId });
        if (!interview) {
          socket.emit('error', { message: 'Unauthorized or interview not found.', code: 'UNAUTHORIZED' });
          return;
        }

        const roomName = `interview:${interviewId}`;
        io.to(roomName).emit('interviewPaused', {
          interviewId,
          elapsedSeconds: elapsedSeconds || 0,
          pausedAt: new Date(),
        });
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 5. Resume Interview
     */
    socket.on('resumeInterview', async ({ interviewId }) => {
      try {
        const interview = await Interview.findOne({ _id: interviewId, userId: socket.userId });
        if (!interview) {
          socket.emit('error', { message: 'Unauthorized or interview not found.', code: 'UNAUTHORIZED' });
          return;
        }

        const roomName = `interview:${interviewId}`;
        io.to(roomName).emit('interviewResumed', {
          interviewId,
          resumedAt: new Date(),
        });
      } catch (err) {
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 6. End Interview Early & Finalize Report
     */
    socket.on('endInterview', async ({ interviewId }, callback) => {
      try {
        const interview = await Interview.findOne({ _id: interviewId, userId: socket.userId });
        if (!interview) {
          socket.emit('error', { message: 'Unauthorized or interview not found.', code: 'UNAUTHORIZED' });
          return;
        }

        interview.status = 'completed';
        interview.completedAt = new Date();

        const questionsAndAnswers = interview.questions.map((q) => {
          const ans = interview.answers.find((a) => a.questionId === q.questionId) || {};
          return {
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            userAnswer: ans.userAnswer || 'No answer submitted',
            overallScore: ans.overall || 0,
            technicalAccuracy: ans.technicalAccuracy || 0,
            strengths: ans.strengths || [],
            weaknesses: ans.weaknesses || [],
            missingConcepts: ans.missingConcepts || [],
          };
        });

        const finalReport = await synthesizeFinalReport({
          targetRole: interview.targetRole,
          difficulty: interview.difficulty,
          type: interview.type,
          questionsAndAnswers,
        });

        interview.feedback = finalReport;
        interview.overallScore = finalReport.overallScore || interview.overallScore;
        await interview.save();

        const roomName = `interview:${interviewId}`;
        const payload = {
          finalReport,
          overallScore: interview.overallScore,
          scores: interview.scores,
          status: 'completed',
          completedAt: interview.completedAt,
        };

        io.to(roomName).emit('interviewCompleted', payload);
        if (typeof callback === 'function') callback({ success: true, ...payload });
      } catch (err) {
        logger.error(`[Socket endInterview Error]: ${err.message}`);
        socket.emit('error', { message: err.message, code: 'SERVER_ERROR' });
      }
    });

    /**
     * 7. Disconnection Handler
     */
    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
    });
  });
};

module.exports = {
  registerInterviewSocketHandlers,
};
