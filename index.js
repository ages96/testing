const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(bodyParser.json());

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

// Mock Data
const books = [
    {
        code: "JK-45",
        title: "Harry Potter",
        author: "J.K Rowling",
        stock: 1
    },
    {
        code: "SHR-1",
        title: "A Study in Scarlet",
        author: "Arthur Conan Doyle",
        stock: 1
    },
    {
        code: "TW-11",
        title: "Twilight",
        author: "Stephenie Meyer",
        stock: 1
    },
    {
        code: "HOB-83",
        title: "The Hobbit, or There and Back Again",
        author: "J.R.R. Tolkien",
        stock: 1
    },
    {
        code: "NRN-7",
        title: "The Lion, the Witch and the Wardrobe",
        author: "C.S. Lewis",
        stock: 1
    },
];

const members = [
    {
        code: "M001",
        name: "Angga",
        borrowedBooks: [],
        penalty: false
    },
    {
        code: "M002",
        name: "Ferry",
        borrowedBooks: [],
        penalty: false
    },
    {
        code: "M003",
        name: "Putri",
        borrowedBooks: [],
        penalty: false
    },
];

// Function to find a book by its code
function findBookByCode(bookCode) {
    return books.find(book => book.code === bookCode);
}

// Function to find a member by their code
function findMemberByCode(memberCode) {
    return members.find(member => member.code === memberCode);
}


/**
 * @openapi
 * /borrow:
 *   post:
 *     summary: Borrow a book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               memberCode:
 *                 type: string
 *               bookCode:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Book borrowed successfully
 *       '404':
 *         description: Member or book not found
 *       '400':
 *         description: Member cannot borrow more than 2 books, book is out of stock, or member is penalized
 */
// Route to borrow a book
app.post('/borrow', (req, res) => {
    const { memberCode, bookCode } = req.body;

    const member = findMemberByCode(memberCode);
    if (!member) {
        return res.status(404).json({ error: 'Member not found' });
    }

    const book = findBookByCode(bookCode);
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }

    if (member.borrowedBooks.length >= 2) {
        return res.status(400).json({ error: 'Member cannot borrow more than 2 books' });
    }

    if (book.stock === 0) {
        return res.status(400).json({ error: 'Book is out of stock' });
    }

    if (member.penalty) {
        return res.status(400).json({ error: 'Member is currently penalized and cannot borrow books' });
    }

    book.stock--;
    member.borrowedBooks.push(bookCode);

    return res.status(200).json({ message: 'Book borrowed successfully' });
});

/**
 * @openapi
 * /return:
 *   post:
 *     summary: Return a book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               memberCode:
 *                 type: string
 *               bookCode:
 *                 type: string
 *               daysLate:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Book returned successfully
 *       '404':
 *         description: Member or book not found
 *       '400':
 *         description: Member has not borrowed this book or member is penalized
 */
// Route to return a book
app.post('/return', (req, res) => {
    const { memberCode, bookCode, daysLate } = req.body;

    const member = findMemberByCode(memberCode);
    if (!member) {
        return res.status(404).json({ error: 'Member not found' });
    }

    const book = findBookByCode(bookCode);
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }

    if (!member.borrowedBooks.includes(bookCode)) {
        return res.status(400).json({ error: 'Member has not borrowed this book' });
    }

    if (daysLate > 7) {
        member.penalty = true;
        setTimeout(() => {
            member.penalty = false;
        }, 3 * 24 * 60 * 60 * 1000); // 3 days in milliseconds
    }

    book.stock++;
    member.borrowedBooks = member.borrowedBooks.filter(code => code !== bookCode);

    return res.status(200).json({ message: 'Book returned successfully' });
});

/**
 * @openapi
 * /books:
 *   get:
 *     summary: Get all books
 *     responses:
 *       '200':
 *         description: A list of books
 */
app.get('/books', (req, res) => {
    return res.status(200).json(books);
});

/**
 * @openapi
 * /members:
 *   get:
 *     summary: Get all members
 *     responses:
 *       '200':
 *         description: A list of members
 */
app.get('/members', (req, res) => {
    return res.status(200).json(members);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});