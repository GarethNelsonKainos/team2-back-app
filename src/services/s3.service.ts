import AWS from "aws-sdk";
import type { Express } from "express";

export class S3Service {
	private s3: AWS.S3;
	private bucketName: string;

	constructor() {
		this.bucketName = process.env.S3_BUCKET_NAME || "";

		if (!this.bucketName) {
			throw new Error("S3_BUCKET_NAME environment variable is not set");
		}

		// AWS SDK v2 automatically uses credentials from environment variables
		// or AWS credentials file (~/.aws/credentials)
		this.s3 = new AWS.S3({
			region: process.env.AWS_REGION || "us-east-1",
		});
	}

	async uploadFile(
		file: Express.Multer.File,
		fileKey: string,
	): Promise<string> {
		if (!file) {
			throw new Error("No file provided");
		}

		const params: AWS.S3.PutObjectRequest = {
			Bucket: this.bucketName,
			Key: fileKey,
			Body: file.buffer,
			ContentType: file.mimetype,
		};

		try {
			await this.s3.upload(params).promise();

			// Return S3 object URL
			const region = process.env.AWS_REGION || "us-east-1";
			const fileUrl = `https://${this.bucketName}.s3.${region}.amazonaws.com/${fileKey}`;
			return fileUrl;
		} catch (error) {
			console.error("Error uploading file to S3:", error);
			throw new Error(`Failed to upload file to S3: ${error}`);
		}
	}

	generateFileKey(originalFilename: string, applicationId?: string): string {
		// Generate a unique file key: applications/{applicationId}/{timestamp}_{originalFilename}
		// If no applicationId provided yet, use a unique identifier
		const timestamp = Date.now();
		const sanitizedFilename = originalFilename.replace(/\s+/g, "_");
		const appId = applicationId || `temp-${Date.now()}`;
		return `applications/${appId}/${timestamp}_${sanitizedFilename}`;
	}
}
