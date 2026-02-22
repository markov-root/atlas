import type { APIRoute, GetStaticPaths } from "astro";
import { getTextbooks } from "@/lib/textbooks";
import { renderNodesToMarkdown } from "@/textbook-loader/renderers/markdown-renderer";

export const getStaticPaths: GetStaticPaths = async () => {
    const textbooks = await getTextbooks();
    const paths = [];

    for (const textbook of textbooks) {
        for (const chapter of textbook.data.chapters) {
            for (const section of chapter.sections) {
                paths.push({
                    params: {
                        version: textbook.data.version,
                        chapter: chapter.slug,
                        section: section.slug,
                    },
                    props: {
                        version: textbook.data.version,
                        chapter,
                        section,
                    },
                });
            }
        }
    }

    return paths;
};

export const GET: APIRoute = ({ props }) => {
    const { version, chapter, section } = props as any;
    const sectionUrl = `https://aisafetytextbook.com/chapters/${version}/${chapter.slug}/${section.slug}`;

    const markdown = renderNodesToMarkdown(section.nodes, section.footnotes, {
        title: section.title,
        description: section.description,
        url: sectionUrl,
    });

    return new Response(markdown, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
        },
    });
};
