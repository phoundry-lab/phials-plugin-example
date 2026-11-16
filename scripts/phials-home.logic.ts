import { homedir } from "node:os";
import path from "node:path";

/** Match Phials' desktop home resolution in src-tauri/src/paths.rs. */
export function resolvePhialsHome(
  args: readonly string[],
  platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  home = homedir(),
): string {
  const paths = platform === "win32" ? path.win32 : path.posix;
  const homeIndex = args.indexOf("--phials-home");
  if (homeIndex >= 0) {
    const value = args[homeIndex + 1];
    if (!value || value.startsWith("--")) {
      throw new Error("Usage: npm run dev:install -- [--phials-home <directory>]");
    }
    return paths.resolve(value);
  }
  if (env.PHIALS_HOME !== undefined) return paths.resolve(env.PHIALS_HOME);

  switch (platform) {
    case "darwin":
      return paths.join(home, "Library", "Application Support", "com.phials");
    case "win32":
      return paths.join(env.LOCALAPPDATA || paths.join(home, "AppData", "Local"), "com.phials");
    case "linux": {
      const dataHome = env.XDG_DATA_HOME;
      return paths.join(
        dataHome && paths.isAbsolute(dataHome) ? dataHome : paths.join(home, ".local", "share"),
        "com.phials",
      );
    }
    default:
      throw new Error(`Unknown Phials home for ${platform}; pass --phials-home <directory>`);
  }
}
