-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('VOCABULARY', 'GRAMMAR', 'SENTENCE_COMPLETION', 'TRANSLATION_EN_TR', 'TRANSLATION_TR_EN', 'READING', 'COHERENCE', 'DIALOGUE', 'PARAPHRASE', 'MISSING_SENTENCE', 'IRRELEVANT_SENTENCE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('SEED', 'ADMIN', 'AI');

-- CreateEnum
CREATE TYPE "ExamKind" AS ENUM ('PLACEMENT', 'QUICK', 'DAILY', 'INTENSIVE', 'FULL');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VocabStatus" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'LEARNED');

-- CreateEnum
CREATE TYPE "AiTask" AS ENUM ('QUESTION_GENERATION', 'QUESTION_VERIFICATION', 'EXPLANATION', 'PERFORMANCE_REVIEW', 'DISTRIBUTION', 'VOCABULARY');

-- CreateEnum
CREATE TYPE "AiLogStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'INVALID_OUTPUT', 'PROVIDER_ERROR', 'DISABLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL DEFAULT 'Yaren',
    "onboardingCompletedAt" TIMESTAMP(3),
    "placementCompletedAt" TIMESTAMP(3),
    "estimatedLevel" TEXT,
    "recommendedDailyMinutes" INTEGER,
    "startingPlan" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "campStartDate" TEXT NOT NULL,
    "examDate" TEXT,
    "dailyQuestionCount" INTEGER NOT NULL DEFAULT 20,
    "dailyDurationMinutes" INTEGER NOT NULL DEFAULT 35,
    "quickQuestionCount" INTEGER NOT NULL DEFAULT 10,
    "quickDurationMinutes" INTEGER NOT NULL DEFAULT 18,
    "intensiveQuestionCount" INTEGER NOT NULL DEFAULT 40,
    "intensiveDurationMinutes" INTEGER NOT NULL DEFAULT 70,
    "fullMockEnabled" BOOLEAN NOT NULL DEFAULT false,
    "fullMockQuestionCount" INTEGER NOT NULL DEFAULT 80,
    "fullMockDurationMinutes" INTEGER NOT NULL DEFAULT 180,
    "placementQuestionCount" INTEGER NOT NULL DEFAULT 22,
    "placementDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "topicWeights" JSONB NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiAutoPublish" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "description" TEXT NOT NULL,
    "lesson" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "topicId" TEXT NOT NULL,
    "subtopic" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "passage" TEXT,
    "stem" TEXT NOT NULL,
    "correctLabel" VARCHAR(1) NOT NULL,
    "explanation" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "tip" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "contentHash" TEXT NOT NULL,
    "qualityStatus" "QualityStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "qualityReport" JSONB,
    "source" "QuestionSource" NOT NULL DEFAULT 'ADMIN',
    "aiLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "label" VARCHAR(1) NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "rationale" TEXT NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionExposure" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "lastCorrect" BOOLEAN,

    CONSTRAINT "QuestionExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ExamKind" NOT NULL,
    "title" TEXT NOT NULL,
    "studyDate" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "topicPlan" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadlineAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "correctCount" INTEGER,
    "wrongCount" INTEGER,
    "blankCount" INTEGER,
    "scorePercent" DOUBLE PRECISION,
    "durationSeconds" INTEGER,
    "summary" JSONB,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedLabel" VARCHAR(1),
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isCorrect" BOOLEAN,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicPerformance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "questionsSeen" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "wrong" INTEGER NOT NULL DEFAULT 0,
    "blank" INTEGER NOT NULL DEFAULT 0,
    "recentAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastPracticedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TopicPerformance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "meaningTr" TEXT NOT NULL,
    "partOfSpeech" TEXT NOT NULL,
    "exampleEn" TEXT,
    "exampleTr" TEXT,
    "synonyms" TEXT[],
    "antonyms" TEXT[],
    "status" "VocabStatus" NOT NULL DEFAULT 'NEW',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "sourceQuestionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "VocabularyItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyReview" (
    "id" TEXT NOT NULL,
    "vocabularyItemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "previousInterval" INTEGER NOT NULL,
    "newInterval" INTEGER NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VocabularyReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "studyDate" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "focusTopics" JSONB NOT NULL,
    "reviewList" JSONB NOT NULL,
    "vocabularyToReview" JSONB NOT NULL,
    "extraQuestionCount" INTEGER NOT NULL,
    "nextGoal" TEXT NOT NULL,
    "aiEnhanced" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DailyRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyStreak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TEXT,
    "totalStudyDays" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiGenerationLog" (
    "id" TEXT NOT NULL,
    "task" "AiTask" NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "AiLogStatus" NOT NULL,
    "requestSummary" TEXT NOT NULL,
    "rawResponse" TEXT,
    "errorMessage" TEXT,
    "itemsAccepted" INTEGER NOT NULL DEFAULT 0,
    "itemsRejected" INTEGER NOT NULL DEFAULT 0,
    "rejectionNotes" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiGenerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE INDEX "Topic_questionType_idx" ON "Topic"("questionType");

-- CreateIndex
CREATE UNIQUE INDEX "Question_contentHash_key" ON "Question"("contentHash");

-- CreateIndex
CREATE INDEX "Question_qualityStatus_type_idx" ON "Question"("qualityStatus", "type");

-- CreateIndex
CREATE INDEX "Question_topicId_difficulty_idx" ON "Question"("topicId", "difficulty");

-- CreateIndex
CREATE INDEX "Question_createdAt_idx" ON "Question"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_label_key" ON "QuestionOption"("questionId", "label");

-- CreateIndex
CREATE INDEX "QuestionExposure_userId_lastSeenAt_idx" ON "QuestionExposure"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionExposure_userId_questionId_key" ON "QuestionExposure"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Exam_userId_createdAt_idx" ON "Exam"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_userId_studyDate_kind_key" ON "Exam"("userId", "studyDate", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_position_key" ON "ExamQuestion"("examId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ExamQuestion_examId_questionId_key" ON "ExamQuestion"("examId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamAttempt_examId_key" ON "ExamAttempt"("examId");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_status_idx" ON "ExamAttempt"("userId", "status");

-- CreateIndex
CREATE INDEX "ExamAttempt_userId_completedAt_idx" ON "ExamAttempt"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_attemptId_questionId_key" ON "UserAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "TopicPerformance_userId_masteryScore_idx" ON "TopicPerformance"("userId", "masteryScore");

-- CreateIndex
CREATE UNIQUE INDEX "TopicPerformance_userId_topicId_key" ON "TopicPerformance"("userId", "topicId");

-- CreateIndex
CREATE INDEX "VocabularyItem_userId_dueAt_idx" ON "VocabularyItem"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "VocabularyItem_userId_status_idx" ON "VocabularyItem"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyItem_userId_term_key" ON "VocabularyItem"("userId", "term");

-- CreateIndex
CREATE INDEX "VocabularyReview_userId_reviewedAt_idx" ON "VocabularyReview"("userId", "reviewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyRecommendation_attemptId_key" ON "DailyRecommendation"("attemptId");

-- CreateIndex
CREATE INDEX "DailyRecommendation_userId_studyDate_idx" ON "DailyRecommendation"("userId", "studyDate");

-- CreateIndex
CREATE UNIQUE INDEX "StudyStreak_userId_key" ON "StudyStreak"("userId");

-- CreateIndex
CREATE INDEX "AiGenerationLog_task_createdAt_idx" ON "AiGenerationLog"("task", "createdAt");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_aiLogId_fkey" FOREIGN KEY ("aiLogId") REFERENCES "AiGenerationLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExposure" ADD CONSTRAINT "QuestionExposure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionExposure" ADD CONSTRAINT "QuestionExposure_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPerformance" ADD CONSTRAINT "TopicPerformance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicPerformance" ADD CONSTRAINT "TopicPerformance_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyItem" ADD CONSTRAINT "VocabularyItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyReview" ADD CONSTRAINT "VocabularyReview_vocabularyItemId_fkey" FOREIGN KEY ("vocabularyItemId") REFERENCES "VocabularyItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VocabularyReview" ADD CONSTRAINT "VocabularyReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyRecommendation" ADD CONSTRAINT "DailyRecommendation_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyStreak" ADD CONSTRAINT "StudyStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiGenerationLog" ADD CONSTRAINT "AiGenerationLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
