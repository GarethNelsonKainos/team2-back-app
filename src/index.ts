import express from "express";
import jobRoleRoutes from "./routes/job-role.routes.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());
app.use(jobRoleRoutes);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
