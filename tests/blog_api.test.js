const assert = require('node:assert')
const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')
const Blog = require('../models/blog')
const User = require('../models/user')

const api = supertest(app)

let user

beforeEach(async () => {
  await User.deleteMany({})
  await Blog.deleteMany({})

  const passwordHash = await bcrypt.hash('secret', 10)
  const newUser = new User({ username: 'root', name: 'Test Author', passwordHash })

  const userInDb = await newUser.save()
  const blogsWithCreator = helper.initialBlogs.map(blog => ({ ...blog, author: 'Test Author', user: userInDb._id }))
  await Blog.insertMany(blogsWithCreator)

  user = await api.post('/api/login').send({
    username: 'root',
    password: 'secret'
  })
})

test('blogs are returned as json', async () => {
  const response = await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
  assert.strictEqual(response.body.length, helper.initialBlogs.length)
})

test('all returned blogs have a property named id', async () => {
  const response = await api.get('/api/blogs')
  response.body.forEach(blog => {
    assert(blog.id)
    assert(!blog._id)
  })
})

test('a valid blog can be added', async () => {
  const newBlog = {
    title: 'New Blog',
    url: 'https://testlink.com/testBlog',
    likes: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${user.body.token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  const response = await api.get('/api/blogs')
  const titles = response.body.map(r => r.title)

  assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)
  assert(titles.includes('New Blog'))
})

test('if likes property is missing, it will default to 0', async () => {
  const newBlog = {
    title: 'New Blog Without Likes',
    url: 'https://testlink.com/testBlog'
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${user.body.token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  const response = await api.get('/api/blogs')
  const addedBlog = response.body.find(blog => blog.title === newBlog.title)

  assert.strictEqual(addedBlog.likes, 0)
})

test('a blog without title is not added', async () => {
  const newBlog = {
    url: 'https://testlink.com/testBlog',
    likes: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${user.body.token}`)
    .send(newBlog)
    .expect(400)
})

test('a blog without url is not added', async () => {
  const newBlog = {
    title: 'New Blog Without URL',
    likes: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `Bearer ${user.body.token}`)
    .send(newBlog)
    .expect(400)
})

test('a blog can be deleted', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToDelete = blogsAtStart[0]

  await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .set('Authorization', `Bearer ${user.body.token}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()
  assert.strictEqual(blogsAtEnd.length, blogsAtStart.length - 1)
  assert(!blogsAtEnd.map(b => b.id).includes(blogToDelete.id))
})

test('the amount of likes on a blog can be updated', async () => {
  const blogsAtStart = await helper.blogsInDb()
  const blogToUpdate = blogsAtStart[0]

  const updatedBlog = {
    ...blogToUpdate,
    likes: blogToUpdate.likes + 1
  }

  await api
    .put(`/api/blogs/${blogToUpdate.id}`)
    .send(updatedBlog)
    .expect(200)

  const blogsAtEnd = await helper.blogsInDb()
  const updatedBlogInDb = blogsAtEnd.find(b => b.id === blogToUpdate.id)

  assert.strictEqual(updatedBlogInDb.likes, updatedBlog.likes)
})

test('a blog that does not exist cannot be updated', async () => {
  const nonExistentId = '605c72ef1c4ae12b4c8b4567'
  const updatedBlog = {
    title: 'Updated Title',
    url: 'https://updatedlink.com',
    likes: 5
  }

  await api
    .put(`/api/blogs/${nonExistentId}`)
    .send(updatedBlog)
    .expect(404)
})

after(async () => {
  await mongoose.connection.close()
})