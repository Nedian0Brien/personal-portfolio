import path from "node:path";
import { fileURLToPath } from "node:url";

const ADMIN_DIR = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(ADMIN_DIR, "../..");
export const WEB_ROOT = path.join(REPO_ROOT, "web");
export const INDEX_HTML_PATH = path.join(WEB_ROOT, "index.html");
export const RESEARCH_DETAIL_PATH = path.join(WEB_ROOT, "research/biomedical-bert-adr.html");
export const EDIT_BACKUP_DIR = path.join(REPO_ROOT, ".runtime/edit-backups");
