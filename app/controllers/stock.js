const { Stock, Op, Customer } = require('../models');
const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { modifyAccess } = require('../permissions/stock');

exports.fetch = async (req, res) => {
	const schema = Joi.object({
		page: Joi.number(),
		limit: Joi.number(),
		id: Joi.number(),
		date: Joi.date().format('YYYY-MM-DD'),
		type: Joi.string(),
		info: Joi.string(),
		sort: Joi.string(),
		customer_id: Joi.number().integer().allow(null),
	});

	const { error } = schema.validate(req.query);

	if (error) {
		return res.status(400).send({
			status: 'error',
			message: error.message,
		});
	}

	const merchant_id = req.authUser.merchant_id;

	const page = req.query.page * 1 || 1;
	const idSearch = req.query.id * 1;
	const dateSearch = req.query.date;
	const typeSearch = req.query.type || null;
	const infoSearch = req.query.info || '';
	const customerSearch = req.query.customer_id * 1 || null;

	let sortBy = [['updated_at', 'desc']];
	const querysortBy = req.query.sort;

	if (querysortBy) {
		const sortCat = querysortBy.split('-');
		if (sortCat.length !== 2) {
			return res.status(400).send({
				status: 'error',
				message: 'Sort format is wrong',
			});
		}
		sortBy = [[sortCat[0], sortCat[1]]];
	}

	let limit = req.query.limit * 1;

	if (!limit) {
		limit = await Stock.count({
			where: {
				merchant_id: merchant_id || { [Op.not]: null },
			},
		});
	}

	const offset = (page - 1) * limit;

	const { count, rows } = await Stock.findAndCountAll({
		where: {
			id: idSearch || { [Op.not]: null },
			date: dateSearch ? new Date(dateSearch) : { [Op.not]: null },
			type: typeSearch || {
				[Op.not]: null,
			},
			info: infoSearch
				? {
						[Op.iLike]: `%${infoSearch}%`,
				  }
				: {
						[Op.or]: {
							[Op.iLike]: `%%`,
							[Op.is]: null,
						},
				  },
			merchant_id: merchant_id || { [Op.not]: null },
			customer_id: customerSearch || {
				[Op.or]: { [Op.is]: null, [Op.not]: null },
			},
		},
		include: ['customer'],
		order: sortBy,
		limit: limit,
		offset: offset,
	});

	let data = {
		rows,
	};

	if (merchant_id) {
		await Stock.findAll({
			where: {
				merchant_id: req.authUser.merchant_id,
			},
		}).then((stocks) => {
			let stockIncrease = [];
			let stockDecrease = [];

			stocks.map((stock) => {
				if (stock.type === 'buy' || stock.type === 'return') {
					stockIncrease.push(stock.quantity);
				} else {
					stockDecrease.push(stock.quantity);
				}
			});

			data.stock =
				stockIncrease.reduce((a, b) => a + b, 0) -
				stockDecrease.reduce((a, b) => a + b, 0);
		});
	}

	res.send({
		status: 'success',
		totalData: count,
		totalPage: Math.ceil(count / limit),
		page: page,
		data,
	});
};

const typeCondition = (type) => {
	if (type === 'sell' || type === 'borrow' || type === 'return') {
		return 1;
	} else if (type === 'buy') {
		return 2;
	} else {
		return 0;
	}
};

exports.add = async (req, res) => {
	const schema = Joi.object({
		date: Joi.date().format('YYYY-MM-DD').required(),
		type: Joi.string().required(),
		quantity: Joi.number().required(),
		info: Joi.string().allow(null),
		customer_id: Joi.number().allow(null),
	});

	const { error } = schema.validate(req.body);

	if (error) {
		return res.status(400).send({
			status: 'error',
			message: error.message,
		});
	}

	const date = req.body.date;
	const type = req.body.type;
	const quantity = req.body.quantity;
	const info = req.body.info;
	const customer_id = req.body.customer_id;

	const valType = typeCondition(type);

	if (valType === 1) {
		if (!customer_id) {
			return res.status(400).send({
				status: 'error',
				message:
					'customer_id is required if the type is sell, borrow, or return',
			});
		}
	} else if (valType === 2) {
		if (customer_id) {
			return res.status(400).send({
				status: 'error',
				message: 'customer_id is not required if the type is buy',
			});
		}
	} else {
		return res.status(400).send({
			status: 'error',
			message: 'Type is unknown',
		});
	}

	if (customer_id) {
		const customer = await Customer.findByPk(customer_id);

		if (!customer) {
			return res.status(400).send({
				status: 'error',
				message: 'Customer not found',
			});
		}

		if (!modifyAccess(req.authUser, customer)) {
			return res.status(403).send('Forbidden');
		}
	}

	const data = await Stock.create({
		date,
		quantity,
		type,
		info,
		customer_id,
		merchant_id: req.authUser.merchant_id,
	});

	res.send({
		status: 'success',
		data,
	});
};

exports.edit = async (req, res) => {
	const id = req.params.stocks_id;

	const stock = await Stock.findOne({
		where: {
			id,
		},
	});

	if (!stock) {
		return res.status(400).send({
			status: 'error',
			message: 'Item not found',
		});
	}

	if (!modifyAccess(req.authUser, stock)) {
		return res.status(403).send('Forbidden');
	}

	const schema = Joi.object({
		date: Joi.date().format('YYYY-MM-DD'),
		type: Joi.string(),
		quantity: Joi.number().integer().min(0),
		info: Joi.string().allow(null),
		customer_id: Joi.number().allow(null),
	});

	const { error } = schema.validate(req.body);

	if (error) {
		return res.status(400).send({
			status: 'error',
			message: error.message,
		});
	}

	const date = req.body.date;
	const type = req.body.type;
	const quantity = req.body.quantity;
	const info = req.body.info;
	const customer_id = req.body.customer_id;

	if (date) {
		stock.date = date;
	}

	if (info !== undefined) {
		stock.info = info;
	}

	let valType = typeCondition(stock.type);

	if (type) {
		valType = typeCondition(type);
		if (valType === 2) {
			stock.customer_id = null;
		} else if (!valType) {
			return res.status(400).send({
				status: 'error',
				message: 'Type is unknown',
			});
		}
		stock.type = type;
	}
	if (!isNaN(quantity)) {
		stock.quantity = quantity;
	}
	if (!customer_id) {
		if (valType === 1) {
			return res.status(400).send({
				status: 'error',
				message:
					'customer_id is required if the type is sell, borrow, or return',
			});
		}
	} else {
		if (valType === 2) {
			return res.status(400).send({
				status: 'error',
				message: 'customer_id is not allowed if the type is buy',
			});
		}

		const customer = await Customer.findByPk(customer_id);

		if (!customer) {
			return res.status(400).send({
				status: 'error',
				message: 'Customer not found',
			});
		}

		if (!modifyAccess(req.authUser, customer)) {
			return res.status(403).send('Forbidden');
		}

		stock.customer_id = customer_id;
	}
	stock.save();

	res.send({
		status: 'success',
		data: stock,
	});
};

exports.delete = async (req, res) => {
	const id = req.params.stocks_id * 1;

	const stock = await Stock.findByPk(id);

	if (!stock) {
		return res.status(400).send({
			status: 'error',
			message: 'Item not found',
		});
	}

	if (!modifyAccess(req.authUser, stock)) {
		return res.status(403).send('Forbidden');
	}

	stock.destroy();

	res.send({
		status: 'success',
		data: stock,
	});
};

exports.report = async (req, res) => {
	const schema = Joi.object({
		date: Joi.date().format('YYYY-MM-DD'),
		name: Joi.string(),
	});

	const { error } = schema.validate(req.query);

	if (error) {
		return res.status(400).send({
			status: 'error',
			message: error.message,
		});
	}

	const date = req.query.date;

	// send data about who's still borrowing an item
	const stocks = await Stock.findAll({
		where: {
			type: {
				[Op.or]: ['borrow', 'return'],
			},
			date: date
				? new Date(date)
				: {
						[Op.not]: null,
				  },
			merchant_id: req.authUser.merchant_id || {
				[Op.not]: null,
			},
		},
	});

	let customersArray = [];

	stocks.map((stock) => {
		if (customersArray.indexOf(stock.customer_id) < 0) {
			customersArray.push(stock.customer_id);
		}
	});

	let customersBorrowReturn = [];

	if (stocks.length !== 0) {
		let totalBorrowedGallons = 0;
		customersArray.map(async (customer_id) => {
			const customer = await Customer.findByPk(customer_id);

			const involvedTransactions = await Stock.findAll({
				where: {
					type: {
						[Op.or]: ['borrow', 'return'],
					},
					customer_id,
					date: date
						? new Date(date)
						: {
								[Op.not]: null,
						  },
					merchant_id: req.authUser.merchant_id || {
						[Op.not]: null,
					},
				},
			});

			let borrows = [];
			let returns = [];

			involvedTransactions.forEach((transaction) => {
				if (transaction.type === 'borrow') {
					borrows.push(transaction.quantity);
				} else {
					returns.push(transaction.quantity);
				}
			});

			const reduceBorrow = borrows.reduce((a, b) => a + b, 0);
			const reduceReturn = returns.reduce((a, b) => a + b, 0);
			const total = reduceBorrow - reduceReturn;

			customersBorrowReturn.push({
				customer_id,
				name: customer.name,
				borrows: reduceBorrow,
				returns: reduceReturn,
				owed: total,
				involvedTransactions,
			});

			totalBorrowedGallons += total;

			if (customersArray.length === customersBorrowReturn.length) {
				return res.send({
					status: 'success',
					data: {
						totalBorrowedGallons,
						transactions: customersBorrowReturn,
					},
				});
			}
		});
	} else {
		res.send({
			status: 'success',
			data: [],
		});
	}
};
