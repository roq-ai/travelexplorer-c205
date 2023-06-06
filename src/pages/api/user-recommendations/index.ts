import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from 'server/db';
import { authorizationValidationMiddleware, errorHandlerMiddleware } from 'server/middlewares';
import { userRecommendationValidationSchema } from 'validationSchema/user-recommendations';
import { convertQueryToPrismaUtil } from 'server/utils';
import { getServerSession } from '@roq/nextjs';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { roqUserId, user } = await getServerSession(req);
  switch (req.method) {
    case 'GET':
      return getUserRecommendations();
    case 'POST':
      return createUserRecommendation();
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  async function getUserRecommendations() {
    const data = await prisma.user_recommendation
      .withAuthorization({
        roqUserId,
        tenantId: user.tenantId,
        roles: user.roles,
      })
      .findMany(convertQueryToPrismaUtil(req.query, 'user_recommendation'));
    return res.status(200).json(data);
  }

  async function createUserRecommendation() {
    await userRecommendationValidationSchema.validate(req.body);
    const body = { ...req.body };

    const data = await prisma.user_recommendation.create({
      data: body,
    });
    return res.status(200).json(data);
  }
}

export default function apiHandler(req: NextApiRequest, res: NextApiResponse) {
  return errorHandlerMiddleware(authorizationValidationMiddleware(handler))(req, res);
}
