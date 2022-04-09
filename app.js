const express = require('express');
const session = require('express-session')
const app = express();
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const { Parser} = require('json2csv');
const fs = require('fs');
const { timeStamp } = require('console');
const {
	DB_URI,
	DB_NAME,
	PORT,
	SESS_LIFETIME,
	NODE_ENV,
	SESS_NAME,
	SESS_SECRET,
	PASSWORD
} =  process.env
const users = [{ id: 1, username:'admin', password:PASSWORD}]
const IN_PROD = NODE_ENV === 'production';
const redirectLogin = (req, res, next) => {
	console.log('login')
	if (!req.session.userId) {
		res.redirect('/login')
	}
	else {
		next()
	}
}
const redirectHome = (req, res, next) => {
	console.log('redirect')
	if ( req.session.userId) {
		res.redirect('/')
	}
	else{
		next()
	}
}

app.use(express.static(`${__dirname}static`));
app.use('/static', express.static(path.join(__dirname, '/static')));
app.use(session({
	name: SESS_NAME,
	resave: false,
	saveUninitialized: false,
	secret: SESS_SECRET,
	cookie: {
		maxAge: Number(SESS_LIFETIME),
		sameSite: true,
		secure: IN_PROD,
	}
}))
app.set('views', './views');
app.set('view engine', 'ejs');

// connect 
let db = null;
async function connectDB() {
	const uri = DB_URI;
	const options = { useUnifiedTopology: true };
	const client = new MongoClient(uri, options);
	await client.connect();
	db = await client.db(DB_NAME);
}
connectDB();
try {
	console.log('We have made a connection to Mongo!');
} catch (error) {
	console.log(error);
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/login',  async (req, res) => {
	res.render('login')
})
 
app.post('/login', redirectHome, async (req, res) => {
	const { username, password } = req.body

	if(username && password) {
		const user = users.find(
			user => user.username === username && user.password === password
		)
		if (user) {
			req.session.userId = user.id
		return res.redirect('/')
		}
	}
	res.redirect('login')
})
app.post('/logout', async(req, res, next) => {
req.session.destroy(function(err) {
		console.log('logout')
	}) 
	res.redirect('login')
})

app.get('/', redirectLogin, async (req, res) => {
	const sausjes = await db.collection('extra').find().toArray();
	const sausjesGroot = await db.collection('extraGroot').find().toArray();
	const extraSnack = await db.collection('extraSnack').find().toArray();
	// const aantalStengel = await db.collection('extraStengel').find().toArray();
	// const aantalBitter = await db.collection('extraBitter').find().toArray();
	// const aantalNugget = await db.collection('extraNugget').find().toArray();
	const products = await db.collection('products').find().toArray();
	const productCategories = await db.collection('product-categories').find().toArray();
	const orders = await db.collection('orders').aggregate(
		[
			{ 
				$match : { 
					paid : 0 
				} 
			},
			{
				$lookup: {
					from: 'order-products',
					localField: 'id',
					foreignField: 'order_id',
					as: 'order_products'
				}
			},
			{
				$unwind: {
					"path": '$products',
					"preserveNullAndEmptyArrays": true
				}
			},
			{
				$lookup: {
					from: 'products',
					localField: 'products.order_products.product_id',
					foreignField: 'id',
					as: 'products'
				}
			}
		]
	).toArray();
	const categories = await db.collection('categories').aggregate([
		{
			$lookup: {
				from: 'product-categories',
				localField: '_id',
				foreignField: 'category_id',
				as: 'categories.products'
			}
		},
		{
			$unwind: {
				"path": '$products',
				"preserveNullAndEmptyArrays": true
			}
		},
		{
			$lookup: {
				from: 'products',
				localField: 'categories.products.product_id',
				foreignField: '_id',
				as: 'products'
			}
		}
	]).toArray();

	const openOrder = await db.collection('orders').aggregate(
		[
			{ 
				$match : { 
					paid : 1,
					done: 0
				} 
			}
		]
	).toArray()

	const counting = await db.collection('orders').find().toArray();

    res.render('index', {
		money,
		sausjes: sausjes,
		sausjesGroot: sausjesGroot,
		extraSnack: extraSnack,
		// bitter: aantalBitter,
		// nugget: aantalNugget,
		// stengel: aantalStengel,
		products: products, 
		productCategories: productCategories,
		categories: categories,
		order: orders[0],
		openOrder: openOrder.length,
		counting: counting.length
	})	
});

  app.post('/add', async (req, res) => {
	var order_product = await db.collection('order-products').findOne( {order_id: req.body.order_id, product_id: req.body.product_id, extra_price: req.body.extra_price , extra_title: req.body.extra_title} );
	if (order_product) {
		var new_quantity = parseInt(order_product['quantity']) + parseInt(req.body.quantity);
		var test = await db.collection('order-products').updateOne( 
			{order_id: req.body.order_id, product_id: req.body.product_id, extra_price: req.body.extra_price , extra_title: req.body.extra_title},
			{ $set: { 'quantity': new_quantity}}
		)
		res.redirect('/')
	} else {
		db.collection('order-products').insertOne(req.body, (err, result) => {
			if (err) return console.log(err)
		   res.redirect('/')
	  })
	}
  })

  app.post('/delete/:id', (req, res) => {
	db.collection('order-products').deleteOne({_id: ObjectId(req.params.id)}, (err, result) => {
	  if (err) return console.log(err)
	  res.redirect('/')
	})
  })

  app.post('/order', async (req, res) => {
	if( req.body.total_price > 0) {	
	const payment = req.body.payment
	db.collection('orders').updateOne(
		{paid: 0,
		total_price: 0,
		ts: 0,
		count: 0,
		payment: String},
		{$set:{ paid: 1, total_price: (req.body.total_price),ts: new Date(), payment: payment, count: (req.body.count)}},
	)
	var afrekenen =  await db.collection('orders').insertOne({
		id: 0,
		count: 0,
		done: 0,
		paid: 0,
		export: 0,
		total_price: 0,
		ts: 0,
		payment: String
	})
	var afrekenen = db.collection('orders').updateOne({
		id: 0,
	},
	{$set:{ id: afrekenen.insertedId.toString()}
  })
  res.redirect('/?message=Order-placed-succesfull')
}
else { 
	console.log('nope')
	}
	res.redirect('/?error=Failed-to-place-order')
})
  
app.get('/orders', redirectLogin, async (req, res) => {
	const products = await db.collection('products').find().toArray();
	const openOrders = await db.collection('orders').aggregate(
		[
			{ 
				$match : { 
					paid :  1,
					done : 0
				} 
			},
			{
				$lookup: {
					from: 'order-products',
					localField: 'id',
					foreignField: 'order_id',
					as: 'order_products'
				}
			},
			{
				$unwind: {
					"path": '$products',
					"preserveNullAndEmptyArrays": true
				}
			},
			{
				$lookup: {
					from: 'products',
					localField: 'products.order_products.product_id',
					foreignField: 'id',
					as: 'products'
				}
			}
		]
	).toArray();
	
	const closedOrders = await db.collection('orders').aggregate(
		[
			{ 
				$match : { 
					paid :  1,
					done : 1,
					export : 0
				} 
			},
			{
				$lookup: {
					from: 'order-products',
					localField: 'id',
					foreignField: 'order_id',
					as: 'order_products'
				}
			},
			{
				$unwind: {
					"path": '$products',
					"preserveNullAndEmptyArrays": true
				}
			},
			{
				$lookup: {
					from: 'products',
					localField: 'products.order_products.product_id',
					foreignField: 'id',
					as: 'products'
				}
			}
		]
	).toArray();

    res.render('orders', {
		money,
		products: products, 
		openOrders: openOrders,
		closedOrders: closedOrders,
	})	
});

app.post('/done/:id',  (req, res) => {
	db.collection('orders').updateOne({_id: ObjectId(req.params.id), done: 0},
	{$set:{ done: 1}
  })
  res.redirect('/orders?message=Order-closed')
})

app.post('/export', async (req, res) => {
var exported = 0;
	if( await db.collection('orders').find({done:1, paid:1, export:0}).count() >= 1) {	
		await db.collection('orders').aggregate(
			[
				{ 
					$match : { 
						paid :  1,
						done : 1,
						export : 0
					} 
				},
				{
					$lookup: {
						from: 'order-products',
						localField: 'id',
						foreignField: 'order_id',
						as: 'order_products'
					}
				},
				{
					$unwind: {
						"path": '$products',
						"preserveNullAndEmptyArrays": true
					}
				},
				{
					$lookup: {
						from: 'products',
						localField: 'products.order_products.product_id',
						foreignField: 'id',
						as: 'products'
					}
				}
			]
		).toArray(function(err, res) {
			
			var res_total = [];
			var order_i = 0;
			res.forEach(function(order){
				order_i++;
				var order_product_i = 0;
				order.order_products.forEach(function(product){
					order_product_i++;
					var line_i = order_i +'_'+ order_product_i;

					var curProduct = [];
					order.products.forEach(function(mainproduct){
						if(mainproduct._id==product.product_id){
							curProduct=mainproduct
						}
					});
					res_total.push({
						'ts': order['ts'],
						'id': order['_id'],
						'payment': order['payment'],
						'total_price': order['total_price'],
						'prd_id': product['product_id'],
						'qty': product['quantity'],
						'extra_price': product['extra_price'],
						'extra_title': product['extra_title'],
						'title': curProduct['title'],
						'price': curProduct['price']
					});
				});
			});
			if (err) throw err;
			const fields = ['id', 'payment', 'qty'];
			const opts = { fields };
			const { parse } = require('json2csv');
			try{
				const csv = parse(res_total)
				fs.writeFile('static/order.csv', csv, function(res_total) {
					exported = 1;
				})
			}
			catch(err){
				console.error(err);
			}
		})
	};
	db.collection('orders').updateMany({export: 0, done: 1},
		{$set:{ export: 1}
	})
	var interval = setInterval(function(){
		if (exported == 1) {
			res.redirect('/orders?message=Export-succesfull');
			clearInterval(interval);
		}
		else{
			res.redirect('/orders?error=Failed-to-export');
			clearInterval(interval);
		}
	}, 100)
})

app.get('/export', function(req,res) {
	res.download('order.csv'), function(err){
		console.log(err)
	}
})

function money(price) { 
	if (price) 
		{ price=parseFloat(price).toFixed(2); price +='' ; var shopCurrency='€' ; var
        	x=price.split('.'); var x1=x[0]; var x2=x.length> 1 ? '.' + x[1] : '';
        	var rgx = /(\d+)(\d{3})/;
        	while (rgx.test(x1)) {
        		x1 = x1.replace(rgx, '$1' + ',' + '$2');
        	}
        	var x3 = (x1 + x2).split('.');
        	var x4 = x3[0].replace(',', '.') + ',' + x3[1];
        	var priceMoney = shopCurrency + '' + x4;
        } else {
        	var priceMoney = '';
        }
        return priceMoney;
}

app.use((req, res) => {
	res.status(404).send('this page does not exist.');
});

app.listen(PORT || 8000, () => {
	console.log('example app listening at ${port}!');
});