import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const newProject = await prisma.project.create({
    data: {
      title: "Project1",
      description: "Description 1",
    },
  });

  const allProjects = await prisma.project.findMany();
  console.log(allProjects);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
