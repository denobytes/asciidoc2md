import { parse } from "https://deno.land/std@0.181.0/flags/mod.ts";
import { default as downdoc } from "npm:downdoc@1.0.2-stable";

const args = parse(Deno.args, {
  boolean: [
    // instructions for this script
    "help",
  ],
  string: [
    // adoc filename to process
    "file",
    "f",

    // remote url to process
    "url",
    "r",

    // output filename
    "output",
    "o",
  ],
});

const commandName = `asciidoc2md`;

const usageMessage = `
Usage: ${commandName} [OPTIONS]
Options:
  --help              Show this help message

  -f, --file  NAME    NAME of input asciidoc file
  -o, --output NAME   Write output to NAME
  -u, --url URL       URL location to render

  Examples:
  ${commandName} -u https://raw.githubusercontent.com/asciidoctor/asciidoctor/main/README.adoc
  ${commandName} -f sample.adoc -o sample.md
  cat sample.adoc | ${commandName}
`;

// parse args
const help = args.help;
const adocFilename = args.file || args.f;
const adocUrl = args.url || args.u;
const outputFilename = args.output || args.o;
const readStdin = !adocFilename && !adocUrl && args._.length == 0;

if (help) {
  console.log(usageMessage);
  Deno.exit();
}

let adocStr = "";

if (readStdin) {
  const decoder = new TextDecoder();
  for await (const chunk of Deno.stdin.readable) {
    const textChunk = decoder.decode(chunk);
    adocStr += textChunk;
  }
}

// only one source
if (adocFilename && adocUrl) {
  console.log(usageMessage);
  Deno.exit();
}

// process
if (adocFilename) {
  let text = Deno.readTextFileSync(adocFilename);
  adocStr = text;
}
if (adocUrl) {
  const textResponse = await fetch(adocUrl);
  const textData = await textResponse.text();
  adocStr = textData;
}

let result = downdoc(adocStr);

if (outputFilename) {
  try {
    Deno.writeTextFileSync(outputFilename, result);
  } catch (e) {
    console.log(e.message);
  }
} else {
  console.log(result);
}
