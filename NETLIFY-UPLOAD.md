# Upload Petzo UI preview to Netlify

Upload this folder only:

C:\Users\User\Downloads\Petzowebsite\out

1. Open https://app.netlify.com/drop and sign in.
2. Drag the complete `out` folder onto the upload area. Keep `index.html`, `_next`, `pets`, `favourites`, and the other generated files together.
3. After deployment finishes, copy the Netlify URL and share it with your client.

The generated `petzo-netlify-ui.zip` also contains the same upload-ready files at its root. If uploading a folder, use `out` directly.

## What the client can review

Current white-background UI, Petzo logo/photos, pet detail dialogs, discovery filters and preferences, accept/decline/undo, saved favourites, membership screens, and the pet-intake form with a downloadable draft. Adoption includes sample listings, free adoption requests and a browser-only owner review demo. Marketplace includes sample seller-verified listings, filters, price/details, seller enquiry and a browser-only seller review demo. Preview state is saved in that browser only.

This is a static UI preview. Adoption, Marketplace and other interactions are browser demos: they do not publish real listings, upload photos/documents to a server, verify sellers, or send enquiries. Live admin management, account sign-in, real submissions, payments, and chat are not enabled. `/admin` shows a preview explanation, not an admin login. Local admin changes do not update this public preview until you rebuild and upload again. Production buying/selling needs persistent database storage and verified seller accounts.

Only approved public catalog fields and required public photos are exported. Admin credentials, `.env.local`, SQLite database, private owner names/emails, and server routes are excluded.

## Rebuild after UI changes

Run `npm.cmd run build:preview`. It creates a fresh `out` folder and preserves the earlier folder as `out-previous-<timestamp>`. Re-upload the new `out` folder. This preview build does not replace the full local app or its database.

Static-export reference: https://nextjs.org/docs/app/guides/static-exports
Netlify manual deploy reference: https://docs.netlify.com/deploy/create-deploys/
