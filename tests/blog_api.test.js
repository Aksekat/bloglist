const assert = require('node:assert')
const { test, after, beforeEach } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
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
    author: 'Test Author',
    url: 'https://testlink.com/testBlog',
    likes: 0
  }

  await api
    .post('/api/blogs')
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
    author: 'Test Author',
    url: 'https://testlink.com/testBlog'
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  const response = await api.get('/api/blogs')
  const addedBlog = response.body.find(blog => blog.title === newBlog.title)

  assert.strictEqual(addedBlog.likes, 0)
})

test.only('a blog without title is not added', async () => {
  const newBlog = {
    author: 'Test Author',
    url: 'https://testlink.com/testBlog',
    likes: 0
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

test.only('a blog without url is not added', async () => {
  const newBlog = {
    title: 'New Blog Without URL',
    author: 'Test Author',
    likes: 0
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(400)
})

after(async () => {
  await mongoose.connection.close()
})