import { asyncHandler } from '../utils/AppError.js';
import { overview, analytics } from '../services/analytics.service.js';
export const getOverview = asyncHandler(async (req, res) => res.json(await overview(req.user._id)));
export const getAnalytics = asyncHandler(async (req, res) => res.json(await analytics(req.user._id, req.validatedQuery.days)));
