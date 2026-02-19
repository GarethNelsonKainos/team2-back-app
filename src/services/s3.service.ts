import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

export class S3Service {
	private s3: S3Client;
	private bucketName: string;

	constructor() {
		if (!process.env.S3_BUCKET_NAME) {
			throw new Error("S3_BUCKET_NAME environment variable is not set");
		}

		this.bucketName = process.env.S3_BUCKET_NAME;

		const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
		const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
		const region = process.env.AWS_REGION || "us-east-1";

		if (!accessKeyId || !secretAccessKey) {
			throw new Error(
				"AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables must be set",
			);
		}

		// Explicitly pass credentials for better control and clarity
		this.s3 = new S3Client({
			region,
			credentials: {
				accessKeyId,
				secretAccessKey,
			},
		});
	}

	async uploadFile(
		file: Express.Multer.File,
		fileKey: string,
	): Promise<string> {
		if (!file) {
			throw new Error("No file provided");
		}

		const params = {
			Bucket: this.bucketName,
			Key: fileKey,
			Body: file.buffer,
			ContentType: file.mimetype,
		};

		try {
			await this.s3.send(new PutObjectCommand(params));

			// Return S3 object URL
			const region = process.env.AWS_REGION || "us-east-1";
			const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
			return fileUrl;
		} catch (error) {
			console.error("Error uploading file to S3:", error);
			throw new Error("Failed to upload file to S3");
		}
	}

	generateFileKey(originalFilename: string, applicationId: string): string {
		const key = randomUUID();
		const sanitizedFilename = originalFilename.replace(/\s+/g, "_");
		return `applications/${applicationId}/${key}_${sanitizedFilename}`;
	}
}
