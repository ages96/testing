const express = require('express');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(bodyParser.json());

// Sequelize initialization
const sequelize = new Sequelize('db_testing', 'ages', '12345678', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false // Set to true to see SQL logs
});

// Define models
const Book = sequelize.define('Book', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
});

const Member = sequelize.define('Member', {
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  borrowedBooks: {
    type: DataTypes.STRING, // Assuming a comma-separated list of book codes
    allowNull: false,
    defaultValue: ''
  },
  penalty: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

// Sync models with database (including auto migration)
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to MySQL database has been established successfully');
    await sequelize.sync({ alter: true }); // This will automatically create/update tables based on your models
    console.log('Models synchronized with MySQL database');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Swagger configuration
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Library API',
            version: '1.0.0',
            description: 'A simple Express.js API for managing a library',
        },
    },
    apis: ['./app.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * API Routes
 */

// Route to borrow a book
app.post('/borrow', async (req, res) => {
    const { memberCode, bookCode } = req.body;

    try {
        const member = await Member.findOne({ where: { code: memberCode } });
        const book = await Book.findOne({ where: { code: bookCode } });

        if (!member || !book) {
            return res.status(404).json({ error: 'Member or book not found' });
        }

        if (member.borrowedBooks.split(',').length >= 2 || book.stock === 0 || member.penalty) {
            return res.status(400).json({ error: 'Cannot borrow the book' });
        }

        await Book.update({ stock: book.stock - 1 }, { where: { code: bookCode } });
        await Member.update({ borrowedBooks: member.borrowedBooks + ',' + bookCode }, { where: { code: memberCode } });

        return res.status(200).json({ message: 'Book borrowed successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to return a book
app.post('/return', async (req, res) => {
    const { memberCode, bookCode, daysLate } = req.body;

    try {
        const member = await Member.findOne({ where: { code: memberCode } });
        const book = await Book.findOne({ where: { code: bookCode } });

        if (!member || !book) {
            return res.status(404).json({ error: 'Member or book not found' });
        }

        if (!member.borrowedBooks.includes(bookCode)) {
            return res.status(400).json({ error: 'Member has not borrowed this book' });
        }

        if (daysLate > 7) {
            member.penalty = true;
            setTimeout(async () => {
                member.penalty = false;
                await member.save();
            }, 3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
        }

        await Book.update({ stock: book.stock + 1 }, { where: { code: bookCode } });
        member.borrowedBooks = member.borrowedBooks.split(',').filter(code => code !== bookCode).join(',');
        await member.save();

        return res.status(200).json({ message: 'Book returned successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get all books
app.get('/books', async (req, res) => {
    try {
        const books = await Book.findAll();
        return res.status(200).json(books);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get all members
app.get('/members', async (req, res) => {
    try {
        const members = await Member.findAll();
        return res.status(200).json(members);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});