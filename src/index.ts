import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import connectDB from "./config/connect.db";
import authRoutes from "./routes/auth.routes";
import moduleAccessRoutes from "./routes/moduleAccess.routes";
import whereIAmNowRoutes from "./routes/whereIAmNow.routes";
import perspectiveRoutes from "./routes/perspective.routes";
import lifePlanModulesRoutes from "./routes/lifePlanModules.routes";
import gettingStartedModulesRoutes from "./routes/gettingStartedModules.routes";
import chatRoutes from "./routes/chat.routes";
const PORT = process.env.PORT;

const app: Express = express();

connectDB();

const corsOptions = {
  origin: String(process.env.FRONTEND_URL) || [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://yourlifeplanjourney.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  credentials: true,
  exposedHeaders: ["Content-Disposition"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/modules", moduleAccessRoutes);
app.use("/api/v1/modules", whereIAmNowRoutes);
app.use("/api/v1/modules", perspectiveRoutes);
app.use("/api/v1/modules", lifePlanModulesRoutes);
app.use("/api/v1/modules", gettingStartedModulesRoutes);
app.use("/api/v1/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Life Plan API. Backend working fine.");
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
