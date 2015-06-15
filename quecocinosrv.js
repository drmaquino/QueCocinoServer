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

//USERS

// add user to db
app.post("/users", jsonParser, function(req, res) {
    MongoClient.connect(url, res, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the users collection
            var users = db.collection('users');
            //Create a user
            var user = {
                mail: req.body.mail,
                pass: req.body.pass,
                nick: req.body.nick,
                groupAdmin: req.body.mail
            };
            // Insert user
            users.insert(user, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Inserted: ', result);

                    // Get the sessions collection
                    var sessions = db.collection('sessions');
                    //Create a session
                    var session = {
                        mail: req.body.mail,
                        session: 'session_' + req.body.mail
                    };
                    // Insert session
                    sessions.insert(session, function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Inserted: ', result);
                        }
                        //Close connection
                        db.close();
                    });
                    // return session
                    res.send(session);
                }
            });
        }
    });
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
            var users = db.collection('users');

            // Get user by email
            users.find({}).toArray(function(err, result) {
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
            });
        }
    });
});

// get user from db
app.get("/users/:mail", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var users = db.collection('users');

            // Get user by email
            users.find({mail: req.params.mail}).toArray(function(err, result) {
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
            });
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
            var users = db.collection('users');

            // Get user by email
            users.find({"groupAdmin": req.params.admin}).toArray(function(err, result) {
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
            });
        }
    });
});

// add user to group
app.put("/users", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var users = db.collection('users');
            // find and update user
            users.update(
                    { 'mail': req.body.mail },
                    { '$set': { 'groupAdmin': req.body.admin } },
                function(err, object) {
                    if (err) {
                        console.warn(err.message);
                    } else {
                        console.dir(object);
                    }
                });
                db.close();
            }
        });
        res.send(req.body);
    }
);

//SESSIONS

// get session from db
app.post("/sessions", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the users collection
            var users = db.collection('users');

            // find user
            users.find({mail: req.body.mail, pass: req.body.pass}).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                } else if (result.length == 0) {
                    console.log('No document(s) found with defined "find" criteria!');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', result);

                    // Get the sessions collection
                    var sessions = db.collection('sessions');
                    //Create a session
                    var session = {
                        mail: req.body.mail,
                        session: 'session_' + req.body.mail
                    };
                    // Insert session
                    sessions.insert(session, function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Inserted: ', result);
                        }
                        //Close connection
                        db.close();
                    });
                    // return session
                    res.send({session: session["session"], mail: result[0]["mail"], nick: result[0]["nick"]});
                }
            });
        }
    });
});

//INVITATIONS

// create an invitation
app.post("/invitations", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the users collection
            var users = db.collection('users');

            // find target member
            users.find({mail: req.body.member}).toArray(function(err, memberResult) {
                if (err) {
                    console.log(err);
                }
                else if (memberResult.length == 0) {
                    console.log('No document(s) found with defined "find" criteria!');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', memberResult);

                    users.find({mail: req.body.admin}).toArray(function(err, adminResult) {
                        if (err) {
                            console.log(err);
                        }
                        else if (adminResult.length == 0) {
                            console.log('No document(s) found with defined "find" criteria!');
                            res.sendStatus(401);
                        } else {
                            console.log('Found:', adminResult);

                            // Get the invitations collection
                            var invitations = db.collection('invitations');
                            //Create a invitation
                            var admin = {
                                mail: adminResult[0].mail,
                                nick: adminResult[0].nick
                            }
                            var invitation = {
                                admin: admin,
                                member: req.body.member
                            };
                            // Insert invitation
                            invitations.insert(invitation, function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Inserted: ', result);
                                    res.send(invitation);
                                }
                                //Close connection
                                db.close();
                            });
                        }
                    });
                }
            });
        }
    });
});

// get all invitations for a user
app.get("/invitations/:member", jsonParser, function(req, res) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the invitations collection
            var invitations = db.collection('invitations');

            // Get invitation by member
            invitations.find({"member": req.params.member}).toArray(function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Found:', result);
                    res.send({invitations : result});

                    //Close connection
                    db.close();
                }
            })
        }
    });
});


app.listen(port);

console.log("listening on port", port);
