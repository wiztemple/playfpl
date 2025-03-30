import { prisma } from "@/lib/db";

export async function setupFirstAdmin() {
    const firstAdminEmail = process.env.FIRST_ADMIN_EMAIL;

    if (!firstAdminEmail) {
        console.log("No FIRST_ADMIN_EMAIL environment variable set. Skipping admin setup.");
        return;
    }

    try {
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { email: firstAdminEmail },
        });

        if (!user) {
            console.log(`User with email ${firstAdminEmail} not found. Cannot set as admin.`);
            return;
        }

        // Use raw query to check if user is admin
        const adminCheck = await prisma.$queryRaw`
            SELECT "isAdmin" FROM "User" WHERE id = ${user.id}
        `;
        
        const isAlreadyAdmin = (adminCheck as any[])[0]?.isAdmin === true;
        
        if (isAlreadyAdmin) {
            console.log(`User ${firstAdminEmail} is already an admin.`);
            return;
        }

        // Use raw query to set user as admin
        await prisma.$executeRaw`
            UPDATE "User" SET "isAdmin" = true WHERE id = ${user.id}
        `;

        console.log(`Successfully set ${firstAdminEmail} as an admin.`);
    } catch (error) {
        console.error("Error setting up first admin:", error);
    }
}