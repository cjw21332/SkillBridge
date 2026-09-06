import { Router, Response, NextFunction } from "express";
import { authenticate, AuthRequest } from "../../middleware/auth.middleware";
import { discoverService } from "./discover.service";

const router = Router();

router.use(authenticate);

router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const candidates = await discoverService.getCandidates(req.user!.id);
    res.json(candidates);
  } catch (err) {
    next(err);
  }
});

export default router;
