function makeBookmarkList (){
  return [
    {
      id: 1,
      title: 'bookmark 1',
      url: 'https://google.com',
      rating: 5,
      description: 'something'
    },
    {
      id: 2,
      title: 'bookmark 2',
      url: 'https://google.com',
      rating: 4,
      description: 'something else'
    },
    {
      id: 3,
      title: 'bookmark 3',
      url: 'https://google.com',
      rating: 3,
      description: 'something else again'
    },
    {
      id: 4,
      title: 'bookmark 4',
      url: 'https://google.com',
      rating: 2,
      description: 'something something something!'
    }
  ]
}

module.exports = { makeBookmarkList }