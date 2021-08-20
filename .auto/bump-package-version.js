const core = require("@auto-it/core")

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
      await writeFile(JSON.stringify(packageJson, null, "  "), PACKAGE_JSON_PATH, "utf-8")

      /**
       * Update TwillServiceProvider version
       */
      let serviceProvider = await readFile(SERVICE_PROVIDER_PATH, "utf-8")
      serviceProvider.replace(/    const VERSION = '.*';/, `    const VERSION='${nextVersion}';`)
      await writeFile(serviceProvider, SERVICE_PROVIDER_PATH, "utf-8")

      /**
       * Push changes
       */
      await core.execPromise("git", ["commit", "-am", "Bump version [skip ci]"]);
      await core.execPromise("git", ["push", "--all"]);
    })
  }
}
