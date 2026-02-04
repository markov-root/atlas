import "dotenv/config";
import { Transformer } from "@/textbook-loader/transformer";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { TEXTBOOK_EDITIONS } from "@/textbook-loader/data";
import { TextbookLoader } from "@/textbook-loader/loader";

const edition = TEXTBOOK_EDITIONS[0]; // v1 English
const creds = process.env.GOOGLE_CREDENTIALS_BASE64;
edition.chapters = [edition.chapters[0]]

let loader = new TextbookLoader(creds!, edition)
let textbook = await loader.load()

let chapter = textbook.chapters[0]

//console.log(chapter.sections)
