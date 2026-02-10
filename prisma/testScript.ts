import { prisma } from '../src/daos/prisma'

async function main() {
    // Create a Capability
    /* const capability = await prisma.capability.create({
        data: {
            capabilityName: 'Software Engineering',
        },
    });
    console.log('Created Capability:', capability);

    // Read all Capabilities
    const allCapabilities = await prisma.capability.findMany();
    console.log('All Capabilities:', allCapabilities);

    // Create Bands
    const band = await prisma.band.create({
        data: {
            bandName: 'apprentice',
        },
    });
    console.log('Created Band:', band);

    const band2 = await prisma.band.create({
        data: {
            bandName: 'Principal',
        },
    });
    console.log('Created Band:', band2);

    // Read all Bands
    const allBands = await prisma.band.findMany();
    console.log('All Bands:', allBands); */

    // Create a JobRole linked to the above Capability and Band
    const jobRole = await prisma.jobRole.create({
        data: {
            roleName: 'Backend Developer 2',
            location: 'Belfast',
            closingDate: new Date('2026-03-01T00:00:00Z'),
            capabilityId: '692c30e5-9bb4-4bfd-a28f-e17034d54f00',
            bandId: '7061da5b-9309-44c0-947f-089d31ccb1a9',
        },
    });
    console.log('Created JobRole:', jobRole);

    // Read all JobRoles
    const allJobRoles = await prisma.jobRole.findMany();
    console.log('All JobRoles:', allJobRoles);
}

main()
    .catch((e) => {
        console.error(e);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });