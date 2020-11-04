var Author = require("../models/author");
var async = require("async");
var Book = require("../models/book");

const { body, validationResult } = require("express-validator");

// display the list of authors
exports.author_list = function (req, res, next) {
    Author.find()
        .sort([["family_name", "ascending"]])
        .exec(function (err, list_authors) {
            if (err) {
                return next(err);
            }
            res.render("author_list", {
                title: "Author List",
                author_list: list_authors,
            });
        });
};

// display detail page for a specific author
exports.author_detail = function (req, res, next) {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.params.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.params.id }, "title summary").exec(
                    callback
                );
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.author == null) {
                var err = new Error("Author not found");
                err.status = 404;
                return next(err);
            }
            res.render("author_detail", {
                title: "Author Detail",
                author: results.author,
                author_books: results.authors_books,
            });
        }
    );
};

// display author create form on GET
exports.author_create_get = function (req, res) {
    res.render("author_form", { title: "Create Author", author: new Author()});
};

// handle author create on POST
exports.author_create_post = [
    // validate and sanitize fields
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters"),

    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name must be specified")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters"),

    body("date_of_birth", "Invalid dote of birth")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    body("date_of_death", "Invalid dote of death")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process request after validation and sanitization
    (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // render the form again with sanitized values and error messages
            res.render("author_form", {
                title: "Create Author",
                author: req.body,
                errors: errors.array(),
            });
            return;
        } else {
            // create an Author object with escaped and trimmed data
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
            });
            author.save(function (err) {
                if (err) {
                    return next(err);
                }
                // else redirect to the new author record
                res.redirect(author.url);
            });
        }
    },
];

// display author delete form on GET
exports.author_delete_get = function (req, res, next) {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.params.id).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.params.id }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            if (results.author == null) {
                res.redirect("/catalog/authors");
            }
            // else render
            res.render("author_delete", {
                title: "Delete Author",
                author: results.author,
                author_books: results.authors_books,
            });
        }
    );
};

// handle author delete of POST
exports.author_delete_post = function (req, res, next) {
    async.parallel(
        {
            author: function (callback) {
                Author.findById(req.body.authorid).exec(callback);
            },
            authors_books: function (callback) {
                Book.find({ author: req.body.authorid }).exec(callback);
            },
        },
        function (err, results) {
            if (err) {
                return next(err);
            }
            // success (?)
            if (results.authors_books.length > 0) {
                // Author has books, render the same way as GET
                res.render("author_delete", {
                    title: "Delete Author",
                    author: results.author,
                    author_books: results.authors_books,
                });
                return;
            } else {
                // Author has no books - delete and redirect to the list of authors
                Author.findByIdAndRemove(
                    req.body.authorid,
                    function deleteAuthor(err) {
                        if (err) {
                            return next(err);
                        }
                        // success - redirect to the authors list
                        res.redirect("/catalog/authors");
                    }
                );
            }
        }
    );
};

// display author update form on GET
exports.author_update_get = function (req, res, next) {
    Author.findById(req.params.id).exec(function (err, author) {
        if (err) {
            return next(err);
        }
        if (author == null) {
            let err = new Error("Author not found");
            err.status = 404;
            return next(err);
        }
        res.render("author_form", {
            title: "Update Author",
            author: author,
        });
    });
};

// handle author update on POST
exports.author_update_post = [
    // validate and sanitize fields
    body("first_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("First name must be specified")
        .isAlphanumeric()
        .withMessage("First name has non-alphanumeric characters"),

    body("family_name")
        .trim()
        .isLength({ min: 1 })
        .escape()
        .withMessage("Family name must be specified")
        .isAlphanumeric()
        .withMessage("Family name has non-alphanumeric characters"),

    body("date_of_birth", "Invalid date of birth")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    body("date_of_death", "Invalid date of death")
        .optional({ checkFalsy: true })
        .isISO8601()
        .toDate(),

    // process request after validation and sanitization
    (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // render the form again with sanitized values and error messages
            res.render("author_form", {
                title: "Create Author",
                author: req.body,
                errors: errors.array(),
            });
            return;
        } else {
            // create an Author object with escaped and trimmed data
            var author = new Author({
                first_name: req.body.first_name,
                family_name: req.body.family_name,
                date_of_birth: req.body.date_of_birth,
                date_of_death: req.body.date_of_death,
                _id: req.params.id
            });
            Author.findByIdAndUpdate(req.params.id, author, {}, function (err, theauthor) {
                if (err) {
                    return next(err);
                }
                // else redirect to the author record
                res.redirect(theauthor.url);
            });
        }
    },
];
