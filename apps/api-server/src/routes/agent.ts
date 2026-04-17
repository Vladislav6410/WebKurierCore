import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { SecuritySearchAdapter } from '@webkurier/agent-bridge/security';

const router = Router();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.SECURITY_RATE_LIMIT_PER_MINUTE ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many security requests',
  },
});

const requestSchema = z.object({
  action: z.enum(['check', 'analyze']).default('check'),
  target: z.string().min(1),
  mode: z.enum(['fast', 'agentic']).default('fast'),
});

router.post('/api/v1/agent/security', limiter, async (req, res) => {
  const parsed = requestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: parsed.error.flatten(),
    });
  }

  try {
    const adapter = new SecuritySearchAdapter();

    const data = await adapter.check(parsed.data.target, {
      mode: parsed.data.action === 'analyze' ? 'agentic' : parsed.data.mode,
    });

    return res.json({ data });
  } catch (error: unknown) {
    console.error('Security endpoint error:', error);

    return res.status(503).json({
      error: 'Security check temporarily unavailable',
    });
  }
});

export default router;