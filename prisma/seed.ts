import { prisma } from "../src/daos/prisma.js";
import argon2 from "argon2";

async function main() {

	try {
	//================== users ============================
		// Hash password with Argon2
		const hashedPassword = await argon2.hash("password123");

		// Create admin user
		const admin = await prisma.user.upsert({
			where: { email: "admin@test.com" },
			update: {},
			create: {
				email: "admin@test.com",
				firstName: "Admin",
				secondName: "User",
				password: hashedPassword,
				role: "admin",
			},
		});
		console.log("Created User:", admin);

		// Create regular user
		const regularUser = await prisma.user.upsert({
			where: { email: "user@test.com" },
			update: {},
			create: {
				email: "user@test.com",
				firstName: "Test",
				secondName: "User",
				password: hashedPassword,
				role: "user",
			},
		});
		console.log("Created User:", regularUser);

		// Create another test user
		const johnDoe = await prisma.user.upsert({
			where: { email: "john.doe@test.com" },
			update: {},
			create: {
				email: "john.doe@test.com",
				firstName: "John",
				secondName: "Doe",
				password: hashedPassword,
				role: "user",
			},
		});
		console.log("Created User:", johnDoe);

		console.log("✅ All users created with password: password123");

	
	//===========================================================
	//==================capabilities============================

		const engineering_capability = await prisma.capability.create({
			data: {
				capabilityName: "Engineering",
			},
		});
		console.log("Created Capability:", engineering_capability);
		const engineering_strategy_and_planning = await prisma.capability.create({
			data: {
				capabilityName: "Engineering Strategy and Planning",
			},
		});
		console.log("Created Capability:", engineering_strategy_and_planning);
		const architecture = await prisma.capability.create({
			data: {
				capabilityName: "Architecture",
			},
		});
		console.log("Created Capability:", architecture);
		const testing_and_quality_assurance = await prisma.capability.create({
			data: {
				capabilityName: "Testing and Quality Assurance",
			},
		});
		console.log("Created Capability:", testing_and_quality_assurance);
		const product_specialist = await prisma.capability.create({
			data: {
				capabilityName: "Product Specialist",
			},
		});
		console.log("Created Capability:", product_specialist);
		const low_code_Engineering = await prisma.capability.create({
			data: {
				capabilityName: "Low Code Engineering",
			},
		});
		console.log("Created Capability:", low_code_Engineering);
	
	//===========================================================	
	//==================bands============================
		 const apprentice = await prisma.band.create({
			data: {
				bandName: "Apprentice",
			},
		});
		console.log("Created Band:", apprentice);
		const trainee = await prisma.band.create({
			data: {
				bandName: "Trainee",
			},
		});
		console.log("Created Band:", trainee);
		const associate = await prisma.band.create({
			data: {
				bandName: "Associate",
			},
		});
		console.log("Created Band:", associate);
		const seniorAssociate = await prisma.band.create({
			data: {
				bandName: "Senior Associate",
			},
		});
		console.log("Created Band:", seniorAssociate);
		const consultant = await prisma.band.create({
			data: {
				bandName: "Consultant",
			},
		});
		console.log("Created Band:", consultant);
		const manager = await prisma.band.create({
			data: {
				bandName: "Manager",
			},
		});
		console.log("Created Band:", manager);
		const principal = await prisma.band.create({
			data: {
				bandName: "Principal",
			},
		});
		console.log("Created Band:", principal);
		const leadershipCommunity = await prisma.band.create({
			data: {
				bandName: "Leadership Community",
			},
		});
		console.log("Created Band:", leadershipCommunity);
	
	//===========================================================

	//==================job roles============================

	const softwareApprentice = await prisma.jobRole.create({
		data: {
			roleName: "Software Engineer",
			location: "Belfast",
			description:
				"As a Software Engineer at Kainos, you will be responsible for designing, developing, and maintaining software applications that meet our clients' needs. You will work closely with cross-functional teams to deliver high-quality solutions and contribute to the overall success of our projects.",
			responsibilities:
				"Design, develop, and maintain software applications. Collaborate with cross-functional teams to gather requirements and deliver solutions. Participate in code reviews and ensure adherence to coding standards. Troubleshoot and resolve software defects. Stay up-to-date with emerging technologies and industry trends.",
			numberOfOpenPositions: 1,
			sharepointUrl:
				"https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Apprentice%20Software%20Engineer%20(Apprentice).pdf",
			closingDate: new Date("2026-03-01T00:00:00Z"),
			capabilityId: engineering_capability.capabilityId,
			bandId: apprentice.bandId,
			statusId: (
				await prisma.status.findUniqueOrThrow({ where: { statusName: "Open" } })
			)?.statusId,
		},
	});
	console.log("Created JobRole:", softwareApprentice);

	const testEngAssociate = await prisma.jobRole.create({
		data: {
			roleName: "Test Engineer",
			location: "Poland",
			description:
				"As a Test Engineer at Kainos, you will play a crucial role in ensuring the quality and reliability of our software applications. You will be responsible for designing and executing test plans, identifying and documenting defects, and collaborating with development teams to resolve issues. Your work will contribute to delivering high-quality solutions that meet our clients' needs.",
			responsibilities:
				"Design and execute test plans to validate software functionality and performance. Identify, document, and track defects using issue tracking tools. Collaborate with development teams to understand requirements and provide feedback on testability. Participate in code reviews to ensure adherence to quality standards. Stay up-to-date with industry best practices in software testing and quality assurance.",
			numberOfOpenPositions: 0,
			sharepointUrl:
				"https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20%20Test%20Engineer%20(Associate).pdf",
			closingDate: new Date("2026-03-01T00:00:00Z"),
			capabilityId: testing_and_quality_assurance.capabilityId,
			bandId: associate.bandId,
			statusId: (
				await prisma.status.findUniqueOrThrow({
					where: { statusName: "Closed" },
				})
			)?.statusId,
		},
	});
	console.log("Created JobRole:", testEngAssociate);

	const innovationLeadConsultant = await prisma.jobRole.create({
		data: {
			roleName: "Innovation Lead",
			location: "Belfast",
			description:
				"As an Innovation Lead at Kainos, you will be responsible for driving innovation initiatives and fostering a culture of creativity within the organization. You will work closely with cross-functional teams to identify opportunities for innovation, develop strategies to implement new ideas, and lead projects that bring innovative solutions to our clients. Your role will be instrumental in positioning Kainos as a leader in technology innovation.",
			responsibilities:
				"Identify opportunities for innovation and develop strategies to implement new ideas. Lead cross-functional teams in the execution of innovation projects. Foster a culture of creativity and continuous improvement within the organization. Collaborate with clients to understand their needs and deliver innovative solutions that drive business value. Stay up-to-date with emerging technologies and industry trends to inform innovation efforts.",
			numberOfOpenPositions: 2,
			sharepointUrl:
				"https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Innovation%20Lead%20(Consultant).pdf",
			closingDate: new Date("2026-03-01T00:00:00Z"),
			capabilityId: engineering_strategy_and_planning.capabilityId,
			bandId: apprentice.bandId,
			statusId: (
				await prisma.status.findUniqueOrThrow({
					where: { statusName: "In Progress" },
				})
			)?.statusId,
		},
	});
	console.log("Created JobRole:", innovationLeadConsultant);

	const technicalArchitect = await prisma.jobRole.create({
		data: {
			roleName: "Technical Architect",
			location: "Belfast",
			description:
				"Technical Architects at Kainos are responsible for designing and overseeing the implementation of complex technical solutions that meet our clients' needs. They work closely with cross-functional teams to understand business requirements, develop architectural designs, and ensure that solutions are built according to best practices. Technical Architects play a key role in driving innovation and delivering high-quality solutions that align with our clients' strategic goals.",
			responsibilities:
				"Technical Architects should have a strong understanding of architectural principles and best practices. They will collaborate with clients and internal teams to gather requirements and develop architectural designs. They will oversee the implementation of solutions, ensuring they meet quality standards and align with business objectives. Additionally, they will stay informed about emerging technologies and industry trends to continuously improve our architectural practices.",
			numberOfOpenPositions: 1,
			sharepointUrl:
				"https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20Profile%20-%20Technical%20Architect%20(Consultant).pdf",
			closingDate: new Date("2026-03-01T00:00:00Z"),
			capabilityId: architecture.capabilityId,
			bandId: consultant.bandId,
			statusId: (
				await prisma.status.findUniqueOrThrow({ where: { statusName: "Open" } })
			)?.statusId,
		},
	});
	console.log("Created JobRole:", technicalArchitect);

	const seniorProductSpecialist = await prisma.jobRole.create({
		data: {
			roleName: "Senior Product Specialist",
			location: "Belfast",
			description:
				"A Senior Product Specialist at Kainos is responsible for providing expert knowledge and guidance on specific products or technologies. This role involves working closely with clients to understand their needs, offering tailored solutions, and ensuring the successful implementation of our products. The Senior Product Specialist will also play a key role in training and mentoring junior team members, sharing insights on industry trends, and contributing to the overall success of our product offerings.",
			responsibilities:
				"Senior Product Specialists should have a deep understanding of their respective products or technologies. They will work closely with clients to gather requirements and provide expert guidance on the best solutions. They will also mentor junior team members, share knowledge on industry trends, and contribute to the continuous improvement of our product offerings.",
			numberOfOpenPositions: 1,
			sharepointUrl:
				"https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Senior%20Product%20Specialist%20(SA).pdf",
			closingDate: new Date("2026-03-01T00:00:00Z"),
			capabilityId: product_specialist.capabilityId,
			bandId: seniorAssociate.bandId,
			statusId: (
				await prisma.status.findUniqueOrThrow({ where: { statusName: "Open" } })
			)?.statusId,
		},
	});
	console.log("Created JobRole:", seniorProductSpecialist);
	const lowCodeSolutionArchitect = await prisma.jobRole.create({
		data: {
			roleName: "Low Code Solution Architect",
			location: "Belfast",
			description:
				"A Low Code Solution Architect at Kainos is responsible for designing and implementing low code solutions that meet the needs of our clients. This role involves collaborating with cross-functional teams to understand business requirements, creating architectural designs, and overseeing the development and deployment of low code applications. The Low Code Solution Architect will play a key role in driving innovation and delivering efficient, scalable solutions using low code platforms.",
			responsibilities:
				"Low Code Solution Architects should have a strong understanding of low code platforms and their capabilities. They will work closely with clients to gather requirements and translate them into architectural designs. They will oversee the development process, ensuring that solutions are built according to best practices and meet quality standards. Additionally, they will stay up-to-date with emerging trends in low code development and continuously seek opportunities to leverage new technologies to enhance our offerings.",
			numberOfOpenPositions: 1,
			sharepointUrl:
				"https://kainossoftwareltd.sharepoint.com/sites/Career/JobProfiles/Engineering/Job%20profile%20-%20Low%20Code%20Solution%20Architect%20(M)%20.pdf",
			closingDate: new Date("2026-03-01T00:00:00Z"),
			capabilityId: low_code_Engineering.capabilityId,
			bandId: manager.bandId,
			statusId: (
				await prisma.status.findUniqueOrThrow({ where: { statusName: "Open" } })
			)?.statusId,
		},
	});
	console.log("Created JobRole:", lowCodeSolutionArchitect);
	}catch(error) {
		console.error("Error creating job roles:", error);
	}
	//===========================================================

	//================== applications ============================
	const application1 = await prisma.applications.create({
		data: {
			userId: (await prisma.user.findUniqueOrThrow({ where: { email: "user@test.com" } })).userId,
			jobRoleId: (await prisma.jobRole.findMany({ where: { roleName: "Software Engineer" } }))[0].jobRoleId,
			cvUrl: "https://example.com/cv1.pdf",
		},
	});
	console.log("Created Application:", application1);

	const application2 = await prisma.applications.create({
		data: {
			userId: (await prisma.user.findUniqueOrThrow({ where: { email: "user@test.com" } })).userId,
			jobRoleId: (await prisma.jobRole.findMany({ where: { roleName: "Test Engineer" } }))[0].jobRoleId,
			cvUrl: "https://example.com/cv2.pdf",
		},
	});
	console.log("Created Application:", application2);

	const application3 = await prisma.applications.create({
		data: {
			userId: (await prisma.user.findUniqueOrThrow({ where: { email: "john.doe@test.com" } })).userId,
			jobRoleId: (await prisma.jobRole.findMany({ where: { roleName: "Innovation Lead" } }))[0].jobRoleId,
			cvUrl: "https://example.com/cv3.pdf",
		},
	});
	console.log("Created Application:", application3);
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
