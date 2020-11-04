var BookInstance = require("../models/bookinstance");
var Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
    BookInstance.find()
        .populate("book")
        .exec(function (err, list_bookinstances) {
            if (err) {
                return next(err);
            }
            res.render("bookinstance_list", {
                title: "Book Instance List",
                bookinstance_list: list_bookinstances,
            });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                var err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            res.render("bookinstance_detail", {
                title: "Copy: " + bookinstance.book.title,
                bookinstance: bookinstance,
            });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, "title").exec(function (err, books) {
        if (err) {
            return next(err);
        }
        // else render
        res.render("bookinstance_form", {
            title: "Create Book Instance",
            book_list: books,
        });
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    // validate and sanitize fields
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process the request
    (req, res, next) => {
        // extract validation errors
        const errors = validationResult(req);
        // create a BookInstance object with the data
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
        });
        if (!errors.isEmpty()) {
            // render the form with errors and data
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                // else render
                res.render("bookinstance_form", {
                    title: "Create Book Instance",
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            });
            return;
        } else {
            // if data is valid
            bookinstance.save(function (err) {
                if (err) {
                    return next(err);
                }
                // success - redirect to the new record
                res.redirect(bookinstance.url);
            });
        }
    },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                res.redirect("/catalog/bookinstances");
            }
            // else render
            res.render("bookinstance_delete", {
                title: "Copy: " + bookinstance.book.title,
                bookinstance: bookinstance,
            });
        });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findById(req.body.bookinstanceid).exec(function (
        err,
        bookinstance
    ) {
        if (err) {
            return next(err);
        }
        if (bookinstance == null) {
            res.redirect("/catalog/bookinstances");
        }
        // else delete
        BookInstance.findByIdAndRemove(req.body.bookinstanceid, function (err) {
            if (err) {
                return next(err);
            }
            // else show the list of instances
            res.redirect("/catalog/bookinstances");
        });
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
    BookInstance.findById(req.params.id)
        .populate("book")
        .exec(function (err, bookinstance) {
            if (err) {
                return next(err);
            }
            if (bookinstance == null) {
                var err = new Error("Book copy not found");
                err.status = 404;
                return next(err);
            }
            res.render("bookinstance_update", {
                title: "Update: " + bookinstance.book.title,
                bookinstance: bookinstance,
            });
        });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    // validate and sanitize fields
    body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
    body("imprint", "Imprint must be specified")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("status").escape(),
    body("due_back", "Invalid date")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process the request
    (req, res, next) => {
        // extract validation errors
        const errors = validationResult(req);
        // create a BookInstance object with the data
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id: req.params.id,
        });
        if (!errors.isEmpty()) {
            // render the form with errors and data
            Book.find({}, "title").exec(function (err, books) {
                if (err) {
                    return next(err);
                }
                // else render
                res.render("bookinstance_form", {
                    title: "Create Book Instance",
                    book_list: books,
                    selected_book: bookinstance.book._id,
                    errors: errors.array(),
                    bookinstance: bookinstance,
                });
            });
            return;
        } else {
            // if data is valid
            BookInstance.findByIdAndUpdate(
                req.params.id,
                bookinstance,
                {},
                function (err, theinstance) {
                    if (err) {
                        return next(err);
                    }
                    // success - redirect to the new record
                    res.redirect(theinstance.url);
                }
            );
        }
    },
];
