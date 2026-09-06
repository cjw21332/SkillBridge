import { Request, Response } from "express";
import { skillsService } from "./skills.service";

export const skillsController = {
  search: async (req: Request, res: Response) => {
    const query = (req.query.search || req.query.q || req.query.query || "") as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const skills = await skillsService.search(query, limit);
    res.json(skills);
  },
  create: async (req: Request, res: Response) => {
    const skill = await skillsService.create(req.body.name, req.body.category);
    res.status(201).json(skill);
  },
};
