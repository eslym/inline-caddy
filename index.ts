import { parseArgs } from 'util';

const opts = parseArgs({
    args: Bun.argv.slice(2),
    allowPositionals: true,
    options: {
        'source-repo': {
            type: 'string',
            short: 'r',
            default: 'caddyserver/caddy'
        },
        'source-image': {
            type: 'string',
            short: 'i',
            default: 'library/caddy'
        }
    }
});

if (!opts.positionals[0]) {
    throw new Error('no image name specified');
}

const image = opts.positionals[0];

async function checkTag(repo: string, tag: string) {
    const res = await fetch(`https://hub.docker.com/v2/repositories/${repo}/tags/${tag}/`);
    return res.ok;
}

const SEMVER = /^v?(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*)(?:-(?<pre>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<meta>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const res = await fetch(`https://api.github.com/repos/${opts.values['source-repo']}/tags`);

if (!res.ok) {
    throw new Error('failed to fetch tags');
}

const tags = (await res.json() as { name: string }[])
    .map((t) => t.name)
    .filter(t => SEMVER.test(t))
    .sort((a, b) => Bun.semver.order(b, a));

let buildVer: { major: string, minor: string, patch: string } | undefined;

function buildTag({ major, minor, patch }: { major: string, minor: string, patch: string }) {
    return `${major}.${minor}.${patch}-alpine`;
}

for (const tag of tags) {
    const { major, minor, patch, pre, meta } = SEMVER.exec(tag)!.groups as any;
    if (pre || meta) continue;
    const fullTag = buildTag({ major, minor, patch });
    if (!await checkTag(opts.values['source-image']!, fullTag)) {
        console.log(`${opts.values['source-image']!}:${fullTag} not yet available, skipping...`);
        continue;
    }
    buildVer = { major, minor, patch };
    break;
}

if (!buildVer) {
    throw new Error('cannot find a version to build!');
}

const tag = buildTag(buildVer);

if (await checkTag(image, tag)) {
    console.log(`${image}:${tag} already exists!`);
    await Bun.write(process.env.GITHUB_OUTPUT!, 'found-tag=false');
    process.exit();
}

const buildTags = [
    'latest',
    'latest-alpine',
    tag,
    `${buildVer.major}.${buildVer.minor}-alpine`,
    `${buildVer.major}-alpine`,
];

const caddyVersion = `${buildVer.major}.${buildVer.minor}.${buildVer.patch}`;

const outputs = `found-tag=true
tags=${buildTags.map(t => `${image}:${t}`).join(',')}
caddy-version=${caddyVersion}`;

console.log(outputs);

Bun.write(process.env.GITHUB_OUTPUT!, outputs);
