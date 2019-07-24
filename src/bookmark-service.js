const BookmarkService = {
  getBookmarks(knex){
    return knex.select('*').from('bookmarks_list');
  },

  getById(knex, id){
    return knex
      .from('bookmarks_list')
      .select('*')
      .where('id', id)
      .first();
  }
};

module.exports = BookmarkService;