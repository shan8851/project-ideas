import {
  extendType,
  nonNull,
  objectType,
  stringArg,
  intArg,
  inputObjectType,
  enumType,
  arg,
  list,
} from "nexus";
import { Prisma } from "@prisma/client";

export const ProjectOrderByInput = inputObjectType({
  name: "ProjectOrderByInput",
  definition(t) {
    t.field("title", { type: Sort });
    t.field("description", { type: Sort });
    t.field("createdAt", { type: Sort });
  },
});

export const Sort = enumType({
  name: "Sort",
  members: ["asc", "desc"],
});

export const ProjectList = objectType({
  name: "ProjectList",
  definition(t) {
    t.nonNull.list.nonNull.field("projects", { type: Project });
    t.nonNull.int("count");
    t.id("id");
  },
});

export const Project = objectType({
  name: "Project",
  definition(t) {
    t.nonNull.int("id");
    t.nonNull.string("title");
    t.nonNull.string("description");
    t.nonNull.dateTime("createdAt");
    t.field("postedBy", {
      type: "User",
      resolve(parent, args, context) {
        return context.prisma.project
          .findUnique({ where: { id: parent.id } })
          .postedBy();
      },
    });
    t.nonNull.list.nonNull.field("voters", {
      type: "User",
      resolve(parent, args, context) {
        return context.prisma.project
          .findUnique({ where: { id: parent.id } })
          .voters();
      },
    });
  },
});

export const ProjectQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("projectList", {
      type: "ProjectList",
      args: {
        filter: stringArg(),
        skip: intArg(),
        take: intArg(),
        orderBy: arg({ type: list(nonNull(ProjectOrderByInput)) }),
      },
      async resolve(parent, args, context) {
        const where = args.filter
          ? {
              OR: [
                { description: { contains: args.filter } },
                { title: { contains: args.filter } },
              ],
            }
          : {};

        const projects = await context.prisma.project.findMany({
          where,
          skip: args?.skip as number | undefined,
          take: args?.take as number | undefined,
          orderBy: args?.orderBy as
            | Prisma.Enumerable<Prisma.ProjectOrderByWithRelationInput>
            | undefined,
        });

        const count = await context.prisma.project.count({ where });
        const id = `main-feed:${JSON.stringify(args)}`;

        return {
          projects,
          count,
          id,
        };
      },
    });
  },
});

export const ProjectMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("post", {
      type: "Project",
      args: {
        description: nonNull(stringArg()),
        title: nonNull(stringArg()),
      },

      resolve(parent, args, context) {
        const { description, title } = args;
        const { userId } = context;
        if (!userId) {
          throw new Error("Cannot post without logging in.");
        }
        const newProject = context.prisma.project.create({
          data: {
            description,
            title,
            postedBy: { connect: { id: userId } },
          },
        });
        return newProject;
      },
    });
  },
});
