const promisify = require("util").promisify
const exec = promisify(require("child_process").exec)
const readFile = promisify(require('fs').readFile)
const writeFile = promisify(require('fs').writeFile)

const PACKAGE_JSON_PATH = "./package.json"
const SERVICE_PROVIDER_PATH = "./src/TwillServiceProvider.php"

const nextVersion = process.argv[2]

if (!Boolean(nextVersion)) {
  console.log("No version bump")
  process.exit(0)
}

(async function main() {
  let packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, "utf-8"))

  if (!Boolean(nextVersion)) return
  if (`${packageJson.version}` === `${nextVersion}`) return
  
  /**
   * Update package.json version
   */
  packageJson.version = nextVersion
  await writeFile(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, "  "), "utf-8")

  /**
   * Update TwillServiceProvider version
   */
  let serviceProvider = await readFile(SERVICE_PROVIDER_PATH, "utf-8")
  serviceProvider = serviceProvider.replace(/const VERSION = '[\d\.]+';/g, `const VERSION = '${nextVersion}';`)
  await writeFile(SERVICE_PROVIDER_PATH, serviceProvider, "utf-8")

  /**
   * Push changes
   */
  await exec("git add --all .");
  await exec("git commit -m 'Bump version [skip ci]'");
  await exec("git push --all");
})()
