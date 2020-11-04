var Book = require("../models/book");
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance");

var async = require("async");

const { body, validationResult } = require("express-validator");

exports.index = function (req, res) {
    async.parallel(
        {
            book_count: function (callback) {
                Book.countDocuments({}, callback);
            },
            book_instance_count: function (callback) {
                BookInstance.countDocuments({}, callback);
            },
            book_instance_available_count: function (callback) {
                BookInstance.countDocuments({ status: "Available" }, callback);
            },
            author_count: function (callback) {
                Author.countDocuments({}, callback);
            },
            genre_count: function (callback) {
                Genre.countDocuments({}, callback);
            },
        },
        function (err, results) {
            res.render("index", {
                title: "Local Library Home",
                error: err,
                data: results,
            });
        }
    );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
    Book.find({}, "title author")
        .populate("author")
        .exec(function (err, list_books) {
            if (err) {
                return next(err);
            }
            res.render("book_list", {
                title: "Book List",
                book_list: list_books,
            });
        });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_instance: function (callback) {
                BookInstance.find({ book: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                var err = new Error("Book not found");
                err.status = 404;
                return next(err);
            }
            res.render("book_detail", {
                title: results.book.title,
                book: results.book,
                book_instances: results.book_instance,
            });
        }
    );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
    // get all authors and genres to use for the book
    async.parallel(
        {
            authors: function (callback) {
                Author.find(callback);
            },
            genres: function (callback) {
                Genre.find(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            res.render("book_form", {
                title: "Create a Book",
                authors: results.authors,
                genres: results.genres,
            });
        }
    );
};

// Handle book create on POST.
exports.book_create_post = [
    // convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },
    // validate and sanitize fields
    body("title", "Title must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("genre.*").escape(),

    // process request after validatin and sanitization
    (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);
        // create a book object with escaped and trimmed data
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre,
        });
        if (!errors.isEmpty()) {
            // errors - render the form again
            async.parallel(
                {
                    authors: function (callback) {
                        Author.find(callback);
                    },
                    genres: function (callback) {
                        Genre.find(callback);
                    },
                },
                function (err, results) {
                    if (err) {
                        return next(err);
                    }
                    // mark selected genres as checked
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = "true";
                        }
                    }
                    res.render("book_form", {
                        title: "Create Book",
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array(),
                    });
                }
            );
            return;
        } else {
            book.save(function (err) {
                if (err) {
                    return next(err);
                }
                // success - redirect to new book record
                res.redirect(book.url);
            });
        }
    },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_instance: function (callback) {
                BookInstance.find({ book: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                res.redirect("/catalog/books");
            }
            res.render("book_delete", {
                title: "Delete Book",
                book: results.book,
                book_instances: results.book_instance,
            });
        }
    );
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.body.bookid)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            book_instance: function (callback) {
                BookInstance.find({ book: req.body.bookid }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                res.redirect("/catalog/books");
            }
            if (results.book_instance.length) {
                // book still has instances
                res.render("book_delete", {
                    title: "Delete Book",
                    book: results.book,
                    book_instances: results.book_instance,
                });
            } else {
                // book has no instances - delete and redirect
                Book.findByIdAndRemove(req.body.bookid, function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.redirect("/catalog/books");
                });
            }
        }
    );
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
    // get the book, author, and genres for the form
    async.parallel(
        {
            book: function (callback) {
                Book.findById(req.params.id)
                    .populate("author")
                    .populate("genre")
                    .exec(callback);
            },
            authors: function (callback) {
                Author.find(callback);
            },
            genres: function (callback) {
                Genre.find(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.book == null) {
                var err = new Error("Book not found");
                err.status = 404;
                return next(err);
            }
            // if the book is found, check the genres
            for (let a = 0; a < results.genres.length; a++) {
                for (let b = 0; b < results.book.genre.length; b++) {
                    if (
                        results.genres[a]._id.toString() ===
                        results.book.genre[b]._id.toString()
                    ) {
                        results.genres[a].checked = "true";
                    }
                }
            }
            res.render("book_form", {
                title: "Update Book",
                authors: results.authors,
                genres: results.genres,
                book: results.book,
            });
        }
    );
};

// Handle book update on POST.
exports.book_update_post = [
    // Convert the genre to an array
    (req, res, next) => {
        if (!(req.body.genre instanceof Array)) {
            if (typeof req.body.genre === "undefined") req.body.genre = [];
            else req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    // Validate and sanitize fields.
    body("title", "Title must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("author", "Author must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("summary", "Summary must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
    body("genre.*").escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a Book object with escaped/trimmed data and old id.
        var book = new Book({
            title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: typeof req.body.genre === "undefined" ? [] : req.body.genre,
            _id: req.params.id, //This is required, or a new ID will be assigned!
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.

            // Get all authors and genres for form.
            async.parallel(
                {
                    authors: function (callback) {
                        Author.find(callback);
                    },
                    genres: function (callback) {
                        Genre.find(callback);
                    },
                },
                function (err, results) {
                    if (err) {
                        return next(err);
                    }

                    // Mark our selected genres as checked.
                    for (let i = 0; i < results.genres.length; i++) {
                        if (book.genre.indexOf(results.genres[i]._id) > -1) {
                            results.genres[i].checked = "true";
                        }
                    }
                    res.render("book_form", {
                        title: "Update Book",
                        authors: results.authors,
                        genres: results.genres,
                        book: book,
                        errors: errors.array(),
                    });
                }
            );
            return;
        } else {
            // Data from form is valid. Update the record.
            Book.findByIdAndUpdate(req.params.id, book, {}, function (
                err,
                thebook
            ) {
                if (err) {
                    return next(err);
                }
                // Successful - redirect to book detail page.
                res.redirect(thebook.url);
            });
        }
    },
];
