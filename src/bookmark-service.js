const BookmarkService = {
  getBookmarks(knex){
    return knex.select('*').from('bookmarks_list')
  },

};