const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ الاتصال بقاعدة البيانات على Railway باستخدام متغيرات البيئة
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: parseInt(process.env.MYSQLPORT || '3306')
});

// ✅ اختبار الاتصال
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
  } else {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    connection.release();
  }
});

// 📚 جلب كل الكتب
app.get('/books', (req, res) => {
  const sql = 'SELECT * FROM books';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ➕ إضافة كتاب
app.post('/books', (req, res) => {
  const data = req.body;
  const sql = `
    INSERT INTO books (
      book_name, author, editor, size, paper_type,
      printing, binding, pages, edition_year, category,
      isbn, price, mostBayed, localPublish, bookImage
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    data.book_name, data.author, data.editor, data.size, data.paper_type,
    data.printing, data.binding, data.pages, data.edition_year, data.category,
    data.isbn, data.price,
    data.mostBayed === 'true' || data.mostBayed === true,
    data.localPublish === 'true' || data.localPublish === true,
    data.bookImage
  ];
  db.query(sql, values, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ تم إضافة الكتاب', id: results.insertId });
  });
});

// ✏️ تحديث كتاب
app.put('/books/:id', (req, res) => {
  const id = req.params.id;
  const data = {
    ...req.body,
    mostBayed: req.body.mostBayed === 'true' || req.body.mostBayed === true,
    localPublish: req.body.localPublish === 'true' || req.body.localPublish === true
  };
  const sql = 'UPDATE books SET ? WHERE id = ?';
  db.query(sql, [data, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ تم تحديث الكتاب' });
  });
});

// ❌ حذف كتاب
app.delete('/books/:id', (req, res) => {
  const sql = 'DELETE FROM books WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ تم حذف الكتاب' });
  });
});

// 💬 استقبال رسالة
app.post('/msg', (req, res) => {
  const { name, age, notes } = req.body;
  const sql = 'INSERT INTO messages (name, age, notes) VALUES (?, ?, ?)';
  db.query(sql, [name, age, notes], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ تم استلام الرسالة', id: result.insertId });
  });
});

// 📬 عرض الرسائل
app.get('/msg', (req, res) => {
  const sql = 'SELECT * FROM messages ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🗑️ حذف رسالة
app.delete('/msg/:id', (req, res) => {
  const sql = 'DELETE FROM messages WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '✅ تم حذف الرسالة' });
  });
});

// 🚀 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
