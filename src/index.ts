import express from "express";
import jobRoleRoutes from "./routes/job-role.routes.js";
import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import { ApplicationController } from "./controllers/application.controller.js";
import { ApplicationService } from "./services/application.service.js";
import { ApplicationDao } from "./daos/application.dao.js";
import { S3Service } from "./services/s3.service.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(jobRoleRoutes);
app.use(authRoutes);
const applicationController = new ApplicationController(
	new ApplicationService(new ApplicationDao(), new S3Service()),
);
app.use(applicationRoutes(applicationController));

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
