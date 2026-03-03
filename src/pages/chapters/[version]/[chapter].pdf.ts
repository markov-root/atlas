import type { APIRoute, GetStaticPaths } from "astro";
import { readFileSync } from "fs";
import { join } from "path";
import { getTextbooks } from "@/lib/textbooks";

export const getStaticPaths: GetStaticPaths = async () => {
    const textbooks = await getTextbooks();
    const paths = [];

    for (const textbook of textbooks) {
        for (const chapter of textbook.data.chapters) {
            if (!chapter.pdfLink) continue;
            paths.push({
                params: {
                    version: textbook.data.version,
                    chapter: chapter.slug,
                },
                props: {
                    pdfLink: chapter.pdfLink,
                },
            });
        }
    }

    return paths;
};

export const GET: APIRoute = ({ props }) => {
    const { pdfLink } = props as any;
    const pdfBytes = readFileSync(join(process.cwd(), "public", pdfLink));
    return new Response(pdfBytes, {
        headers: {
            "Content-Type": "application/pdf",
        },
    });
};
