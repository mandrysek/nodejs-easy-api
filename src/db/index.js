'use strict'

const uuid = require('uuid/v4')

const fs = require('fs').promises

async function read(table) {
  const buffer = await fs.readFile(`./data/${table}.json`)
  return JSON.parse(buffer.toString('utf8'))
}

async function write(table, data) {
  await fs.writeFile(`./data/${table}.json`, JSON.stringify(data))
}

module.exports = {
  async getAll(table) {
    const data = await read(table)
    return Object.values(data)
  },

  async get(table, id) {
    const data = await read(table)
    return data[id] || null
  },

  async insert(table, obj = {}) {
    const data = await read(table)
    const id = uuid()

    data[id] = { ...obj, id }

    await write(table, data)

    return data[id]
  },

  async update(table, id, obj) {
    const data = await read(table)
    if (!data[id]) {
      throw new Error('User not found')
    }

    data[id] = {
      ...data[id],
      ...obj,
    }

    await write(table, data)

    return data[id]
  },

  async remove(table, id) {
    const data = await read(table)
    delete data[id]

    await write(table, data)
  },
}
