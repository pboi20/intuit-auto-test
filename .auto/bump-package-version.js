const core = require("@auto-it/core")
const inc = require('semver').inc
const fs = require("fs")
const promisify = require("util").promisify

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const PACKAGE_JSON_PATH = "./package.json"
const SERVICE_PROVIDER_PATH = "./src/TwillServiceProvider.php"

module.exports = class BumpPackageVersion {
  constructor() {
    this.name = "bump-package-version"
  }

  apply(auto) {
    auto.hooks.version.tapPromise("BumpPackageVersion", async ({ bump, dryRun, quiet }) => {
      if (dryRun) return

      let packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, "utf-8"))
      const nextVersion = inc(packageJson.version, bump)

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
      serviceProvider.replace(/const VERSION = '[\d\.]+';/g, `const VERSION = '${nextVersion}';`)
      await writeFile(SERVICE_PROVIDER_PATH, serviceProvider, "utf-8")

      /**
       * Push changes
       */
      await core.execPromise("git", ["add", "--all", "."]);
      await core.execPromise("git", ["commit", "-m", "'Bump version [skip ci]'"]);
      await core.execPromise("git", ["push", "--all"]);
    })
  }
}
