const express = require('express');
const router = express.Router();
const mysql = require("../config/db.config");
const products = require("../data/products.json");
const json2csv = require("json2csv")


/* Products APIS */

/* 
Question 1: Create a node api that will read the “product.json” file and save the data in the database.
*/
router.post('/add-products', (req, res, next) => {
    products.forEach((product) => {
        mysql.query(`Insert INTO product_data (product_id, product_name, sku_code, price) VALUES 
                    (${product.product_id}, '${product.product_name}', ${product.sku_code}, ${product.price})`, 
                    (err, result) => {
                        if (err) {
                            console.log('err IN Inserting the data: ', err);
                        } else {
                            console.log('result: ', result);
                        }
                    })
    });
    res.status(200);
    res.send('Data inserted successfully!');
    // res.send('Data inserted successfully');
});


/**
 * Question 2:Now create an api that will list out the saved product with product name, sku code, price on front end and there will be an add to cart button along with pagination 
 * 
 * 
 * NOTE: required parameter 'currentPage' in body
 */
 router.post("/get-all-products", (req, res) => {
    console.log('req: ', req.body);
    
    // res.send("OK");
    let page  = req.body.currentPage ? req.body.currentPage : 1;
    let limit = 2;
    let offset = (limit * page) - limit;
    mysql.query(`SELECT * From product_data LIMIT ${limit} OFFSET ${offset}`, (err, data) => {
        if (err) {
            console.log('err: ', err);
            res.status(500);
            res.send(err);
        } else {
            res.status(200);
            res.send(data);
        }
    })
});


/***
 * Question 3: 
 * 
 */
router.post("/add-to-cart", (req, res) => {

    if (req.body.product_id && req.body.user_id) {
        mysql.query(`Select * from user_cart WHERE product_id = ${req.body.product_id} AND user_id = ${req.body.user_id}`,
        (err, result) => {
            if (err) {
                res.status(500).send(err);
            } else {
                console.log('result: ', result);
                let qty = req.body.quantity ? req.body.quantity : 1;
                let qry = "";
                if (result.length > 0) {
                    qty += result[0].quantity; 
                    qry = "Update user_cart SET quantity="+qty+` WHERE product_id = ${req.body.product_id} AND user_id = ${req.body.user_id} `;
                } else {
                    qry = `INSERT INTO user_cart (product_id, user_id, quantity) VALUES (${req.body.product_id}, ${req.body.user_id}, ${qty})`;
                }
                console.log('qry: ', qry);
                mysql.query(qry, (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.status(200).send(result.message);
                    }
                });
            }
        })
    } else {
        res.status(500).send("ProductId and UserId are required field!")
    }
});


/***
 * Question 4: 
 * 
 * NOTE: 'user_id' is required in req.body
 */

router.post("/list-cart-item", (req, res) => {
    if (req.body.user_id) {
        mysql.query(`SELECT p.product_name, p.sku_code, u.quantity, p.price, (p.price * u.quantity) as subTotal FROM product_data p JOIN user_cart u WHERE u.user_id = ${req.body.user_id} and u.product_id = p.product_id`,
        (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        })
    } else {
        res.status(500).send("User Id is required");
    }
});



/***
 * Question 5:
 * 
 * 
 */
 router.post("/remove-cart-item", (req, res) => {
    if (req.body.product_id && req.body.user_id) {
        mysql.query(`select * from user_cart WHERE product_id = ${req.body.product_id} AND user_id = ${req.body.user_id}`, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                console.log('data: ', data);
                if (data.length) {
                    mysql.query(`DELETE from user_cart WHERE product_id = ${req.body.product_id} AND user_id = ${req.body.user_id}`, 
                    (err, response) => {
                        if (err) {
                            res.status(500).send(err);
                        } else {
                            res.status(200).send(response);
                        }
                    })
                } else {
                    res.status(500).send("Invalid request!")
                }
            }
        })
    } else {
        res.status(500).send('ProductId and UserId are required field!')
    }

 })

 // SELECT p.product_id, p.product_name, p.sku_code, SUM(u.quantity) as total_users,  COUNT(u.user_id) as total_quantity,  p.price as subTotal FROM product_data p JOIN user_cart u WHERE u.product_id = p.product_id GROUP BY u.product_id

 /**
  * Question 6:
  * 
  */
router.get("/get-report", (req, res) => {
    // json2csv
    mysql.query("SELECT p.product_id, p.product_name, p.sku_code, SUM(u.quantity) as total_users,  COUNT(u.user_id) as total_quantity,  p.price as subTotal FROM product_data p JOIN user_cart u WHERE u.product_id = p.product_id GROUP BY u.product_id", 
    (err, data, fields) => {
        if (err) {
            res.status(500).send(err);
        } else {
            // res.send({
            //     data,
            //     fields
            // })
            const csv = json2csv.parse(data);
            res.header('Content-Type', 'text/csv');
            res.attachment("report.csv");
            res.send(csv);
            
        }
    });
})


module.exports = router;