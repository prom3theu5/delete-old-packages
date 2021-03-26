const { getOctokit } = require("@actions/github")

const DEFAULT_VERSION_PATTERN = /^.+$/
const DEFAULT_KEEP = 2

const deleteMutation = `
  mutation deletePackageVersion($packageVersionId: String!) {
    deletePackageVersion(input: {packageVersionId: $packageVersionId}) {
      success
    }
  }
`

module.exports = class Strategy {
  constructor(names, version, versionPattern, keep, token) {
    // Either (version) or (versionPattern and keep) may be provided by the user.
    // Use default (versionPattern and keep) if not specified.
    if (version) {
      // Ensure versionPattern and keep are empty.
      if (versionPattern || keep) {
        throw new Error("When version is provided, keep and version-pattern must not be specified")
      }

      this.versionPattern = null
      this.version = version
      this.keep = null
    } else {
      // Ensure versionPattern and keep.
      if (!versionPattern || versionPattern === "") versionPattern = DEFAULT_VERSION_PATTERN
      if (!keep) keep = DEFAULT_KEEP

      if (!Number.isInteger(Number(keep)) || Number(keep) < 0 || Number(keep) > 100) {
        throw new Error("keep must be an integer between 0 and 100 (inclusive)")
      }

      try {
        this.versionPattern = new RegExp(versionPattern)
      } catch (error) {
        throw new Error("version-pattern must be a valid regex: " + error.message)
      }

      this.keep = Number(keep)
      this.version = null
    }

    if (!names || names.length === 0) {
      throw new Error("names cannot be empty")
    } else if (names.length > 20) {
      throw new Error("names cannot contain more than 20 items")
    } else if (!token || token === "") {
      throw new Error("token cannot be empty")
    }

    this.names = names
    this.token = token
  }

  async deletePackage(id) {
    await getOctokit(this.token).graphql(deleteMutation, {
      packageVersionId: id,
      headers: {
        Accept: "application/vnd.github.package-deletes-preview+json",
      },
    })
  }
}