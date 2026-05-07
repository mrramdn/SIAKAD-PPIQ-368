import { RiasecCode, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { SubmitAssessmentInput } from "./assessment.validation";

type ScoreMap = Record<RiasecCode, number>;

const initialScores: ScoreMap = {
  R: 0,
  I: 0,
  A: 0,
  S: 0,
  E: 0,
  C: 0,
};

function getDominantCode(scores: ScoreMap) {
  return Object.entries(scores)
    .toSorted((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([code]) => code)
    .join("");
}

function getSummary(dominantCode: string) {
  return `Minat utama user mengarah pada kombinasi kode RIASEC ${dominantCode}.`;
}

export async function submitAssessment(userId: string, input: SubmitAssessmentInput) {
  const activeQuestions = await prisma.riasecQuestion.findMany({
    where: { isActive: true },
    select: { id: true, code: true },
  });

  if (activeQuestions.length === 0) {
    throw new Error("Pertanyaan assessment belum tersedia");
  }

  const questionById = new Map(activeQuestions.map((question) => [question.id, question]));
  const answerByQuestionId = new Map(input.answers.map((answer) => [answer.questionId, answer]));

  if (answerByQuestionId.size !== input.answers.length) {
    throw new Error("Jawaban assessment mengandung pertanyaan duplikat");
  }

  const missingQuestion = activeQuestions.find((question) => !answerByQuestionId.has(question.id));

  if (missingQuestion) {
    throw new Error("Semua pertanyaan aktif wajib dijawab");
  }

  const invalidQuestion = input.answers.find((answer) => !questionById.has(answer.questionId));

  if (invalidQuestion) {
    throw new Error("Jawaban mengandung pertanyaan tidak aktif atau tidak ditemukan");
  }

  const scores = { ...initialScores };

  for (const answer of input.answers) {
    const question = questionById.get(answer.questionId);

    if (question) {
      scores[question.code] += answer.score;
    }
  }

  const dominantCode = getDominantCode(scores);

  const assessment = await prisma.assessmentResult.create({
    data: {
      userId,
      realisticScore: scores.R,
      investigativeScore: scores.I,
      artisticScore: scores.A,
      socialScore: scores.S,
      enterprisingScore: scores.E,
      conventionalScore: scores.C,
      dominantCode,
      summary: getSummary(dominantCode),
      answers: {
        create: input.answers.map((answer) => ({
          questionId: answer.questionId,
          score: answer.score,
        })),
      },
    },
    select: {
      id: true,
      realisticScore: true,
      investigativeScore: true,
      artisticScore: true,
      socialScore: true,
      enterprisingScore: true,
      conventionalScore: true,
      dominantCode: true,
      summary: true,
      createdAt: true,
    },
  });

  return {
    assessmentId: assessment.id,
    scores: {
      R: assessment.realisticScore,
      I: assessment.investigativeScore,
      A: assessment.artisticScore,
      S: assessment.socialScore,
      E: assessment.enterprisingScore,
      C: assessment.conventionalScore,
    },
    dominantCode: assessment.dominantCode,
    summary: assessment.summary,
    createdAt: assessment.createdAt,
  };
}

export function listUserAssessments(userId: string) {
  return prisma.assessmentResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      realisticScore: true,
      investigativeScore: true,
      artisticScore: true,
      socialScore: true,
      enterprisingScore: true,
      conventionalScore: true,
      dominantCode: true,
      summary: true,
      createdAt: true,
    },
  });
}

export async function getAssessmentDetail(assessmentId: string, currentUser: { id: string; role: UserRole }) {
  const assessment = await prisma.assessmentResult.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      userId: true,
      realisticScore: true,
      investigativeScore: true,
      artisticScore: true,
      socialScore: true,
      enterprisingScore: true,
      conventionalScore: true,
      dominantCode: true,
      summary: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      answers: {
        orderBy: { question: { order: "asc" } },
        select: {
          id: true,
          score: true,
          question: {
            select: {
              id: true,
              code: true,
              question: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!assessment) {
    throw new Error("Assessment tidak ditemukan");
  }

  if (currentUser.role !== UserRole.ADMIN && assessment.userId !== currentUser.id) {
    throw new Error("Assessment tidak dapat diakses");
  }

  return assessment;
}
