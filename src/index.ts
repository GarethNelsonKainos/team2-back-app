import express from 'express';
import jobRoleRoutes from './routes/job-role.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(jobRoleRoutes);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});