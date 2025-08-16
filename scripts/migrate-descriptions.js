import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateDescriptions() {
  try {
    console.log("Starting description migration...");

    // Get all artworks
    const artworks = await prisma.artwork.findMany();
    console.log(`Found ${artworks.length} artworks to migrate`);

    let migratedCount = 0;

    for (const artwork of artworks) {
      // Check if description is already in the new format
      if (
        typeof artwork.description === "object" &&
        artwork.description !== null
      ) {
        console.log(
          `Artwork "${artwork.title}" already has multi-language description, skipping...`
        );
        continue;
      }

      // Convert string description to multi-language format
      const oldDescription = artwork.description || "";
      const newDescription = {
        en: oldDescription,
        bg: oldDescription, // For now, use the same text for both languages
      };

      // Update the artwork
      await prisma.artwork.update({
        where: { id: artwork.id },
        data: { description: newDescription },
      });

      console.log(`Migrated artwork "${artwork.title}"`);
      migratedCount++;
    }

    console.log(`Migration completed! ${migratedCount} artworks migrated.`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateDescriptions();
