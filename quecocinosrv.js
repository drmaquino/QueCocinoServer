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

// REGISTER
// create user
// expects:
// BODY:
// {
//   "mail":"mariano@gmail.com",
//   "pass":"123456",
//   "nick":"Mariano"
// }
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

            // verify user does not exist
            users.find({mail: req.body.mail}).toArray(function(err, usersFound) {
                if (err) {
                    console.log(err);
                } else if (usersFound.length != 0) {
                    console.log('User found with same email.');
                    res.sendStatus(409);
                } else {
                    console.log('mail is not used, proceed with creation.');

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
                            console.log('Inserting User: ', result["result"]);

                            // Get the sessions collection
                            var sessions = db.collection('sessions');

                            // check for existing sessions
                            sessions.find({mail : req.body.mail}).toArray(function(err, sessionsFound) {
                                if (err) {
                                    console.log(err);
                                } else if (sessionsFound.length > 0) {
                                    console.log('returning existing session.');
                                    res.send({session: session["session"], mail: req.body.mail, nick: req.body.nick});
                                } else {
                                    //Create a session
                                    var session = {
                                        mail: req.body.mail,
                                        session: req.body.mail + (Math.random() * 1000).toFixed()
                                    };

                                    // Insert session
                                    sessions.insert(session, function(err, result) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            console.log('Inserting Session: ', session, result["result"]);
                                        }
                                        //Close connection
                                        db.close();
                                    });
                                    // return session
                                    res.send({session: session["session"], mail: req.body.mail, nick: req.body.nick});
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    console.log('finished POST');
});

// LOGIN
// create session
// expects:
// BODY:
// {
//   "mail":"mariano@gmail.com",
//   "pass":"123456"
// }
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
            users.find({mail: req.body.mail, pass: req.body.pass}).toArray(function(err, usersFound) {
                if (err) {
                    console.log(err);
                } else if (usersFound.length == 0) {
                    console.log('No user(s) found with given email and pass');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', usersFound);

                    // Get the sessions collection
                    var sessions = db.collection('sessions');

                    // check for existing sessions
                    sessions.find({mail : req.body.mail}).toArray(function(err, sessionsFound) {
                        if (err) {
                            console.log(err);
                        } else if (sessionsFound.length > 0) {
                            console.log('returning existing session.');
                            res.send({session: sessionsFound[0]["session"], mail: usersFound[0]["mail"], nick: usersFound[0]["nick"]});
                        } else {

                            //Create a session
                            var session = {
                                mail: req.body.mail,
                                session: req.body.mail + (Math.random() * 1000).toFixed()
                            };
                            // Insert session
                            sessions.insert(session, function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log('Inserting Session: ', session, result["result"]);

                                    // return session
                                    res.send({session: session["session"], mail: usersFound[0]["mail"], nick: usersFound[0]["nick"]});
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

// SEND AN INVITATION
// create an invitation
app.put("/invitations", jsonParser, function(req, res) {
    console.log('PUT: add new invitation');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);

            // Get the sessions collection
            var sessions = db.collection('sessions');

            // find session
            sessions.find({session : req.headers.session}).toArray(function(err, sessionsFound) {
                if (err) {
                    console.log(err);
                } else if (sessionsFound.length == 0) {
                    console.log('No session(s) found with given email and pass');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', sessionsFound);

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

                            users.find({mail: sessionsFound[0]["mail"]}).toArray(function(err, adminResult) {
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
                                            console.log('Inserting Invitation: ', result["result"]);
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
        }
    });
    console.log('finished POST');
});

// SEE INVITATIONS
// get all invitations for a user
app.get("/invitations", function(req, res) {
    console.log('GET: invitations by user');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);

            // Get the sessions collection
            var sessions = db.collection('sessions');

            // find session
            sessions.find({session : req.headers.session}).toArray(function(err, sessionsFound) {
                if (err) {
                    console.log(err);
                } else if (sessionsFound.length == 0) {
                    console.log('No session(s) found', req.headers.session);
                    res.sendStatus(401);
                } else {
                    console.log('Found:', sessionsFound);

                    // Get the invitations collection
                    var invitations = db.collection('invitations');

                    // Get invitation by member
                    invitations.find({"member": sessionsFound[0]["mail"]}).toArray(function(err, invitationsFound) {
                        if (err) {
                            console.log(err);
                        } else if (invitationsFound.length == 0) {
                            console.log('No invitation(s) found for given member');
                        } else {
                            console.log('Found:', invitationsFound);
                            res.send({invitations : invitationsFound});
                        }
                        //Close connection
                        db.close();
                    });
                }
            });
        }
    });
    console.log('finished GET');
});

// ACCEPT INVITATION
// add user to group
app.put("/users", jsonParser, function(req, res) {
    console.log('PUT: group admin to user');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);

            // Get the sessions collection
            var sessions = db.collection('sessions');

            // find session
            sessions.find({session : req.headers.session}).toArray(function(err, sessionsFound) {
                if (err) {
                    console.log(err);
                } else if (sessionsFound.length == 0) {
                    console.log('No session(s) found with given email and pass');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', sessionsFound);

                    // Get the users collection
                    var users = db.collection('users');
                    // find and update user
                    users.update({ 'mail': sessionsFound[0]["mail"]},
                                    { '$set': { 'groupAdmin': req.body.mail } },
                                    function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(result["result"]);

                            // Get the invitations collection
                            var invitations = db.collection('invitations');

                            // Get invitation by member
                            invitations.remove({"member": sessionsFound[0]["mail"], "admin.mail": req.body.mail}, function(err, result) {
                                if (err) {
                                    console.log(err);
                                } else if (result.length == 0) {
                                    console.log('No invitation(s) found for given member');
                                } else {
                                    console.log('deleted:', result);
                                }
                                db.close();
                            });
                        }
                    });
                }
            });
        }
    });
    console.log('finished PUT');
});

// DELETE INVITATION
// delete a specific invitacion
app.delete("/invitations", jsonParser, function(req, res) {
    console.log('DELETE: invitation by member and admir');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);

            // Get the sessions collection
            var sessions = db.collection('sessions');

            // find session
            sessions.find({session : req.headers.session}).toArray(function(err, sessionsFound) {
                if (err) {
                    console.log(err);
                } else if (sessionsFound.length == 0) {
                    console.log('No session(s) found with given email and pass');
                    res.sendStatus(401);
                } else {
                    console.log('Found:', sessionsFound);

                    // Get the invitations collection
                    var invitations = db.collection('invitations');

                    // Get invitation by admin and member
                    invitations.remove({"member": sessionsFound[0]["mail"], "admin.mail": req.body.mail}, function(err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Deleting invitation:", "member:"+sessionsFound[0]["mail"], "admin:"+req.body.mail, result["result"]);
                            res.send(result["result"])
                            //Close connection
                            db.close();
                        }
                    });
                }
            });
        }
    });
    console.log('finished DELETE');
});

//SEE GROUP MEMBERS
// get all users in a group
app.get("/users/group/", jsonParser, function(req, res) {
    console.log('GET: users in group');
    MongoClient.connect(url, function(err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
            res.sendStatus(400);
        } else {
            console.log('Connection established to', url);

            // Get the sessions collection
            var sessions = db.collection('sessions');

            // find session
            sessions.find({session : req.headers.session}).toArray(function(err, sessionsFound) {
                if (err) {
                    console.log(err);
                } else if (sessionsFound.length == 0) {
                    console.log('No session(s) found', req.headers.session);
                    res.sendStatus(401);
                } else {
                    console.log('Found:', sessionsFound);

                    // Get the users collection
                    var users = db.collection('users');

                    // Get user by groupAdmin
                    users.find({"groupAdmin": sessionsFound[0]["mail"]}).toArray(function(err, usersFound) {
                        if (err) {
                            console.log(err);
                        } else if (usersFound.length == 0) {
                            console.log('No user(s) found with given group admin', sessionsFound[0]["mail"]);
                            res.send({});
                        } else {
                            console.log('Found:', usersFound);
                            res.send({members : usersFound});
                        }
                        //Close connection
                        db.close();
                    });
                }
            });
        }
    });
    console.log('finished GET');
});

app.listen(port);

console.log("listening on port", port);

// // delete all invitations for a user
// app.delete("/invitations/:member", jsonParser, function(req, res) {
//     console.log('DELETE: invitations by member');
//     MongoClient.connect(url, function(err, db) {
//         if (err) {
//             console.log('Unable to connect to the mongoDB server. Error:', err);
//             res.sendStatus(400);
//         } else {
//             console.log('Connection established to', url);
//             // Get the invitations collection
//             var invitations = db.collection('invitations');

//             // Get invitation by member
//             invitations.remove({"member": req.params.member}, function(err, result) {
//                 if (err) {
//                     console.log(err);
//                 } else {
//                     console.log(result);
//                     res.send({result: "ok"})

//                     //Close connection
//                     db.close();
//                 }
//             })
//         }
//     });
//     console.log('finished DELETE');
// });

// // get user by session
// app.get("/users", jsonParser, function(req, res) {
//     console.log('GET: user by email');
//     MongoClient.connect(url, function(err, db) {
//         if (err) {
//             console.log('Unable to connect to the mongoDB server. Error:', err);
//             res.sendStatus(400);
//         } else {
//             console.log('Connection established to', url);

//             // Get the sessions collection
//             var sessions = db.collection('sessions');

//             session = req.headers.session
//             console.log(session)

//             // Get session by session hash
//             sessions.find({"session": session}).toArray(function(err, result) {
//                 if (err) {
//                     console.log(err);
//                 } else if (result.length == 0) {
//                     console.log('No user(s) found with given group admin');
//                     res.send({});
//                 } else {
//                     console.log('Found:', result);

//                     mail = result[0]["mail"]

//                     // Get the documents collection
//                     var users = db.collection('users');

//                     // Get user by email
//                     users.find({'mail': mail}).toArray(function(err, result) {
//                         if (err) {
//                             console.log(err);
//                         } else if (result.length == 0) {
//                             console.log('No user(s) found with given email');
//                             res.send({});
//                         } else {
//                             console.log('Found:', result);
//                             res.send(result[0]);
//                         }
//                         //Close connection
//                         db.close();
//                     });
//                 }
//             });
//         }
//     });
//     console.log('finished GET');
// });
