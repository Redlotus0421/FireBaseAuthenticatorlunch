
import asyncio
from playwright.async_api import async_playwright
import time

def handle_console_message(msg):
    print(f"Browser Console: {msg.text}")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Listen for and print console messages for debugging
        page.on("console", handle_console_message)

        # Navigate to the local server
        await page.goto("http://localhost:8080/index.html")

        # Wait for the main auth container to become visible
        print("Waiting for #firebase-auth-gate-container to be visible...")
        await page.wait_for_selector("#firebase-auth-gate-container", state="visible", timeout=60000)
        print("Auth gate is visible.")

        # Now that the gate is visible, the signup form should be too
        await page.wait_for_selector("#signup-container", state="visible")

        # Sign up a new user to authenticate
        unique_email = f"manager-test-{int(time.time())}@example.com"
        await page.fill("#signup-email", unique_email)
        await page.fill("#signup-password", "password123")
        await page.click("#signup-form button[type='submit']")

        # Wait for the main app to appear
        await page.wait_for_selector("#app", state="visible")

        # Navigate to the benefits page
        await page.click("#nav-benefits")

        # Wait for content to load
        await page.wait_for_selector(".card")

        # Screenshot before claiming
        await page.screenshot(path="jules-scratch/verification/benefits_before_claim.png")

        # Claim a specific benefit
        claim_button = page.locator("div.card:has-text('Juan Dela Cruz')") \
                           .locator("div:has-text('Monthly Maintenance')") \
                           .get_by_role("button", name="Claim")
        await claim_button.click()

        # Screenshot after claiming
        await page.screenshot(path="jules-scratch/verification/benefits_after_claim.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
