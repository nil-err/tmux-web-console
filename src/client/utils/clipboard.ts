interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

interface CopyTextDependencies {
  clipboard?: ClipboardLike;
  document?: Document;
}

export async function copyText(
  text: string,
  dependencies: CopyTextDependencies = {
    clipboard: globalThis.navigator?.clipboard,
    document: globalThis.document
  }
): Promise<boolean> {
  if (dependencies.clipboard) {
    try {
      await dependencies.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy copy path for non-secure HTTP contexts.
    }
  }

  const documentRef = dependencies.document;
  if (!documentRef?.body || typeof documentRef.execCommand !== "function") {
    return false;
  }

  const textarea = documentRef.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  documentRef.body.appendChild(textarea);
  textarea.select();

  try {
    return documentRef.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
}
