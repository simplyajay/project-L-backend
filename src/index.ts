import express from "express";
import cors from "cors";
import env from "./config/env";
import helmet from "helmet";
import morgan from "morgan";
import databaseConfig from "./config/db";
import route from "./core/route/route";
import ngrok from "ngrok";

const PORT = Number(env.get("PORT")) || 54321;
const RGNOK_TOKEN = env.get("RGNOK_AUTH_TOKEN");
const HOST = "0.0.0.0";

const app = express();

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());

const startServer = async ({ toNgrok }: { toNgrok?: boolean } = {}) => {
  await databaseConfig.connect();

  if (!databaseConfig.isConnected()) {
    console.error("Server error: Could not connect to the database.");
    process.exit(1);
  }
  route(app);

  app.listen(PORT, HOST, async () => {
    console.log(`Server running on ${HOST}:${PORT}`);

    if (toNgrok) {
      try {
        const url = await ngrok.connect({ addr: PORT, authtoken: RGNOK_TOKEN });

        console.log("Ngrok connected at : ", url);
      } catch (error) {
        console.error("Ngrok: Failed to start", error);
      }
    }
  });
};

startServer();
