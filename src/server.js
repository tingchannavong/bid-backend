import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import productRoutes from "./routes/product.route.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";
import authRoute from "./routes/auth.route.js";
import auctionRoutes from "./routes/auction.route.js";
import bidRoutes from "./routes/bid.route.js";
import paymentRoutes from "./routes/payment.route.js";
import { createServer } from "node:http";
import initSocket from "./sockets/index.js";
import path from "path";
import { fileURLToPath } from "url";
import { auctionStatusUpdateTask } from "./jobs/auctionCron.js";
import { initializeAuctionEndTimers, initializeAuctionStartTimers } from "./services/auction.service.js";

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

initSocket(server, CLIENT_URL);

// DOCUMENTATIONS
app.use("/socket-docs", express.static(path.join(__dirname, "docs")));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(express.json());

auctionStatusUpdateTask.start();

app.use("/api/auth", authRoute);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/payments", paymentRoutes);
app.get('/health', (req, res) => res.status(200).send('ok'));

app.use(notFound);

app.use(errorHandler);

server.listen(PORT, async () => {
  console.log(`server is running at http://localhost:${PORT}`);
  // await initializeAuctionStartTimers();
  await initializeAuctionEndTimers();
});

console.log("Hit the route!");
