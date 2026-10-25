import { test, expect, type BrowserContext } from "@playwright/test";
import { emptyProject, parseProject, STORAGE_KEY, type Project } from "../app/te/lib/model";

function sharedStorage(project: Project | null = null) {
  let value = { revision: project ? 1 : 0, project };
  let offline = false;
  return {
    value: () => value,
    offline: (next: boolean) => { offline = next; },
    update: (project: Project) => { value = { revision: value.revision + 1, project }; },
    connect: async (context: BrowserContext) => {
      await context.route("**/api/te/project", async route => {
        if (offline) return route.fulfill({ status: 503, json: { error: "storage_unavailable" } });
        if (route.request().method() === "GET") return route.fulfill({ json: value });
        const body = route.request().postDataJSON();
        value = { revision: value.revision + 1, project: parseProject(JSON.stringify(body.project)) };
        return route.fulfill({ json: value });
      });
    },
  };
}

test("a local configuration becomes shared and edits reach a second device", async ({ browser }) => {
  const storage = sharedStorage();
  const first = await browser.newContext();
  const second = await browser.newContext();
  await Promise.all([storage.connect(first), storage.connect(second)]);
  await first.addInitScript(({ key, project }) => localStorage.setItem(key, JSON.stringify(project)), {
    key: STORAGE_KEY, project: { ...emptyProject(), name: "Configuration existante" },
  });
  const one = await first.newPage();
  const two = await second.newPage();
  await one.goto("/te");
  await expect.poll(() => storage.value().project?.name).toBe("Configuration existante");
  await two.goto("/te");
  await expect(two.getByLabel("Nom du projet")).toHaveValue("Configuration existante");
  await one.getByLabel("Nom du projet").fill("Dernière modification");
  await expect.poll(() => storage.value().project?.name).toBe("Dernière modification");
  await two.bringToFront();
  await two.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(two.getByLabel("Nom du projet")).toHaveValue("Dernière modification", { timeout: 12000 });
  await Promise.all([first.close(), second.close()]);
});

test("the shared version takes priority over a stale browser copy", async ({ context, page }) => {
  const storage = sharedStorage({ ...emptyProject(), name: "En ligne" });
  await storage.connect(context);
  await context.addInitScript(({ key, project }) => localStorage.setItem(key, JSON.stringify(project)), {
    key: STORAGE_KEY, project: { ...emptyProject(), name: "Ancienne copie" },
  });
  await page.goto("/te");
  await expect(page.getByLabel("Nom du projet")).toHaveValue("En ligne");
  await expect(page.locator(".te-save")).toContainText("sauvegarde partagée");
  expect(storage.value().revision).toBe(1);
});

test("each local edit overwrites a newer shared version", async ({ context, page }) => {
  const storage = sharedStorage(emptyProject());
  await storage.connect(context);
  await page.goto("/te");
  await expect(page.getByLabel("Nom du projet")).toBeVisible();
  storage.update({ ...emptyProject(), name: "Modification distante" });
  await page.getByLabel("Nom du projet").fill("Modification locale");
  await expect.poll(() => storage.value().project?.name).toBe("Modification locale");
  await expect(page.locator(".te-save")).toContainText("À jour");
});

test("unconfigured shared storage preserves the existing local workflow", async ({ page, context }) => {
  await context.route("**/api/te/project", route => route.fulfill({ status: 503, json: { error: "not_configured" } }));
  await page.goto("/te");
  await page.getByLabel("Nom du projet").fill("Copie locale");
  await page.reload();
  await expect(page.getByLabel("Nom du projet")).toHaveValue("Copie locale");
  await expect(page.locator(".te-save")).toContainText("stockage Vercel à configurer");
});

test("a saved local project is published when no shared project exists", async ({ context, page }) => {
  const original = parseProject(JSON.stringify(emptyProject()));
  const storage = sharedStorage(original);
  await storage.connect(context);
  await context.addInitScript(({ key, original }) => {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, JSON.stringify({ ...original, name: "Modification à reprendre" }));
    localStorage.setItem(`${key}.sync`, JSON.stringify({ revision: 1, baseline: JSON.stringify(original) }));
  }, { key: STORAGE_KEY, original });
  await page.goto("/te");
  await expect(page.getByLabel("Nom du projet")).toHaveValue("Modification à reprendre");
  await expect.poll(() => storage.value().project?.name).toBe("Modification à reprendre");
  await expect(page.getByRole("button", { name: "Exporter ma copie précédente" })).toHaveCount(0);
});
