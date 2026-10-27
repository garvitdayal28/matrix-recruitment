# MATRIX Recruitment

Recruitment site for MATRIX, the skill enhancement community of Jabalpur Engineering College. One page with club info and the application form, plus a key-protected admin panel.

Built with Next.js and MongoDB Atlas (applications in a collection, portfolio files in GridFS).

## Run locally

```bash
npm install
cp .env.example .env   # then fill in the values (see comments in the file)
npm run dev            # http://localhost:3000
npm test               # validation and stats unit tests
```

## Pages

- `/`: club info and the application form
- `/admin`: applications, split into tables by year, domain or branch, with filters and CSV export
- `/admin/stats`: visitor stats: traffic sources, devices, time on site, how far people scroll, form drop-off, half-filled forms and developer-link clicks

`ADMIN_SECRET` and `ADMIN_MASTER_SECRET` both open applications and visitor stats. Only the master key sees developer LinkedIn clicks.

## Deploy

Deploy to Vercel and set `MONGODB_URI`, `ADMIN_SECRET`, `ADMIN_MASTER_SECRET` and `WHATSAPP_GROUP_URL` as environment variables. In Atlas, allow network access from `0.0.0.0/0`, because Vercel has no fixed IPs.

Developed by [Garvit Dayal](https://www.linkedin.com/in/garvit-dayal-74537a370/).
