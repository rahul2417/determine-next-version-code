const core = require("@actions/core");
const github = require("@actions/github");
const env = process.env;

function setBuildVersion(code) {
  core.setOutput("NEXT_BUILD_VERSION_CODE", code);
}

async function listAllTags(octokit, owner, repo) {
  var page = 1;
  var tags = [];
  while (true) {
    const response = await octokit.repos.listTags({
      owner,
      repo,
      per_page: 100,
      page: page,
    });
    const newTags = response["data"].map((obj) => obj["name"]);

    if (!newTags.length) {
      break;
    }
    tags.push(...newTags);
    page++;
  }
  return tags;
}

async function run() {
  const token = core.getInput("GH_TOKEN");
  var tagPrefix = core.getInput("TAG_PREFIX");
  if (!tagPrefix) {
    tagPrefix = "v";
  }
  const octokit = new github.GitHub(token);
  const owner = env.GITHUB_REPOSITORY.split("/")[0];
  const repo = env.GITHUB_REPOSITORY.split("/")[1];

  const versionTagRegex = new RegExp(`^${tagPrefix}(\\d+)\\.(\\d+)\\.(\\d+)\\(\\d+\\)$`);

  const allTags = await listAllTags(octokit, owner, repo);
  const tags = allTags.filter((el) => el.match(versionTagRegex));

  if (tags.length < 1) {
    setBuildVersion("0.0.1(1)");
    return;
  }

  tags.sort((l, r) => {
    const lx = parseInt(l.split(".")[0]);
    const rx = parseInt(r.split(".")[0]);
    if (lx < rx) {
      return 1;
    }
    if (rx < lx) {
      return -1;
    }
    const ly = parseInt(l.split(".")[1]);
    const ry = parseInt(r.split(".")[1]);
    if (ly < ry) {
      return 1;
    }
    if (ry < ly) {
      return -1;
    }
    const lz = parseInt(l.split(".")[2]);
    const rz = parseInt(r.split(".")[2]);
    if (lz < rz) {
      return 1;
    }
    if (rz < lz) {
      return -1;
    }
    return 0;
  });
  const split = tags[0].substring(tagPrefix.length).split(".");
  const regExp = /\(([^)]+)\)/;
  var code = regExp.exec(tags[0]);
  if(code==null){
    code=1
  }

  const nextX = parseInt(split[0]);
  const nextY = parseInt(split[1]);
  const nextZ = parseInt(split[2]);

  setBuildVersion(`${nextX}.${nextY}.${nextZ}(${code})`);
}

run();
