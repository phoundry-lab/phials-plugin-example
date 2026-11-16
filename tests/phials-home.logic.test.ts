import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolvePhialsHome } from "../scripts/phials-home.logic";

test("defaults match Phials' desktop application-data directories", () => {
  assert.equal(
    resolvePhialsHome([], "darwin", {}, "/Users/example"),
    "/Users/example/Library/Application Support/com.phials",
  );
  assert.equal(
    resolvePhialsHome([], "linux", {}, "/home/example"),
    "/home/example/.local/share/com.phials",
  );
  assert.equal(
    resolvePhialsHome(
      [],
      "win32",
      { LOCALAPPDATA: "C:\\Users\\example\\AppData\\Local" },
      "C:\\Users\\example",
    ),
    "C:\\Users\\example\\AppData\\Local\\com.phials",
  );
  assert.equal(
    resolvePhialsHome([], "win32", {}, "C:\\Users\\example"),
    "C:\\Users\\example\\AppData\\Local\\com.phials",
  );
});

test("Linux honors absolute XDG_DATA_HOME and ignores relative values", () => {
  assert.equal(
    resolvePhialsHome([], "linux", { XDG_DATA_HOME: "/data" }, "/home/example"),
    "/data/com.phials",
  );
  assert.equal(
    resolvePhialsHome([], "linux", { XDG_DATA_HOME: "relative" }, "/home/example"),
    "/home/example/.local/share/com.phials",
  );
});

test("explicit home overrides PHIALS_HOME, which overrides platform defaults", () => {
  for (const platform of ["darwin", "linux", "win32"] as const) {
    const paths = platform === "win32" ? path.win32 : path.posix;
    const explicit = platform === "win32" ? "C:\\explicit" : "/explicit";
    const environment = platform === "win32" ? "C:\\environment" : "/environment";
    assert.equal(
      resolvePhialsHome(["--phials-home", explicit], platform, { PHIALS_HOME: environment }),
      paths.resolve(explicit),
    );
    assert.equal(
      resolvePhialsHome([], platform, { PHIALS_HOME: environment }),
      paths.resolve(environment),
    );
  }
});

test("an explicit home flag requires a value instead of falling back to the real installation", () => {
  assert.throws(() => resolvePhialsHome(["--phials-home"]), /Usage/);
  assert.throws(() => resolvePhialsHome(["--phials-home", "--other"]), /Usage/);
});
