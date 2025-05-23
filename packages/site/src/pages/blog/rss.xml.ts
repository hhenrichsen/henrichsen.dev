import rss from "@astrojs/rss";
import type { AstroGlobal } from "astro";
import { getCollection } from "astro:content";

export async function GET(context: AstroGlobal) {
  const collections = await getCollection("blog");

  const items = collections
    .filter((post) => !post.data.draft)
    .map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/${post.data.type}/${post.id}/`,
    }))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: "Blog | Hunter Henrichsen",
    description: "A collection of unorganized thoughts and ideas",
    site: context.site ?? new URL("https://henrichsen.dev"),
    items,
  });
}
