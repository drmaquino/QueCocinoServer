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
    console.log('POST: add new user');
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
                            console.log('Inserted: ', result["result"]);
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
console.log('finished POST');
});

// get all users
app.get("/users", jsonParser, function(req, res) {
    console.log('GET: all users');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the users collection
            var users = db.collection('users');

            // Get all users
            users.find().toArray(function(err, usersResult) {
                if (err) {
                    console.log(err);
                } else if (usersResult.length == 0) {
                    console.log('No user(s) found');
                    res.send({members : usersResult});
                } else {
                    console.log('Found:', usersResult);
                    res.send({members : usersResult});
                }
                //Close connection
                db.close();
            });
        }
    });
    console.log('finished GET');
});

// get user by email
app.get("/users/:mail", jsonParser, function(req, res) {
    console.log('GET: user by email');
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
                    console.log('No user(s) found with given email');
                    res.send({});
                }
                //Close connection
                db.close();
            });
        }
    });
    console.log('finished GET');
});

// get all users in a group
app.get("/users/group/:admin", jsonParser, function(req, res) {
    console.log('GET: users in group');
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
                    console.log('No user(s) found with given group admin');
                    res.send({});
                }
                //Close connection
                db.close();
            });
        }
    });
    console.log('finished GET');
});

// add user to group
app.put("/users", jsonParser, function(req, res) {
    console.log('PUT: group admin to user');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the documents collection
            var users = db.collection('users');
            // find and update user
            users.update({ 'mail': req.body.mail },
                            { '$set': { 'groupAdmin': req.body.groupAdmin } },
                            function(err, result) {
                if (err) {
                    console.warn(err.message);
                } else {
                    console.log(result["result"]);
                    res.send(req.body);
                }
                db.close();
            });
        }
    });
    console.log('finished PUT');
});

//SESSIONS

// get session from db
app.post("/sessions", jsonParser, function(req, res) {
    console.log('POST: add and retrieve new session');
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
                    console.log('No session(s) found with given email and pass');
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
                            console.log('Inserted: ', result["result"]);
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
    console.log('finished POST');
});

//INVITATIONS

// create an invitation
app.post("/invitations", jsonParser, function(req, res) {
    console.log('POST: add new invitation');
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
                    console.log('No member(s) found with given email');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', memberResult);

                    users.find({mail: req.body.admin}).toArray(function(err, adminResult) {
                        if (err) {
                            console.log(err);
                        }
                        else if (adminResult.length == 0) {
                            console.log('No admin(s) found with given email');
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
                                    console.log('Inserted: ', result["result"]);
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
    console.log('finished POST');
});

// get all invitations for a user
app.get("/invitations/:member", jsonParser, function(req, res) {
    console.log('GET: invitations by user');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the invitations collection
            var invitations = db.collection('invitations');

            // Get invitation by member
            invitations.find({"member": req.params.member}).toArray(function(err, adminResult) {
                if (err) {
                    console.log(err);
                } else {
                    if (adminResult.length == 0) {
                       console.log('No invitation(s) found for given member');
                    } else {
                        console.log('Found:', adminResult);
                    }
                    res.send({invitations : adminResult});
                }
                //Close connection
                db.close();
            });
        }
    });
    console.log('finished GET');
});

// delete all invitations for a user
app.delete("/invitations/:member", jsonParser, function(req, res) {
    console.log('DELETE: invitations by member');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the invitations collection
            var invitations = db.collection('invitations');

            // Get invitation by member
            invitations.remove({"member": req.params.member}, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result);
                    res.send({result: "ok"})

                    //Close connection
                    db.close();
                }
            })
        }
    });
    console.log('finished DELETE');
});


// delete a specific invitacion
app.delete("/invitations/:member/:admin", jsonParser, function(req, res) {
    console.log('DELETE: invitation by member and admir');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);
            // Get the invitations collection
            var invitations = db.collection('invitations');

            // Get invitation by member
            invitations.remove({"member": req.params.member, "admin.mail": req.params.admin}, function(err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(result["result"]);
                    res.send({"result":"ok"})
                    //Close connection
                    db.close();
                }
            });
        }
    });
    console.log('finished DELETE');
});


app.listen(port);

console.log("listening on port", port);
