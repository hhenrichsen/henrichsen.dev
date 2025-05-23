import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const collections = await Promise.all([
    getCollection("blog"),
    getCollection("scraps"),
    getCollection("lectures"),
    getCollection("fiction"),
    getCollection("reading"),
    getCollection("guides"),
  ]);

  const items = collections
    .flatMap((collection) => collection)
    .filter((post) => !post.data.draft)
    .map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `/${post.data.type}/${post.id}/`,
    }))
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: "Hunter Henrichsen",
    description: "A collection of unorganized thoughts and ideas",
    site: context.site,
    items,
  });
}
