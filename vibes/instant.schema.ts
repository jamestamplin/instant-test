import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    profiles: i.entity({
      username: i.string().unique().indexed(),
      bio: i.string().optional(),
      karma: i.number(),
      createdAt: i.number().indexed(),
    }),
    stories: i.entity({
      title: i.string(),
      url: i.string().optional(),
      text: i.string().optional(),
      points: i.number(),
      createdAt: i.number().indexed(),
      commentCount: i.number(),
    }),
    votes: i.entity({
      createdAt: i.number().indexed(),
    }),
    comments: i.entity({
      text: i.string(),
      createdAt: i.number().indexed(),
      points: i.number(),
    }),
  },
  links: {
    userProfiles: {
      forward: { on: "profiles", has: "one", label: "user" },
      reverse: { on: "$users", has: "one", label: "profile" },
    },
    storyAuthors: {
      forward: { on: "stories", has: "one", label: "author", required: true },
      reverse: { on: "profiles", has: "many", label: "stories" },
    },
    storyVotes: {
      forward: { on: "votes", has: "one", label: "story", required: true },
      reverse: { on: "stories", has: "many", label: "votes" },
    },
    voteUsers: {
      forward: { on: "votes", has: "one", label: "user", required: true },
      reverse: { on: "profiles", has: "many", label: "votes" },
    },
    storyComments: {
      forward: { on: "comments", has: "one", label: "story", required: true },
      reverse: { on: "stories", has: "many", label: "comments" },
    },
    commentAuthors: {
      forward: { on: "comments", has: "one", label: "author", required: true },
      reverse: { on: "profiles", has: "many", label: "comments" },
    },
    commentParents: {
      forward: { on: "comments", has: "one", label: "parent" },
      reverse: { on: "comments", has: "many", label: "replies" },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;