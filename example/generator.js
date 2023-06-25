import { faker } from '@faker-js/faker'

let row = 1
const records = []
const dates = {}
records.push(['id', 'point', 'name'])
while (row < 100) {
  const date = faker.date.recent().toISOString().split('T')[0].replaceAll('-', '')

  if (dates[date]) {
    dates[date]++
  } else {
    dates[date] = 1
  }

  let id = '0' + dates[date]
  id = id.slice(id.length - 2)
  const record = [
    date + id,
    Math.ceil(Math.random() * 80 + 20),
    faker.person.fullName()
  ]

  records.push(record)
  row++
}

records.forEach((record) => {
  console.log(record.join('\t'))
})
