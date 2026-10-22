import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Orders Console API is running",
  });
});

export default app;
