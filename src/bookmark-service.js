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
  },

  addBookmark(knex, newBookmark){
    return knex
      .insert(newBookmark)
      .into('bookmarks_list')
      .returning('*')
      .then(rows => rows[0]);
  },

  deleteBookmark(knex, id){
    return knex
      .from('bookmarks_list')
      .where({id})
      .delete();
  },

  updateBookmark(knex, id, updatedInfo){
    return knex
      .from('bookmarks_list')
      .where({ id })
      .update(updatedInfo);
  }
};

module.exports = BookmarkService;