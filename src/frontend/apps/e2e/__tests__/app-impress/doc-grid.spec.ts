import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test.describe('Documents Grid', () => {
  test('checks all the elements are visible', async ({ page }) => {
    await expect(page.locator('h2').getByText('Documents')).toBeVisible();

    const datagrid = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table');

    const thead = datagrid.locator('thead');
    await expect(thead.getByText(/Document name/i)).toBeVisible();
    await expect(thead.getByText(/Created at/i)).toBeVisible();
    await expect(thead.getByText(/Updated at/i)).toBeVisible();
    await expect(thead.getByText(/Your role/i)).toBeVisible();
    await expect(thead.getByText(/Users number/i)).toBeVisible();

    const row1 = datagrid.getByRole('row').nth(1).getByRole('cell');
    const docName = await row1.nth(1).textContent();
    expect(docName).toBeDefined();

    const docCreatedAt = await row1.nth(2).textContent();
    expect(docCreatedAt).toBeDefined();

    const docUpdatedAt = await row1.nth(3).textContent();
    expect(docUpdatedAt).toBeDefined();

    const docRole = await row1.nth(4).textContent();
    expect(
      docRole &&
        ['Administrator', 'Owner', 'Reader', 'Editor'].includes(docRole),
    ).toBeTruthy();

    const docUserNumber = await row1.nth(5).textContent();
    expect(docUserNumber).toBeDefined();

    // Open the document
    await row1.nth(1).click();

    await expect(page.locator('h2').getByText(docName!)).toBeVisible();
  });

  [
    {
      nameColumn: 'Document name',
      ordering: 'title',
      cellNumber: 1,
    },
    {
      nameColumn: 'Created at',
      ordering: 'created_at',
      cellNumber: 2,
    },
    {
      nameColumn: 'Updated at',
      ordering: 'updated_at',
      cellNumber: 3,
    },
  ].forEach(({ nameColumn, ordering, cellNumber }) => {
    test(`checks datagrid ordering ${ordering}`, async ({ page }) => {
      const responsePromise = page.waitForResponse(
        (response) =>
          response.url().includes(`/documents/?page=1`) &&
          response.status() === 200,
      );

      const responsePromiseOrderingDesc = page.waitForResponse(
        (response) =>
          response.url().includes(`/documents/?page=1&ordering=-${ordering}`) &&
          response.status() === 200,
      );

      const responsePromiseOrderingAsc = page.waitForResponse(
        (response) =>
          response.url().includes(`/documents/?page=1&ordering=${ordering}`) &&
          response.status() === 200,
      );

      const datagrid = page
        .getByLabel('Datagrid of the documents page 1')
        .getByRole('table');
      const thead = datagrid.locator('thead');

      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();

      const docNameRow1 = datagrid
        .getByRole('row')
        .nth(1)
        .getByRole('cell')
        .nth(cellNumber);
      const docNameRow2 = datagrid
        .getByRole('row')
        .nth(2)
        .getByRole('cell')
        .nth(cellNumber);

      await expect(datagrid.getByLabel('Loading data')).toBeHidden();

      // Initial state
      await expect(docNameRow1).toHaveText(/.*/);
      await expect(docNameRow2).toHaveText(/.*/);
      const initialDocNameRow1 = await docNameRow1.textContent();
      const initialDocNameRow2 = await docNameRow2.textContent();

      expect(initialDocNameRow1).toBeDefined();
      expect(initialDocNameRow2).toBeDefined();

      // Ordering ASC
      await thead.getByText(nameColumn).click();

      const responseOrderingAsc = await responsePromiseOrderingAsc;
      expect(responseOrderingAsc.ok()).toBeTruthy();

      await expect(datagrid.getByLabel('Loading data')).toBeHidden();

      await expect(docNameRow1).toHaveText(/.*/);
      await expect(docNameRow2).toHaveText(/.*/);
      const textDocNameRow1Asc = await docNameRow1.textContent();
      const textDocNameRow2Asc = await docNameRow2.textContent();
      expect(
        textDocNameRow1Asc &&
          textDocNameRow2Asc &&
          textDocNameRow1Asc.toLocaleLowerCase() <=
            textDocNameRow2Asc.toLocaleLowerCase(),
      ).toBeTruthy();

      // Ordering Desc
      await thead.getByText(nameColumn).click();

      const responseOrderingDesc = await responsePromiseOrderingDesc;
      expect(responseOrderingDesc.ok()).toBeTruthy();

      await expect(datagrid.getByLabel('Loading data')).toBeHidden();

      await expect(docNameRow1).toHaveText(/.*/);
      await expect(docNameRow2).toHaveText(/.*/);
      const textDocNameRow1Desc = await docNameRow1.textContent();
      const textDocNameRow2Desc = await docNameRow2.textContent();

      expect(
        textDocNameRow1Desc &&
          textDocNameRow2Desc &&
          textDocNameRow1Desc.toLocaleLowerCase() >=
            textDocNameRow2Desc.toLocaleLowerCase(),
      ).toBeTruthy();
    });
  });

  test('checks the pagination', async ({ page }) => {
    const responsePromisePage1 = page.waitForResponse(
      (response) =>
        response.url().includes(`/documents/?page=1`) &&
        response.status() === 200,
    );

    const responsePromisePage2 = page.waitForResponse(
      (response) =>
        response.url().includes(`/documents/?page=2`) &&
        response.status() === 200,
    );

    const datagridPage1 = page
      .getByLabel('Datagrid of the documents page 1')
      .getByRole('table');

    const responsePage1 = await responsePromisePage1;
    expect(responsePage1.ok()).toBeTruthy();

    const docNamePage1 = datagridPage1
      .getByRole('row')
      .nth(1)
      .getByRole('cell')
      .nth(1);

    await expect(docNamePage1).toHaveText(/.*/);
    const textDocNamePage1 = await docNamePage1.textContent();

    await page.getByLabel('Go to page 2').click();

    const datagridPage2 = page
      .getByLabel('Datagrid of the documents page 2')
      .getByRole('table');

    const responsePage2 = await responsePromisePage2;
    expect(responsePage2.ok()).toBeTruthy();

    const docNamePage2 = datagridPage2
      .getByRole('row')
      .nth(1)
      .getByRole('cell')
      .nth(1);

    await expect(datagridPage2.getByLabel('Loading data')).toBeHidden();

    await expect(docNamePage2).toHaveText(/.*/);
    const textDocNamePage2 = await docNamePage2.textContent();

    expect(textDocNamePage1 !== textDocNamePage2).toBeTruthy();
  });
});
