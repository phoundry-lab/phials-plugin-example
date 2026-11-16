export const EXAMPLE_THUMBNAIL_ID = "example.community-demo.thumbnail";
export const EXAMPLE_THUMBNAIL_VERSION = "demo-text-1";

/** A bounded File-content illustration; filename and interactive Preview stay outside the image. */
export async function renderExampleThumbnail(
  context: ThumbnailRenderContext,
): Promise<ThumbnailRenderResult> {
  context.signal.throwIfAborted();
  const text = await context.content.readTextPrefix(undefined, 16 * 1024);
  context.signal.throwIfAborted();
  const color = (token: string): string => {
    const captured = context.variants[`theme.${token}`];
    if (!captured) throw new Error("Captured Thumbnail theme unavailable");
    return captured;
  };
  const background = color("surface-raised");
  const foreground = color("txt-primary");
  const border = color("border-muted");
  const canvas = document.createElement("canvas");
  const release = () => {
    canvas.width = 0;
    canvas.height = 0;
  };
  context.signal.addEventListener("abort", release, { once: true });
  try {
    context.signal.throwIfAborted();
    const size = context.generation.size;
    canvas.width = size;
    canvas.height = Math.max(1, Math.floor(size * 0.75));
    const drawing = canvas.getContext("2d");
    if (!drawing) throw new Error("Thumbnail canvas unavailable");
    drawing.fillStyle = background;
    drawing.fillRect(0, 0, canvas.width, canvas.height);
    drawing.strokeStyle = border;
    drawing.strokeRect(
      0.5,
      0.5,
      Math.max(0, canvas.width - 1),
      Math.max(0, canvas.height - 1),
    );
    drawing.fillStyle = foreground;
    drawing.font = `${Math.max(1, size * 0.085)}px monospace`;
    drawing.textBaseline = "top";
    const margin = size * 0.08;
    const lineHeight = size * 0.105;
    const lines = text.split(/\r\n|\n|\r/).slice(0, 5);
    for (const [index, line] of lines.entries()) {
      context.signal.throwIfAborted();
      // These are source contents, not a filename, status label, or extension badge.
      drawing.fillText(
        line,
        margin,
        margin + index * lineHeight,
        Math.max(1, size - margin * 2),
      );
    }
    return await context.encode(canvas, "image/png");
  } finally {
    context.signal.removeEventListener("abort", release);
    release();
  }
}

export const exampleThumbnailProvider: ThumbnailProvider = {
  type: "thumbnail",
  id: EXAMPLE_THUMBNAIL_ID,
  name: "Example text Thumbnail",
  canHandle: (file) => file.name.endsWith(".phials-demo-preview.txt"),
  rendererVersion: EXAMPLE_THUMBNAIL_VERSION,
  presentationVariants: ["platform", "theme"],
  render: renderExampleThumbnail,
};
