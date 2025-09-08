const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const middleware = require('../utils/middleware')

blogsRouter.get('/', async (request, response, next) => {
  try {
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
  } catch (error) {
    next(error)
  }
})

blogsRouter.post('/', middleware.userExtractor, async (request, response, next) => {
  const body = request.body
  const user = request.user
  try {
    const blog = new Blog({
      ...body,
      user: user._id
    })
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    response.status(201).json(savedBlog)
  } catch (error) {
    next(error)
  }
})

blogsRouter.delete('/:id', middleware.userExtractor, async (request, response, next) => {
  const user = request.user

  if (!user) {
    return response.status(400).json({ error: 'userId missing or not valid' })
  }
  const blogToDelete = await Blog.findById(request.params.id)
  if (user._id.toString() !== blogToDelete.user.toString()) {
    return response.status(403).json({ error: 'you can only delete your own blogs' })
  }
  try {
    await Blog.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

blogsRouter.put('/:id', middleware.userExtractor, async (request, response, next) => {
  const user = request.user

  if (!user) {
    return response.status(400).json({ error: 'userId missing or not valid' })
  }

  const { id } = request.params
  const updatedBlog = request.body
  try {
    const result = await Blog.findByIdAndUpdate(id, updatedBlog, { new: true })
    if (!result) {
      return response.status(404).send({ error: 'blog not found' })
    }
    response.json(result)
  } catch (error) {
    next(error)
  }
})

module.exports = blogsRouter