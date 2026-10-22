import express from "express";
import cors from "cors";
import ordersRouter from "./routes/orders.routes";


const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Orders Console API is running",
  });
});

app.use("/api/orders", ordersRouter);

export default app;
