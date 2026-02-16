import express, { application } from "express";
import jobRoleRoutes from "./routes/job-role.routes.js";
import authRoutes from "./routes/auth.routes.js";
import applicationRoutes from "./routes/application.routes.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(jobRoleRoutes);
app.use(authRoutes);
app.use(applicationRoutes);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
