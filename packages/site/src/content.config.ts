import { glob } from "astro/loaders";
// Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
// Define a `loader` and `schema` for each collection
const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.mdx", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    tags: z.optional(z.array(z.string())),
    description: z.optional(z.string()),
    image: z.optional(z.string()),
    type: z.enum(["blog"]),
    static: z.optional(z.string()),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: "**/[^_]*.mdx", base: "./src/content/guides" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    tags: z.optional(z.array(z.string())),
    description: z.optional(z.string()),
    type: z.enum(["guide", "cookbook"]),
    growth: z.enum(["sprout", "bud", "bloom"]),
    image: z.optional(z.string()),
    draft: z.boolean().optional().default(false),
    static: z.optional(z.string()),
  }),
});

const fiction = defineCollection({
  loader: glob({ pattern: "**/[^_]*.mdx", base: "./src/content/fiction" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    image: z.optional(z.string()),
    type: z.enum(["fiction"]),
    draft: z.boolean().optional().default(false),
    static: z.optional(z.string()),
  }),
});

const lectures = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/lecture" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    image: z.optional(z.string()),
    type: z.enum(["lecture"]),
    draft: z.boolean().optional().default(false),
    static: z.optional(z.string()),
  }),
});

const reading = defineCollection({
  loader: glob({ pattern: "**/[^_]*.mdx", base: "./src/content/reading" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    type: z.enum(["reading"]),
    image: z.optional(z.string()),
    static: z.optional(z.string()),
  }),
});

const scraps = defineCollection({
  loader: glob({ pattern: "**/[^_]*.mdx", base: "./src/content/scraps" }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    type: z.enum(["scrap"]),
    image: z.optional(z.string()),
    static: z.optional(z.string()),
  }),
});

// Export a single `collections` object to register your collection(s)
export const collections = { blog, guides, fiction, lectures, reading, scraps };
