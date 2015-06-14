var express = require("express");
var mongodb = require('mongodb');
var bodyParser = require('body-parser')

var port = 5000;
var app = express();

// Database url
var url = 'mongodb://localhost:27017/quecocino';

// Mongo client
var MongoClient = mongodb.MongoClient;

// create application/json parser
var jsonParser = bodyParser.json()

/* routes */

// add user to db
app.post("/users", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection('users');
            //Create a person
            var user = {
                mail: req.body.mail,
                pass: req.body.pass,
                nick: req.body.nick,
                groupAdmin: req.body.mail
            };
            // Insert person
            collection.insert(user, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
                }
                //Close connection
                db.close();
            })
        }
    });
    res.send(req.body); // echo the result back
});

// get all users
app.get("/users", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection('users');

            // Get user by email
            collection.find({}).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    console.log('Found:', result);
                    res.send({members : result});
                } else {
                    console.log('No document(s) found with defined "find" criteria!');
                    res.send({});
                }
                //Close connection
                db.close();
            })
        }
    });
});

// include email in url query (?key=value)

// get user from db
app.get("/users/:mail", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection('users');

            // Get user by email
            collection.find({mail: req.params.mail}).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    console.log('Found:', result);
                    res.send(result[0]);
                } else {
                    console.log('No document(s) found with defined "find" criteria!');
                    res.send({});
                }
                //Close connection
                db.close();
            })
        }
    });
});

// get session from db
app.post("/sessions", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection('users');

            // Get user by email
            collection.find({mail: req.body.mail, pass: req.body.pass}).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    console.log('Found:', result);

                    // aca debería hashearlo!
                    session = {mail: result[0]["mail"], session: "session_" + result[0]["mail"]}

                    var sessions = db.collection('sessions');
                    sessions.insert(session, function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Inserted %d documents into the "sessions" collection. The documents inserted with "_id" are:', result.length, result);
                        }
                    })
                    res.send(session);
                } else {
                    console.log('No document(s) found with defined "find" criteria!');
                    res.sendStatus(401);
                }
                //Close connection
                db.close();
            })
        }
    });
});

// get all users in a group
app.get("/users/group/:admin", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var collection = db.collection('users');

            // Get user by email
            collection.find({"groupAdmin": req.params.admin}).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length) {
                    console.log('Found:', result);
                    res.send({members : result});
                } else {
                    console.log('No document(s) found with defined "find" criteria!');
                    res.send({});
                }
                //Close connection
                db.close();
            })
        }
    });
});

// add user to group
app.put(
    "/users",
    jsonParser,
    function(req, res) {
        MongoClient.connect(
            url,
            function(err, db) {
                if (err) {
                    console.log('Unable to connect to the mongoDB server. Error:', err);
                    res.sendStatus(400);
                } else {
                    console.log('Connection established to', url);
                    // Get the documents collection
                    var collection = db.collection('users');
                    // find and update user
                    collection.update(
                            { 'mail': req.body.mail },
                            { '$set': { 'groupAdmin': req.body.admin } }, // req.query.admin } },
                        function(err, object) {
                            if (err) {
                                console.warn(err.message); // returns error if no matching object found
                            } else {
                                console.dir(object);
                            }
                        }
                    );
                    db.close();
                }
            }
        );
        res.send(req.body); // echo the result back
    }
);

app.listen(port);

console.log("listening on port", port);

