import { objectType, extendType, nonNull, intArg } from "nexus";
import { User } from "@prisma/client";

export const Vote = objectType({
  name: "Vote",
  definition(t) {
    t.nonNull.field("project", { type: "Project" });
    t.nonNull.field("user", { type: "User" });
  },
});

export const VoteMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("vote", {
      type: "Vote",
      args: {
        projectId: nonNull(intArg()),
      },
      async resolve(parent, args, context) {
        const { userId } = context;
        const { projectId } = args;
        if (!userId) {
          throw new Error("Cannot vote without logging in.");
        }
        const project = await context.prisma.project.update({
          where: {
            id: projectId,
          },
          data: {
            voters: {
              connect: {
                id: userId,
              },
            },
          },
        });
        const user = await context.prisma.user.findUnique({
          where: { id: userId },
        });
        return {
          project,
          user: user as User,
        };
      },
    });
  },
});
