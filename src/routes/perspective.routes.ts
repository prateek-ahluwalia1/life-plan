import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import {
  getModule3Data,
  saveModule3Data,
  deleteModule3Data,
} from "../controllers/perspective.controller";

const perspectiveRoutes = Router();

perspectiveRoutes.get("/perspective/module-3", authMiddleware, getModule3Data);
perspectiveRoutes.put("/perspective/module-3", authMiddleware, saveModule3Data);
perspectiveRoutes.delete("/perspective/module-3", authMiddleware, deleteModule3Data);

export default perspectiveRoutes;
