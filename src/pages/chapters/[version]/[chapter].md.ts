import type { APIRoute, GetStaticPaths } from "astro";
import { getTextbooks } from "@/lib/textbooks";
import { renderChapterToMarkdown } from "@/textbook-loader/renderers/markdown-renderer";

export const getStaticPaths: GetStaticPaths = async () => {
    const textbooks = await getTextbooks();
    const paths = [];

    for (const textbook of textbooks) {
        for (const chapter of textbook.data.chapters) {
            paths.push({
                params: {
                    version: textbook.data.version,
                    chapter: chapter.slug,
                },
                props: {
                    version: textbook.data.version,
                    chapter,
                },
            });
        }
    }

    return paths;
};

export const GET: APIRoute = ({ props }) => {
    const { version, chapter } = props as any;
    const chapterUrl = `https://aisafetytextbook.com/chapters/${version}/${chapter.slug}/${chapter.sections[0].slug}`;

    const markdown = renderChapterToMarkdown(chapter, chapterUrl);

    return new Response(markdown, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
        },
    });
};
