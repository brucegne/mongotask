"use latest";

var MongoClient = require('mongodb').MongoClient;

var request = require("request");

request("http://py-heroku.herokuapp.com/dailyjson", function(error, response, body) {
  results = JSON.parse(body);
  console.log(body);
});

request({
  uri: "http://www.cjihrig.com/development/php/hello_form.php",
  method: "POST",
  form: {
    name: "Bob"
  }
}, function(error, response, body) {
  console.log(body);
});


var view = `
<html>
<head>
    <title>Webtask MongoDB</title>
    <link rel="stylesheet" href="//maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css" />
    <style>
        body { margin: 30px; }
    </style>
</head>
<body>
    <h1>Basis search results</h1>
    <% if (!books || books.length === 0) { %>
    <p>No locations matching your search criteria were found.</p>
    <% } else { %>
    <table class="table table-striped">
        <tr><th>Crop</th><th>basis</th><th>Buyer</th><th>Location</th></tr>
        <% books.forEach(function (book) { %>
            <tr><td><%= book.commodity %></td><td><%= book.basis %></td><td><%= book.buyer %></td><td><%= book.location %></td></tr>
        <% }); %>
    </table>
    <% }; %>
</body>
</html>`;

module.exports = function (context, req, res) {
    // Validate input parameters
    if (!context.data.MONGO_URL)
        return error(400, new Error('The MONGO_URL parameter must be provided.'));
    if (!context.data.buyer && !context.data.location)
        return error(400, new Error('The title or author parameter must be provided.'));

    // Connect to MongoDB
    MongoClient.connect(context.data.MONGO_URL, function (err, db) {
        if (err) return error(502, err);

        // Construct books collection query
        var query = {};
        ['buyer', 'location', 'commodity'].forEach(function (p) {
            if (context.data[p])
                query[p] = { $regex: new RegExp(context.data[p], 'i') };
        });

        // Run the query
        db.collection('DailyStore').find(query).sort({'location':1}).toArray(function (err, books) {
            if (err) return error(502, err);
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(require('ejs').render(view, { books: books, context: context }));
//            res.end(JSON.stringify(books));
            db.close();
        });
    });

    function error(code, e) {
        res.writeHead(code);
        res.end(e.stack || e.message || e.toString());
    }
}
