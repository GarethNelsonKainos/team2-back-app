import express from "express";
import jobRoleRoutes from "./routes/job-role.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { ApplicationController } from "./controllers/application.controller.js";
import { S3Service } from "./services/s3.service.js";
import { ApplicationService } from "./services/application.service.js";
import { ApplicationDao } from "./daos/application.dao.js";
import applicationRouter from "./routes/application.routes.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

const applicationController = new ApplicationController(
	new ApplicationService(new ApplicationDao(), new S3Service()),
);

app.use(express.json());
app.use(jobRoleRoutes);
app.use(authRoutes);

app.use(applicationRouter(applicationController));

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
