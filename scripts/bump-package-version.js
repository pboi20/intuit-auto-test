const promisify = require("util").promisify
const inc = require("semver").inc
const exec = promisify(require("child_process").exec)
const readFile = promisify(require('fs').readFile)
const writeFile = promisify(require('fs').writeFile)

const PACKAGE_JSON_PATH = "./package.json"
const SERVICE_PROVIDER_PATH = "./src/TwillServiceProvider.php"

/**
 * This should be a qualifier like `major`, `minor`, `patch`, ... 
 * the output of the `npx auto version` command
 */
const versionBump = process.argv[2]

if (!Boolean(versionBump)) {
  console.log("No version bump")
  process.exit(0)
} else {
  console.log(`Version bump: ${versionBump}`)
}

(async function main() {
  let packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, "utf-8"))
  const nextVersion = inc(packageJson.version, versionBump)

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
  await exec("git config --global user.name 'Release Manager'")
  await exec("git config --global user.email 'bob@test.test'")
  await exec("git add --all .")
  await exec("git commit -m 'Bump version [skip ci]'")
  await exec("git push --all")
})()
