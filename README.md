# Bookmark Server
This bookmark server utilizes the /bookmark endpoint
It is associated with the database bookmarks and the table bookmarks_list

to seed the db:
psql -U dunder-mifflin -d bookmarks -f ./seed/seed.bookmarks_list.sql

## Scripts

Start the application `npm start`

Start nodemon for the application `npm run dev`

Run the tests `npm test`

## Deploying

When your new project is ready for deployment, add a new Heroku application with `heroku create`. This will make a new git remote called "heroku" and you can then `npm run deploy` which will push to this remote's master branch.
