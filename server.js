require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// اختر المنفذ من متغير البيئة أو 4000 كافتراضي
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// إنشاء اتصال بقاعدة البيانات باستخدام متغيرات البيئة
const db = mysql.createPool({
  host: process.env.MYSQLHOST,       // mysql.railway.internal
  user: process.env.MYSQLUSER,       // root
  password: process.env.MYSQLPASSWORD, // كلمة السر اللي زودتني بها
  database: process.env.MYSQLDATABASE, // railway
  port: process.env.MYSQLPORT || 3306, 
});

// اختبار اتصال قاعدة البيانات عند بدء التشغيل
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', err);
  } else {
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    connection.release();
  }
});

// --- مسارات API ---

// جلب كل الكتب
app.get('/books', (req, res) => {
  const sql = 'SELECT * FROM books';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ خطأ في جلب الكتب:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// إضافة كتاب
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
    if (err) {
      console.error('❌ خطأ في إضافة الكتاب:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '✅ تم إضافة الكتاب', id: results.insertId });
  });
});

// تحديث كتاب
app.put('/books/:id', (req, res) => {
  const data = req.body;
  const id = req.params.id;

  const updatedData = {
    ...data,
    mostBayed: data.mostBayed === 'true' || data.mostBayed === true,
    localPublish: data.localPublish === 'true' || data.localPublish === true,
  };

  const sql = 'UPDATE books SET ? WHERE id = ?';

  db.query(sql, [updatedData, id], (err) => {
    if (err) {
      console.error('❌ خطأ في تحديث الكتاب:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '✅ تم تحديث الكتاب' });
  });
});

// حذف كتاب
app.delete('/books/:id', (req, res) => {
  const sql = 'DELETE FROM books WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error('❌ خطأ في حذف الكتاب:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '✅ تم حذف الكتاب' });
  });
});

// استقبال رسالة
app.post('/msg', (req, res) => {
  const { name, age, notes } = req.body;
  const sql = 'INSERT INTO messages (name, age, notes) VALUES (?, ?, ?)';
  db.query(sql, [name, age, notes], (err, result) => {
    if (err) {
      console.error('❌ خطأ في إضافة الرسالة:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '✅ تم استلام الرسالة', id: result.insertId });
  });
});

// عرض الرسائل
app.get('/msg', (req, res) => {
  const sql = 'SELECT * FROM messages ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('❌ خطأ في جلب الرسائل:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// حذف رسالة
app.delete('/msg/:id', (req, res) => {
  const sql = 'DELETE FROM messages WHERE id = ?';
  db.query(sql, [req.params.id], (err) => {
    if (err) {
      console.error('❌ خطأ في حذف الرسالة:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '✅ تم حذف الرسالة' });
  });
});

// بدء تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
