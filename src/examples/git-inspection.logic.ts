/**
 * Optional SDK 3.1 example, not registered by the starter's entry point.
 * Add filesystem.read to your manifest before calling it with a Host-native path.
 * fileAtLatestCommit, when supplied, must exist in that commit and use a literal
 * repository-relative forward-slash path. Errors propagate to the caller.
 */
export async function inspectGitRepository(
  api: PluginAPI,
  path: string,
  fileAtLatestCommit?: string,
) {
  const repository = await api.git.getInfo(path);
  if (!repository) return null;

  const [status, workingTreeDiff, stagedDiff, commits, branches] =
    await Promise.all([
      api.git.status(repository.rootPath),
      api.git.diff(repository.rootPath),
      api.git.diff(repository.rootPath, { staged: true }),
      api.git.log(repository.rootPath, { limit: 20, skip: 0 }),
      api.git.listBranches(repository.rootPath),
    ]);

  // Use a resolved commit OID rather than HEAD, which could change between calls.
  // An unborn branch has no commits, so there is no committed content to read.
  const latestCommit = commits[0];
  const committedText =
    fileAtLatestCommit !== undefined && latestCommit
      ? await api.git.readBlob(
          repository.rootPath,
          latestCommit.oid,
          fileAtLatestCommit,
        )
      : null;

  return {
    repository,
    status,
    workingTreeDiff,
    stagedDiff,
    commits,
    branches,
    committedText,
  };
}
