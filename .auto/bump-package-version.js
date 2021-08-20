// const fs = require('fs')

module.exports = class BumpPackageVersion {
  constructor() {
    this.name = "bump-package-version"
  }

  apply(auto) {
    auto.hooks.version.tapPromise("BumpPackageVersion", async ({ bump, dryRun, quiet }) => {
      console.log('BUMP = ' + bump)

      // fs.writeFile('BUMP.txt', bump)

      // if (dryRun) {
      //   const { version } = await loadPackageJson()
      //   console.log(inc(version, bump))
      //   return
      // }
    })
  }
}