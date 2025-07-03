/* eslint-disable no-unused-vars */
const lodash = require('lodash')

const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.length === 0
    ? 0
    : blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  return blogs.reduce((max, blog) => (blog.likes > max.likes ? blog : max), blogs[0])
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  const authorBlogs = lodash.countBy(blogs, 'author')
  const maxAuthor = Object.keys(authorBlogs).reduce(
    (a, b) => authorBlogs[a] > authorBlogs[b] ? a : b, Object.keys(authorBlogs)[0])
  return { author: maxAuthor, blogs: authorBlogs[maxAuthor] }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null
  }
  const blogsByAuthor = lodash.groupBy(blogs, 'author')
  console.log(Object.entries(blogsByAuthor))
  const likesPerAuthor = Object.entries(blogsByAuthor).map(([author, blogs]) => ({
    author,
    likes: blogs.reduce((sum, blog) => sum + blog.likes, 0)
  }))
  const maxLikesAuthor = likesPerAuthor.reduce((max, current) =>
    (current.likes > max.likes ? current : max), likesPerAuthor[0])
  return maxLikesAuthor
}


module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}