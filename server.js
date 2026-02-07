const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
// const { MongoClient } = require('mongodb');
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const adminEntryForm = require('./model/adminEntryForm')
const employeeForm = require('./model/employeeForm')
const { application } = require('express');
var moment = require('moment');
const helmet = require("helmet");
var XLSX = require('xlsx');
const cors = require('cors');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://axis-precision-web-1dvc.vercel.app'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(helmet());
app.use('/', express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//set the static folder path
// app.use(express.static(path.resolve(__dirname,'public')));

const PORT = process.env.PORT || 9000;


const JWT_SECRET = 'sdjkfh8923yhjdksbfma@#*(&@*!^#&@bhjb2qiuhesdbhjdsfg839ujkdhfjk';
const password = 'IronMan';
const mongoUri = `mongodb+srv://admin:${password}@cluster0.b0eqn.mongodb.net/login-app-db?retryWrites=true&w=majority&appName=Cluster0`;
const alterMongoUri = 'mongodb://localhost:27017/login-app-db'; // Changed to standard MongoDB port

// Function to connect to MongoDB with fallback
const connectToMongoDB = async () => {
	const options = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		serverSelectionTimeoutMS: 10000,
		connectTimeoutMS: 20000,
		socketTimeoutMS: 45000,
		maxPoolSize: 10,
	};

	try {
		console.log('Attempting to connect to MongoDB Atlas...');
		await mongoose.connect(mongoUri, options);
		console.log('Connected successfully to MongoDB Atlas');
	} catch (atlasError) {
		console.error('MongoDB Atlas connection failed:', atlasError.message);
		console.log('Attempting to connect to local MongoDB...');
		
		try {
			await mongoose.connect(alterMongoUri, options);
			console.log('Connected successfully to local MongoDB');
		} catch (localError) {
			console.error('Local MongoDB connection failed:', localError.message);
			console.error('Both MongoDB connections failed. Please check your MongoDB setup.');
			process.exit(1);
		}
	}
};

// Connect to MongoDB
connectToMongoDB();

const db = mongoose.connection;
db.on("error", (err) => {
	console.error("MongoDB connection error:", err);
});
db.on("disconnected", () => {
	console.log("MongoDB disconnected");
});
db.once("open", function () {
  console.log("Connected successfully to MongoDB");
});

app.post('/api/change-password', async (req, res) => {
	const { token, newpassword: plainTextPassword } = req.body

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	try {
		const user = jwt.verify(token, JWT_SECRET)

		const _id = user.id

		const password = await bcrypt.hash(plainTextPassword, 10)

		await User.updateOne(
			{ _id },
			{
				$set: { password }
			}
		)
		res.json({ status: 'ok' })
	} catch (error) {
		console.log(error)
		res.json({ status: 'error', error: ';))' })
	}
})

app.post('/api/login', async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).lean()
	console.log("User Details app", username, password, user);
	const passwordN = await bcrypt.hash(password, 10)
	console.log('password hashed ', passwordN)
	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the username, password combination is successful

		const token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)

		return res.json({ status: 'ok', data: token, user: user.username })
	}
	res.json({ status: 'error', error: 'Invalid username/password' })
})

app.post('/api/register', async (req, res) => {
	// res.setHeader('Content-Type', 'application/json');
	console.log('req', req.body)
	const { username, password: plainTextPassword } = req.body
	
	if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	const password = await bcrypt.hash(plainTextPassword, 10)
	console.log('password hashed ', password)
	try {
		const response = await User.create({
			username,
			password
		})
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', error: 'Username already in use' })
		}
		throw error
	}

	res.json({ status: 'ok' })
})

app.post('/api/saveAdminForm', async(req, res) => {
	const { customerName, componentName, qty, dcno, internalJobOrder, supplierName, rawMaterialPricePerKg, materialGrade, rawMaterialCost } = req.body;
	console.log(req.body);
	try {
		const response = await adminEntryForm.create({
			customerName,
			componentName,
			qty,
			dcno,
			internalJobOrder,
			supplierName,
			rawMaterialPricePerKg,
			materialGrade,
			rawMaterialCost
		});
		return res.json({ status: 'ok', response: response });
	} catch(err) {
		return res.json({ status: 'error', error: 'Unable to save' })
	}
});

app.post('/api/employeeForm', async(req, res) => {
	const { 
		operatorName,
		date,
		shift,
		machine,
		customerName,
		componentName,
		qty,
		additionalQty,
		opn,
		progNo,
		settingTime,
		cycleTime,
		handlingTime,
		idleTime,
		startTime,
		endTime,
		remarks,
		internalJobOrder
	} = req.body;
	let finalDate = date;
	// if(String(date).includes('T') && moment(date).format('MM-DD-YYYY')) {
	// 	finalDate = moment(date).format('MM-DD-YYYY');
	// } else finalDate = moment(`${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`).format('MM-DD-YYYY')
	// let startDateFormatted = date;
	if(String(date).includes('T')) {
		finalDate = date;
	} else {
		let startDateFormatted = `${date.split('-')[1]}-${date.split('-')[0]}-${date.split('-')[2]}`;
		finalDate = new Date(startDateFormatted).toISOString()
	}

	console.log('date', date, 'moment', finalDate);
	try {
		const response = await employeeForm.create({
			operatorName,
			date: finalDate,
			shift,
			machine,
			customerName,
			componentName,
			qty,
			additionalQty,
			opn,
			progNo,
			settingTime,
			cycleTime,
			handlingTime,
			idleTime,
			startTime,
			endTime,
			remarks,
			internalJobOrder, // Ensure this field is included
		});
		console.log('employeeForm saved successfully: ', response);
		// const qtyUpdate = await adminEntryForm.findOneAndUpdate(
		// 	{ customerName: customerName, componentName: componentName },
		// 	{ $inc: { qty: -qty } },
		// 	{new: true}
		// );
		// console.log(qtyUpdate);&& qtyUpdate && Object.keys(qtyUpdate).length)
		if(response) { 
			return res.json({ status: 'ok', response: response });
		}
	} catch(err) {
		return res.json({ status: 'error', error: 'Unable to save' })
	}
});

app.get('/api/getEmployeeData', async (req, res) => {
  console.log('get call', req.query);
  const { startDate, endDate } = req.query;

  try {
    let queryStr = {};

    // Handle empty startDate - if startDate is empty, get all data up to endDate
    if (!startDate || startDate === '') {
      if (endDate) {
        const endDateFormatted = `${endDate.split('-')[1]}-${endDate.split('-')[0]}-${endDate.split('-')[2]}`;
        queryStr = {
          date: {
            $lt: moment(endDateFormatted).endOf('day').toDate().toISOString(),
          },
        };
      }
    } else {
      // Both startDate and endDate are provided
      const startDateFormatted = `${startDate.split('-')[1]}-${startDate.split('-')[0]}-${startDate.split('-')[2]}`;
      const endDateFormatted = `${endDate.split('-')[1]}-${endDate.split('-')[0]}-${endDate.split('-')[2]}`;

      if (String(startDate) === String(endDate)) {
        queryStr = {
          date: {
            $lt: moment(endDateFormatted).endOf('day').toDate().toISOString(),
          },
        };
      } else {
        queryStr = {
          date: {
            $gte: new Date(startDateFormatted).toISOString(),
            $lt: moment(endDateFormatted).endOf('day').toDate().toISOString(),
          },
        };
      }
    }

    console.log('queryStr', queryStr);

    const response = await employeeForm.find(queryStr).sort({ date: -1 });

    if (response) {
      console.log('response', response, response.length);
      return res.json(response);
    }
  } catch (err) {
    console.error('Error in getEmployeeData:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/getCustomerList', async(req, res) => {
	console.log('get call cus');
	try {
		response = await adminEntryForm.find({}, function(err, result) {
			if (err) {
			  console.log('err', err);
			  //res.send(err);
			  return err;
			} else {
			  	return result;
			} 
		});
		if(response) {
			//console.log('response', response, response.length);
			return res.json(response);
		}
	  } catch (err) {
		res.status(500).json({ message: err.message });
	  }
});

app.put('/api/updateAdmitEntryForm', async(req, res) => {
	console.log('req', req.body);
	try {
		response = await adminEntryForm.findOneAndUpdate({_id:req.body.id}, req.body, function(err, result) {
			if (err) {
			  console.log('err', err);
			  //res.send(err);
			  return err;
			} else {
			  	return result;
			} 
		});
		if(response) {
			console.log('response', response);
			return res.json({ status: 'ok', response: response });
		}
	  } catch (err) {
		res.status(500).json({ message: err.message });
	  }
});

app.put('/api/updateEmployeeForm', async(req, res) => {
	console.log(req.body, 'req');
	if(String(req.body.date).includes('T')) {
		finalDate = req.body.date;
	} else {
		let startDateFormatted = `${req.body.date.split('-')[1]}-${req.body.date.split('-')[0]}-${req.body.date.split('-')[2]}`;
		finalDate = new Date(startDateFormatted).toISOString()
	}

	console.log('date', req.body.date, 'moment', finalDate);
	req.body.date = finalDate;
	console.log('date after', req.body.date);
	try {
		response = await employeeForm.findOneAndUpdate({_id:req.body.id}, req.body, function(err, result) {
			if (err) {
			  console.log('err', err);
			  //res.send(err);
			  return err;
			} else {
			  	return result;
			} 
		});
		if(response) {
			console.log('response', response);
			return res.json({ status: 'ok', response: response });
		}
	  } catch (err) {
		console.log('err', err);
		res.status(500).json({ message: err.message });
	  }
});

app.get('/api/employeeForm', async(req, res) => {
	console.log('get call employee');
	try {
		response = await employeeForm.find({}, function(err, result) {
			if (err) {
			  console.log('err', err);
			  return err;
			} else {
			  	return result;
			} 
		});
		if(response) {
			return res.json(response);
		}
	  } catch (err) {
		res.status(500).json({ message: err.message });
	  }
});

app.get('/api/admin', async(req, res) => {
	console.log('get call admin');
	try {
		response = await adminEntryForm.find({}, function(err, result) {
			if (err) {
			  console.log('err', err);
			  return err;
			} else {
			  	return result;
			} 
		});
		if(response) {
			return res.json(response);
		}
	  } catch (err) {
		res.status(500).json({ message: err.message });
	  }
});

app.get('/api/downloadExcel', async(req, res) => {
	console.log('get call', req.query);
	const { startDate, endDate } = req.query;
	try {
		let response;
		let endDateFormatted = `${endDate.split('-')[1]}-${endDate.split('-')[0]}-${endDate.split('-')[2]}`;
		let startDateFormatted = `${startDate.split('-')[1]}-${startDate.split('-')[0]}-${startDate.split('-')[2]}`;
		let queryStr = {
			"date": {
				"$lt": moment(endDateFormatted).endOf('day').toDate().toISOString()
			}
		};
		if(req.query.startDate && (String(startDate) !== String(endDate))) {
			queryStr = {
				"date": {
					"$gte": new Date(startDateFormatted).toISOString(),
					"$lt": moment(endDateFormatted).endOf('day').toDate().toISOString()
				}
			}
		}
		console.log('queryStr', queryStr);
		var wb = XLSX.utils.book_new(); 
		response = await employeeForm.find(queryStr, function(err, result) {
			if (err) {
			  console.log('err', err);
			  return err;
			} else {
			  return result;
			}
		}).sort({ date: -1 });
		if(response) {
			console.log('response', response.length);
			var temp = JSON.stringify(response);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname+'/exportdata.xlsx'
			XLSX.utils.book_append_sheet(wb,ws,"sheet1");
			XLSX.writeFile(wb,down);
			res.download(down);
			console.log('ws', ws, 'res', res);
			return res;
		}
	  } catch (err) {
		res.status(500).json({ message: err.message });
	  }

	// console.log('downloadExcel', req.body);
	// const values = req.body;
	// let parsedValues = JSON.parse(values);
	// console.log('downloadExcel', req.body,'parsedValues', parsedValues);
	// const workbook = new excelJS.Workbook();
	// const worksheet = workbook.addWorksheet("Log_Sheet");
	// const path = "./files";

	// worksheet.columns = [ 
	// 	{ header: "Date", key: "date", width: 10 },
	// 	{ header: "Operator Name", key: "operatorName", width: 10 },
	// 	{ header: "Customer Name", key: "customerName", width: 10 },
	// 	{ header: "Component Name", key: "componentName", width: 10 },
	// 	{ header: "Shift", key: "shift", width: 10 },
	// 	{ header: "opn", key: "opn", width: 10 },
	// 	{ header: "Machine", key: "machine", width: 10 },
	// 	{ header: "qty", key: "qty", width: 10 },
	// 	{ header: "additionalQty", key: "additionalQty", width: 10 },
	// 	{ header: "progNo", key: "progNo", width: 10 },
	// 	{ header: "settingTime", key: "settingTime", width: 10 },
	// 	{ header: "cycleTime", key: "cycleTime", width: 10 },
	// 	{ header: "handlingTime", key: "handlingTime", width: 10 },
	// 	{ header: "idleTime", key: "idleTime", width: 10 },
	// 	{ header: "startTime", key: "startTime", width: 10 },
	// 	{ header: "endTime", key: "endTime", width: 10 },
	// 	{ header: "remarks", key: "remarks", width: 10 }
	// ];

	// let counter = 1;

	// values.forEach((user) => {
	// 	user.s_no = counter;
	// 	worksheet.addRow(user);
	// 	counter++;
	// });

	// worksheet.getRow(1).eachCell((cell) => {
	// 	cell.font = { bold: true };
	// });

	// try {
	// 	res.setHeader(
	// 		"Content-Type",
	// 		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	// 	);
	// 	res.setHeader("Content-Disposition", `attachment; filename=Log_Sheet.xlsx`);

	// 	return workbook.xlsx.write(res).then(() => {
	// 		//res.status(200);
	// 		res.send({
	// 			    status: "success",
	// 			    message: "file successfully downloaded"
	// 			  });
	// 	});

	// 	// await workbook.xlsx.writeFile(`${path}/users.xlsx`).then(() => {
	// 	//   res.send({
	// 	//     status: "success",
	// 	//     message: "file successfully downloaded",
	// 	//     path: `${path}/users.xlsx`,
	// 	//   });
	// 	// });
	// } catch (err) {
	// 	res.send({
	// 		status: "error",
	// 		message: "Something went wrong",
	// 	});
	// }
});


app.listen(PORT, () => console.log(`Listening on ${ PORT }`))

