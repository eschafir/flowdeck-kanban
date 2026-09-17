import { expect, test } from "@playwright/test";

test.describe("Flowdeck board", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
  });

  test("loads with five columns and seed cards", async ({ page }) => {
    await expect(page.getByText("Flowdeck").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Product Launch" })
    ).toBeVisible();
    await expect(page.getByTestId("board")).toBeVisible();

    const columns = page.locator('[data-testid^="column-col-"]');
    await expect(columns).toHaveCount(5);

    await expect(page.getByText("Define product vision")).toBeVisible();
    await expect(page.getByText("Build drag and drop")).toBeVisible();
    await expect(page.getByText("Seed demo board")).toBeVisible();
  });

  test("shows all five columns in the viewport without horizontal scroll", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    const board = page.getByTestId("board");
    await expect(board).toBeVisible();

    const columns = page.locator('[data-testid^="column-col-"]');
    await expect(columns).toHaveCount(5);

    const allInViewport = await columns.evaluateAll((els) =>
      els.every((el) => {
        const rect = el.getBoundingClientRect();
        return (
          rect.left >= 0 &&
          rect.right <= window.innerWidth &&
          rect.width > 0
        );
      })
    );
    expect(allInViewport).toBe(true);

    const hasHorizontalOverflow = await board.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test("renames a column", async ({ page }) => {
    await page.getByTestId("rename-col-backlog").click();
    const input = page.getByTestId("rename-input-col-backlog");
    await input.fill("Ideas");
    await input.press("Enter");

    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();
  });

  test("adds a card to a column", async ({ page }) => {
    await page.getByTestId("add-card-col-done").click();
    await page.getByTestId("add-title-col-done").fill("Ship MVP");
    await page.getByTestId("add-details-col-done").fill("Ready for review");
    await page.getByTestId("add-submit-col-done").click();

    await expect(page.getByText("Ship MVP")).toBeVisible();
    await expect(page.getByText("Ready for review")).toBeVisible();
  });

  test("deletes a card", async ({ page }) => {
    await expect(page.getByText("Define product vision")).toBeVisible();
    await page.getByTestId("delete-card-1").click();
    await expect(page.getByText("Define product vision")).toHaveCount(0);
  });

  test("drags a card to another column", async ({ page }) => {
    const card = page.getByTestId("card-7");
    const target = page.getByTestId("column-drop-col-review");

    await card.scrollIntoViewIfNeeded();
    await target.scrollIntoViewIfNeeded();

    await expect(
      page.getByTestId("column-col-done").getByText("Seed demo board")
    ).toBeVisible();

    const moved = await page.evaluate(async () => {
      const source = document.querySelector('[data-testid="card-7"]');
      const drop = document.querySelector(
        '[data-testid="column-drop-col-review"]'
      );
      if (!source || !drop) return false;

      const from = source.getBoundingClientRect();
      const to = drop.getBoundingClientRect();
      const sx = from.x + from.width / 2;
      const sy = from.y + from.height / 2;
      const tx = to.x + to.width / 2;
      const ty = to.y + 30;

      const fire = (
        el: Element | Document,
        type: string,
        x: number,
        y: number,
        buttons: number
      ) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            clientX: x,
            clientY: y,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            buttons,
            button: buttons ? 0 : -1,
          })
        );
      };

      fire(source, "pointerdown", sx, sy, 1);
      await new Promise((r) => setTimeout(r, 30));
      for (let i = 1; i <= 25; i++) {
        const x = sx + ((tx - sx) * i) / 25;
        const y = sy + ((ty - sy) * i) / 25;
        fire(document, "pointermove", x, y, 1);
        await new Promise((r) => setTimeout(r, 8));
      }
      fire(document, "pointerup", tx, ty, 0);
      await new Promise((r) => setTimeout(r, 100));

      return !!document
        .querySelector('[data-testid="column-col-review"]')
        ?.textContent?.includes("Seed demo board");
    });

    expect(moved).toBe(true);
    await expect(
      page.getByTestId("column-col-review").getByText("Seed demo board")
    ).toBeVisible();
  });

  test("persists renames and cards across reload", async ({ page }) => {
    await page.getByTestId("rename-col-backlog").click();
    const input = page.getByTestId("rename-input-col-backlog");
    await input.fill("Ideas");
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();

    await page.getByTestId("add-card-col-done").click();
    await page.getByTestId("add-title-col-done").fill("Persisted card");
    await page.getByTestId("add-details-col-done").fill("Still here after reload");
    await page.getByTestId("add-submit-col-done").click();
    await expect(page.getByText("Persisted card")).toBeVisible();

    await page.reload();

    await expect(page.getByRole("heading", { name: "Ideas" })).toBeVisible();
    await expect(page.getByText("Persisted card")).toBeVisible();
    await expect(page.getByText("Still here after reload")).toBeVisible();
  });

  test("edits a card in the side panel and persists", async ({ page }) => {
    await page.getByTestId("open-card-1").click();

    await expect(page.getByTestId("card-editor-panel")).toBeVisible();
    await expect(page.getByTestId("card-editor-toolbar")).toBeVisible();

    const title = page.getByTestId("card-editor-title");
    await title.fill("Revised vision");

    const details = page.getByTestId("card-editor-details");
    await details.click();
    await details.evaluate((el, text) => {
      el.focus();
      document.execCommand("selectAll", false);
      document.execCommand("insertText", false, text);
    }, "Updated description for the vision card");

    await page.getByTestId("card-editor-save").click();

    await expect(page.getByTestId("card-editor-panel")).toHaveCount(0);
    await expect(page.getByText("Revised vision")).toBeVisible();
    await expect(
      page.getByText("Updated description for the vision card")
    ).toBeVisible();

    await page.reload();

    await expect(page.getByText("Revised vision")).toBeVisible();
    await expect(
      page.getByText("Updated description for the vision card")
    ).toBeVisible();
  });

  test("creates a new board and switches between boards", async ({ page }) => {
    await page.getByTestId("board-menu").click();
    await page.getByTestId("new-board").click();
    await expect(page.getByTestId("create-board-modal")).toBeVisible();

    await page.getByTestId("create-board-name").fill("Marketing");
    await page
      .getByTestId("create-board-description")
      .fill("Campaign planning");
    await page.getByTestId("create-board-submit").click();

    await expect(
      page.getByRole("heading", { name: "Marketing" })
    ).toBeVisible();
    await expect(page.getByText("Campaign planning")).toBeVisible();
    await expect(page.getByText("Define product vision")).toHaveCount(0);

    const select = page.getByTestId("board-select");
    await expect(select).toHaveValue(/.+/);
    await select.selectOption({ label: "Product Launch" });

    await expect(
      page.getByRole("heading", { name: "Product Launch" })
    ).toBeVisible();
    await expect(page.getByText("Define product vision")).toBeVisible();

    await page.reload();
    await expect(select.locator("option")).toHaveCount(2);
  });

  test("edits board name and description and persists", async ({ page }) => {
    await page.getByTestId("board-menu").click();
    await page.getByTestId("edit-board").click();
    await expect(page.getByTestId("edit-board-modal")).toBeVisible();

    await page.getByTestId("edit-board-name").fill("Launch Tracker");
    await page
      .getByTestId("edit-board-description")
      .fill("Track go-to-market work");
    await page.getByTestId("edit-board-submit").click();

    await expect(
      page.getByRole("heading", { name: "Launch Tracker" })
    ).toBeVisible();
    await expect(page.getByText("Track go-to-market work")).toBeVisible();
    await expect(page.getByTestId("board-select")).toContainText(
      "Launch Tracker"
    );

    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Launch Tracker" })
    ).toBeVisible();
    await expect(page.getByText("Track go-to-market work")).toBeVisible();
  });

  test("exports and imports a board", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("board-menu").click();
    await page.getByTestId("export-board").click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(download.suggestedFilename()).toMatch(/\.flowdeck\.json$/);
    expect(downloadPath).toBeTruthy();

    await page.getByTestId("board-menu").click();
    await page.getByTestId("new-board").click();
    await page.getByTestId("create-board-name").fill("Empty Scratch");
    await page.getByTestId("create-board-submit").click();
    await expect(
      page.getByRole("heading", { name: "Empty Scratch" })
    ).toBeVisible();
    await expect(page.getByText("Define product vision")).toHaveCount(0);

    await page.getByTestId("import-board-input").setInputFiles(downloadPath!);

    await expect(
      page.getByRole("heading", { name: "Product Launch" })
    ).toBeVisible();
    await expect(page.getByText("Define product vision")).toBeVisible();
    await expect(page.getByTestId("board-select").locator("option")).toHaveCount(
      3
    );
  });

  test("deletes a board when more than one exists", async ({ page }) => {
    await page.getByTestId("board-menu").click();
    await expect(page.getByTestId("delete-board")).toBeDisabled();
    await page.keyboard.press("Escape");

    await page.getByTestId("board-menu").click();
    await page.getByTestId("new-board").click();
    await page.getByTestId("create-board-name").fill("Temporary");
    await page.getByTestId("create-board-submit").click();
    await expect(page.getByRole("heading", { name: "Temporary" })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("board-menu").click();
    await expect(page.getByTestId("delete-board")).toBeEnabled();
    await page.getByTestId("delete-board").click();

    await expect(
      page.getByRole("heading", { name: "Product Launch" })
    ).toBeVisible();
    await expect(page.getByTestId("board-select").locator("option")).toHaveCount(
      1
    );
  });

  test("toggles dark mode", async ({ page }) => {
    const html = page.locator("html");
    await expect(page.getByTestId("theme-toggle")).toBeVisible();

    await page.evaluate(() => {
      window.localStorage.setItem("flowdeck.theme", "light");
      document.documentElement.classList.remove("dark");
    });

    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("flowdeck.theme"))).toBe(
      "dark"
    );

    await page.getByTestId("theme-toggle").click();
    await expect(html).not.toHaveClass(/dark/);
    expect(await page.evaluate(() => localStorage.getItem("flowdeck.theme"))).toBe(
      "light"
    );
  });
});
