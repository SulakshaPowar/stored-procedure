const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const index = require("../index");
const db = require("../lib/db.js");
const userMiddleware = require("../middleware/user.js");
const { validateRegister } = require("../middleware/user.js");
var app = express();
const bodyparser = require('body-parser'); 
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyparser.json());

//http://localhost:3000/api/sign-up
router.post("/sign-up", userMiddleware.validateRegister, (req, res, next) => {
    db.query(
        `SELECT id FROM users WHERE LOWER(username) = LOWER(${req.body.username})` , 
        (err, result) => {
        if(result && result.length){ 
            //error 
            return res.status(409).send({
                message:"This username is already in use!",
            });
        } else { 
            //username not in use
            bcrypt.hash(req.body.password,10 ,(err, hash) => {
                if(err){
                    throw err;
                    return res.status(500).send({
                        message: err,
                    });
                } else {
                    db.query(
                        `INSERT INTO users(id, username, password, registered) VALUES('${uuid.v4()}',  
                        ${db.escape(req.body.username)}, 
                        '${hash}',now());`,
                        (err, result) => {
                            if(err){
                                throw err;
                                return res.status(400).send({
                                    message: err,
                                });
                            }
                            return res.status(201).send({
                                message: "Registered!",
                            });
                        })
                }
            });

        }
    })
});

//http://localhost:3000/api/login
router.post("/login", (req, res, next) => { 
    console.log(req.body);
    db.query(
        `SELECT * FROM users WHERE username = ${db.escape(req.body.username)};`, 
    (err, result) => {
        console.log(result);
        if(err) {
            throw err;
            return res.status(400).send({
                message:"err" , 
            });
        }
        if(!result.length){
            return res.status(401).send({
                message: "Username or password incorrect",
            });
        }

        //check password
        bcrypt.compare(req.body.password, 
            result[0]["password"],
        (bErr, bResult) => {
            //wrong password
            if (bErr) {
                throw bErr;
                return res.status(401).send({
                    message: "Username or password incorrect!",
                }); 
            }
                    if(bResult){
                        //password match
                        const token = jwt.sign(
                            {
                                username: result[0].username,
                                userId: result[0].id
                        },
                        "SECRETKEY",
                        {expiresIn: "7d"}
                        );
                    db.query(`UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
                    );
                    return res.status(200).send({
                        message: 'Logged in!',
                        token,
                        user: result[0]
                    });

                }
                return res.status(400).send({
                    message: "Username or password incorrect"
                });
            }
            );
});
});

//http://localhost:3000/api/secret-route
router.get("/secret-route", userMiddleware.isLoggedIn,(req, res, next) => {
    console.log(req.userData);
    console.log(result);
    res.send("This is the secret content. Only Logged In users can see that!");

}); 



//-------------------------------------Products section-----------------------------------------------//


//Get all products
//http://localhost:3000/api/product-details
router.get('/product-details', (req, res) => {
    db.query('SELECT * FROM Products', (err, rows, fields) => {
        if (!err)
            res.send(rows);
        else
            console.log(err);
    })
});

//Get a product based on id
//http://localhost:3000/api/product-details/:id
router.get('/product-details/:id', (req, res) => {
    db.query('SELECT * FROM Products WHERE id = ?', [req.params.id], (err, rows, fields) => {
        if (!err)
            res.send(rows);
        else
            console.log(err);
    })
});


//Delete a product
//http://localhost:3000/api/delete-product/:id
router.delete('/delete-product/:id', (req, res) => {
    db.query('DELETE FROM Products WHERE id = ?', [req.params.id], (err, rows, fields) => {
        if (!err)
            res.send('Deleted successfully.');
        else
            console.log(err);
    })
});

//Insert a product
//http://localhost:3000/api/add-product
router.post('/add-product', (req, res, next) => {
   
    db.query('INSERT INTO Products SET ?', {id: req.body.id,
        product_name: req.body.product_name,
        description: req.body.description,
        slug: req.body.slug,
        image: req.body.image,
        status: req.body.status}, (err, res)=>{
        if(err) throw err;
        else
        console.log('product has been added successfully');
    });
});



// //Update a product 
// //http://localhost:3000/api/update-product/:id

// router.put('/update-product/:id', (req, res) => {
//     console.log('he')
//     db.query("UPDATE Products SET ? product_name = _product_name, description=_description, slug= _slug, image = _image, status= _status WHERE id = _id", (err, rows, fields) => {
//         if (!err)
//             res.send('Updated successfully.');
//         else
//             console.log(err);
//     })
// });

app.put('/update-products', (req, res) => {
    let prod = req.body;
    var sql = "UPDATE Products SET @id = ?;SET @product_name = ?;SET @description = ?;SET @slug = ? @image = ? @Status = ? WHERE id = _id;"
    db.query(sql, [prod.id, prod.product_name, prod.description, prod.slug, prod.image, prod.status], (err, rows, fields) => {
        if (!err)
            res.send('Updated successfully');
        else
            console.log(err);
    })
});









module.exports = router;