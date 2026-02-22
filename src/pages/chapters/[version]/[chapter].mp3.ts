import type { APIRoute, GetStaticPaths } from "astro";
import { getTextbooks } from "@/lib/textbooks";

export const getStaticPaths: GetStaticPaths = async () => {
    const textbooks = await getTextbooks();
    const paths = [];

    for (const textbook of textbooks) {
        for (const chapter of textbook.data.chapters) {
            if (!chapter.audioLink) continue;
            paths.push({
                params: {
                    version: textbook.data.version,
                    chapter: chapter.slug,
                },
                props: {
                    audioLink: chapter.audioLink,
                },
            });
        }
    }

    return paths;
};

export const GET: APIRoute = ({ props }) => {
    const { audioLink } = props as any;
    return new Response(null, {
        status: 302,
        headers: {
            Location: audioLink,
        },
    });
};
